import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;

// A tiny in-memory stand-in for the tables the payment code touches.
const db = vi.hoisted(() => ({
  memberships: new Map<string, Record<string, unknown>>(),
  events: new Map<string, { processedAt: Date | null }>(),
}));

const emails = vi.hoisted(() => ({
  activated: vi.fn(),
  paymentFailed: vi.fn(),
  canceled: vi.fn(),
  unmatched: vi.fn(),
}));

// What Stripe "currently" says, as opposed to the snapshot inside an event.
const stripeState = vi.hoisted(() => ({
  subscription: null as unknown,
  sessions: new Map<string, unknown>(),
}));

const PLAN = { nameEn: "Mabel Check-In", monthlyCents: 20000 };

vi.mock("@/server/db", () => ({
  prisma: {
    stripeEvent: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const row = db.events.get(where.id);
        return row ? { id: where.id, ...row } : null;
      }),
      create: vi.fn(async ({ data }: { data: { id: string } }) => {
        if (db.events.has(data.id)) {
          throw new Prisma.PrismaClientKnownRequestError("duplicate", {
            code: "P2002",
            clientVersion: "test",
          });
        }
        db.events.set(data.id, { processedAt: null });
        return data;
      }),
      update: vi.fn(
        async ({ where, data }: { where: { id: string }; data: { processedAt: Date } }) => {
          db.events.set(where.id, { processedAt: data.processedAt });
        },
      ),
    },
    membership: {
      findUnique: vi.fn(
        async ({
          where,
          include,
        }: {
          where: { id?: string; stripeSubscriptionId?: string };
          include?: unknown;
        }) => {
          const row = where.id
            ? db.memberships.get(where.id)
            : [...db.memberships.values()].find(
                (item) => item.stripeSubscriptionId === where.stripeSubscriptionId,
              );
          if (!row) return null;
          return include ? { ...row, plan: PLAN } : { ...row };
        },
      ),
      findMany: vi.fn(async () =>
        [...db.memberships.values()]
          .filter((row) => row.status === "PENDING")
          .map((row) => ({ ...row })),
      ),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Row }) => {
        const next = { ...db.memberships.get(where.id), ...data };
        db.memberships.set(where.id, next);
        return next;
      }),
      // Conditional update: the heart of "only one event wins the transition".
      updateMany: vi.fn(
        async ({ where, data }: { where: { id: string; status: string }; data: Row }) => {
          const row = db.memberships.get(where.id);
          if (!row || row.status !== where.status) return { count: 0 };
          db.memberships.set(where.id, { ...row, ...data });
          return { count: 1 };
        },
      ),
      deleteMany: vi.fn(async ({ where }: { where: { id: string; status: string } }) => {
        const row = db.memberships.get(where.id);
        if (row && row.status === where.status) db.memberships.delete(where.id);
      }),
    },
  },
}));

vi.mock("@/server/email/notifications", () => ({
  sendMembershipActivatedEmails: emails.activated,
  sendPaymentFailedEmails: emails.paymentFailed,
  sendMembershipCanceledEmail: emails.canceled,
  sendUnmatchedPaymentAlert: emails.unmatched,
}));

vi.mock("@/server/stripe", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/stripe")>()),
  retrieveSubscription: async () => {
    // Yield like a real network call, so concurrent handlers interleave.
    await new Promise((resolve) => setTimeout(resolve, 1));
    if (!stripeState.subscription) throw new Error("Stripe unavailable");
    return stripeState.subscription;
  },
  getStripe: () => ({
    checkout: {
      sessions: {
        retrieve: async (id: string) => {
          const session = stripeState.sessions.get(id);
          if (!session) throw new Error("Stripe unavailable");
          return session;
        },
      },
    },
  }),
}));

import { reconcilePendingMemberships } from "@/server/memberships";
import { handleStripeEvent } from "@/server/stripe-webhook";

const PERIOD_END = 1_900_000_000;
const HOUR = 60 * 60 * 1000;

function subscription(
  status: Stripe.Subscription.Status,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: "sub_1",
    status,
    customer: "cus_1",
    cancel_at_period_end: false,
    metadata: { membershipId: "m_1" },
    items: { data: [{ current_period_end: PERIOD_END, price: { id: "price_1" } }] },
    ...overrides,
  };
}

function event(id: string, type: string, object: unknown): Stripe.Event {
  return { id, type, data: { object } } as unknown as Stripe.Event;
}

const checkoutCompleted = (id: string) =>
  event(id, "checkout.session.completed", {
    id: "cs_1",
    mode: "subscription",
    subscription: "sub_1",
    client_reference_id: "m_1",
    metadata: { membershipId: "m_1" },
  });

function pendingMembership(overrides: Record<string, unknown> = {}) {
  return {
    id: "m_1",
    status: "PENDING",
    stripeCheckoutSessionId: "cs_1",
    stripeSubscriptionId: null,
    stripeCustomerId: null,
    stripePriceId: null,
    currentPeriodEnd: null,
    canceledAt: null,
    createdAt: new Date(Date.now() - 2 * HOUR),
    ...overrides,
  };
}

beforeEach(() => {
  db.memberships.clear();
  db.events.clear();
  stripeState.sessions.clear();
  vi.clearAllMocks();
  db.memberships.set("m_1", pendingMembership());
  stripeState.subscription = subscription("active");
});

describe("handleStripeEvent", () => {
  it("activates a pending membership when checkout completes", async () => {
    const outcome = await handleStripeEvent(checkoutCompleted("evt_1"));

    expect(outcome).toBe("processed");
    expect(db.memberships.get("m_1")).toMatchObject({
      status: "ACTIVE",
      stripeSubscriptionId: "sub_1",
      stripeCustomerId: "cus_1",
      stripePriceId: "price_1",
      currentPeriodEnd: new Date(PERIOD_END * 1000),
    });
    expect(emails.activated).toHaveBeenCalledTimes(1);
  });

  it("ignores a replayed event: nothing changes and no second email", async () => {
    await handleStripeEvent(checkoutCompleted("evt_1"));
    const outcome = await handleStripeEvent(checkoutCompleted("evt_1"));

    expect(outcome).toBe("duplicate");
    expect(emails.activated).toHaveBeenCalledTimes(1);
  });

  it("welcomes a new member once when their events are handled at the same moment", async () => {
    // A real sign-up emits all three within a second, on separate instances.
    const invoice = { parent: { subscription_details: { subscription: "sub_1" } } };
    await Promise.all([
      handleStripeEvent(checkoutCompleted("evt_1")),
      handleStripeEvent(
        event("evt_2", "customer.subscription.updated", subscription("active")),
      ),
      handleStripeEvent(event("evt_3", "invoice.paid", invoice)),
    ]);

    expect(db.memberships.get("m_1")).toMatchObject({ status: "ACTIVE" });
    expect(emails.activated).toHaveBeenCalledTimes(1);
  });

  it("finds the membership through metadata when events arrive out of order", async () => {
    // subscription.updated before checkout.session.completed: the membership
    // has no subscription id yet.
    const outcome = await handleStripeEvent(
      event("evt_1", "customer.subscription.updated", subscription("active")),
    );

    expect(outcome).toBe("processed");
    expect(db.memberships.get("m_1")).toMatchObject({ status: "ACTIVE" });
    expect(emails.activated).toHaveBeenCalledTimes(1);
  });

  it("marks the membership past due once, when a payment fails", async () => {
    await handleStripeEvent(checkoutCompleted("evt_1"));
    stripeState.subscription = subscription("past_due");

    const invoice = { parent: { subscription_details: { subscription: "sub_1" } } };
    await handleStripeEvent(event("evt_2", "invoice.payment_failed", invoice));
    await handleStripeEvent(event("evt_3", "invoice.payment_failed", invoice));

    expect(db.memberships.get("m_1")).toMatchObject({ status: "PAST_DUE" });
    expect(emails.paymentFailed).toHaveBeenCalledTimes(1);
  });

  it("reads the subscription from an invoice in the older event shape too", async () => {
    await handleStripeEvent(checkoutCompleted("evt_1"));
    stripeState.subscription = subscription("past_due");

    await handleStripeEvent(
      event("evt_2", "invoice.payment_failed", { subscription: "sub_1" }),
    );

    expect(db.memberships.get("m_1")).toMatchObject({ status: "PAST_DUE" });
  });

  it("returns to active when a later invoice is paid", async () => {
    await handleStripeEvent(checkoutCompleted("evt_1"));
    stripeState.subscription = subscription("past_due");
    const invoice = { parent: { subscription_details: { subscription: "sub_1" } } };
    await handleStripeEvent(event("evt_2", "invoice.payment_failed", invoice));

    stripeState.subscription = subscription("active");
    await handleStripeEvent(event("evt_3", "invoice.paid", invoice));

    expect(db.memberships.get("m_1")).toMatchObject({ status: "ACTIVE" });
    // Recovering from past due is not a new sign-up.
    expect(emails.activated).toHaveBeenCalledTimes(1);
  });

  it("records a scheduled cancellation without ending the membership", async () => {
    await handleStripeEvent(checkoutCompleted("evt_1"));
    stripeState.subscription = subscription("active", { cancel_at_period_end: true });
    await handleStripeEvent(
      event("evt_2", "customer.subscription.updated", stripeState.subscription),
    );

    expect(db.memberships.get("m_1")).toMatchObject({
      status: "ACTIVE",
      cancelAtPeriodEnd: true,
      canceledAt: null,
    });
    expect(emails.canceled).not.toHaveBeenCalled();
  });

  it("ends the membership and tells the owner when the subscription is deleted", async () => {
    await handleStripeEvent(checkoutCompleted("evt_1"));
    stripeState.subscription = subscription("canceled");
    await handleStripeEvent(
      event("evt_2", "customer.subscription.deleted", subscription("canceled")),
    );

    const membership = db.memberships.get("m_1");
    expect(membership).toMatchObject({ status: "CANCELED" });
    expect(membership?.canceledAt).toBeInstanceOf(Date);
    expect(emails.canceled).toHaveBeenCalledTimes(1);
  });

  it("does not revive an ended membership when an old event arrives late", async () => {
    await handleStripeEvent(checkoutCompleted("evt_1"));
    stripeState.subscription = subscription("canceled");
    await handleStripeEvent(
      event("evt_2", "customer.subscription.deleted", subscription("canceled")),
    );

    // A delayed retry carrying a snapshot from when it was still active.
    // Stripe's current state (canceled) is what counts.
    await handleStripeEvent(
      event("evt_3", "customer.subscription.updated", subscription("active")),
    );
    await handleStripeEvent(
      event("evt_4", "customer.subscription.updated", subscription("past_due")),
    );

    expect(db.memberships.get("m_1")).toMatchObject({ status: "CANCELED" });
    expect(emails.activated).toHaveBeenCalledTimes(1);
    expect(emails.paymentFailed).not.toHaveBeenCalled();
  });

  it("alerts the owner when a paid checkout matches no sign-up record", async () => {
    db.memberships.clear();
    const outcome = await handleStripeEvent(checkoutCompleted("evt_1"));

    expect(outcome).toBe("ignored");
    expect(emails.unmatched).toHaveBeenCalledTimes(1);
    expect(emails.unmatched.mock.calls[0][0]).toMatchObject({
      sessionId: "cs_1",
      subscriptionId: "sub_1",
    });
  });

  it("ignores events it does not handle and unknown memberships", async () => {
    expect(await handleStripeEvent(event("evt_1", "customer.created", {}))).toBe("ignored");
    stripeState.subscription = subscription("active", { id: "sub_other", metadata: {} });
    expect(
      await handleStripeEvent(
        event("evt_2", "customer.subscription.updated", stripeState.subscription),
      ),
    ).toBe("ignored");
  });

  it("processes Stripe's retry when the first attempt failed part-way", async () => {
    stripeState.subscription = null; // Stripe unreachable: the handler throws
    await expect(handleStripeEvent(checkoutCompleted("evt_1"))).rejects.toThrow();
    // Received, but not marked as done.
    expect(db.events.get("evt_1")).toEqual({ processedAt: null });

    stripeState.subscription = subscription("active");
    expect(await handleStripeEvent(checkoutCompleted("evt_1"))).toBe("processed");
    expect(db.memberships.get("m_1")).toMatchObject({ status: "ACTIVE" });
    expect(await handleStripeEvent(checkoutCompleted("evt_1"))).toBe("duplicate");
  });
});

describe("reconcilePendingMemberships", () => {
  it("activates a sign-up that was paid but whose webhook never arrived", async () => {
    stripeState.sessions.set("cs_1", { status: "complete", subscription: "sub_1" });

    await reconcilePendingMemberships();

    expect(db.memberships.get("m_1")).toMatchObject({
      status: "ACTIVE",
      stripeSubscriptionId: "sub_1",
    });
    expect(emails.activated).toHaveBeenCalledTimes(1);
  });

  it("removes a sign-up whose checkout expired unpaid", async () => {
    stripeState.sessions.set("cs_1", { status: "expired", subscription: null });

    await reconcilePendingMemberships();

    expect(db.memberships.has("m_1")).toBe(false);
  });

  it("keeps a checkout that is still open", async () => {
    stripeState.sessions.set("cs_1", { status: "open", subscription: null });

    await reconcilePendingMemberships();

    expect(db.memberships.get("m_1")).toMatchObject({ status: "PENDING" });
  });

  it("never deletes on age alone while Stripe cannot be asked", async () => {
    // No session registered: the fake Stripe throws, as an outage would.
    db.memberships.set(
      "m_1",
      pendingMembership({ createdAt: new Date(Date.now() - 30 * 24 * HOUR) }),
    );

    await reconcilePendingMemberships();

    expect(db.memberships.get("m_1")).toMatchObject({ status: "PENDING" });
  });
});
