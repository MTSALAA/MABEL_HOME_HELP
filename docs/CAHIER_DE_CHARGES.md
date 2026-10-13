# Mabel Home Help — Cahier des charges (Project Specification)

| | |
|---|---|
| **Client** | Mabel Home Help, Edmonton, Alberta, Canada |
| **Project** | Public marketing website + owner admin dashboard |
| **Source** | `Mabel_Home_Help_Website_Developer_Brief.pdf` (2 pages) |
| **Version** | 1.3 — 2026-10-13 |
| **Status** | Built and audited; see sections 20 and 21. Remaining client answers in section 18 |
| **Languages** | English (default) and Canadian French |

---

## 1. Context and goals

Mabel Home Help provides affordable, friendly, **non-medical** assistance to seniors, people with disabilities and families who need extra help with everyday tasks.

- **Tagline:** Small jobs. Friendly visits. Peace of mind.
- **Mission:** Help families feel comfortable knowing their loved ones have someone reliable to assist with everyday tasks.
- **Service area:** Edmonton, St. Albert, Sherwood Park, surrounding communities and acreages.

### Goals of the website

1. Explain clearly what the business does and does not do.
2. Make it effortless to call, text, or request a service, on a phone, for a senior.
3. Let the owner update services, pricing and contact information without a developer.
4. Collect service requests and sponsor inquiries in one place the owner can manage.
5. Let families buy a monthly membership online, by card, without a phone call.
6. Serve every visitor in English or French.

### Success criteria

- A visitor can reach a Call / Text / Book action from any page in one tap.
- A family member can subscribe to a monthly plan in under three minutes on a phone.
- Every public page, form, email and error message exists in both languages.
- The owner can change a price or the phone number and see it live in under a minute.
- No booking request is ever lost: each one is stored in the database and emailed to the owner.

---

## 2. Scope

### In scope (v1)

- Public site: Home, Services, Membership & Pricing, Membership sign-up, Book a Service, About Us, Contact, Sponsor a Senior, Privacy Policy, Terms.
- Online purchase of monthly memberships with Stripe (recurring card billing), plus self-service cancellation and card update through the Stripe customer portal.
- Bilingual public site: English and Canadian French, including forms, emails and SEO metadata.
- Admin dashboard: login, services, plans, members, site settings, booking requests inbox, sponsor inquiries inbox, admin users.
- Email notifications to the owner and confirmation emails to visitors.
- Responsive, accessible design in green and cream.
- Brand assets created in-project as SVG: logo, favicon, service illustrations, hero and section illustrations, social share image.
- SEO basics and local business structured data.
- Deployment, domain connection, owner training.

### Out of scope (v1) — quoted separately if requested

- Online donations or payments for Sponsor a Senior.
- Online payment for per-visit (Quick Drop) and custom-quote services; these stay request-based.
- Real-time booking calendar with time slots or staff scheduling.
- Client or family login portal ("Family Updates" is a described service, not a feature). Members manage billing through Stripe's hosted portal, not a site account.
- Languages other than English and French; a French admin interface.
- Blog, testimonials management, live chat.
- Native mobile app.

---

## 3. Users

| User | Needs | Notes |
|---|---|---|
| **Senior** | Read easily, find the phone number, call | Low vision, low tech confidence, often on a tablet or phone |
| **Family member** | Understand services and pricing, request a visit | Usually 40–65, on mobile, comparing options |
| **Community supporter** | Learn how to sponsor a senior | Low frequency |
| **Owner (admin)** | Edit content, handle requests | Non-technical; uses phone and laptop |

---

## 4. Sitemap

Public routes exist in both languages. English has no prefix; French lives under `/fr` with the same path segments (for example `/fr/services`).

```
/                       Home
/services               All 13 services
/pricing                Membership plans and pricing
/membership/[plan]      Membership sign-up form, then Stripe Checkout
/membership/success     Confirmation after payment
/membership/manage      Request a link to the billing portal
/book                   Service request form
/about                  About Us and mission
/contact                Phone, email, service areas, contact form
/sponsor-a-senior       Community support page + inquiry form
/privacy                Privacy policy
/terms                  Terms of service
/api/stripe/webhook     Stripe webhook endpoint (no UI)
/admin/login            Admin sign-in
/admin                  Dashboard overview
/admin/requests         Booking requests inbox
/admin/requests/[id]    Request detail
/admin/members          Memberships list
/admin/members/[id]     Membership detail
/admin/sponsors         Sponsor inquiries inbox
/admin/services         Services list, create, edit, reorder
/admin/plans            Plans list, create, edit, reorder
/admin/settings         Contact info, service areas, disclaimer
/admin/users            Admin accounts
```

---

## 5. Global elements (every public page)

- **Header:** logo, navigation (Services, Pricing, About, Sponsor a Senior, Contact), phone number as a tappable link, "Book a Service" button, and a language switcher shown as the words **English / Français** (no flags). Collapses to a large-target menu on mobile.
- **Language behaviour:** the switcher keeps the visitor on the same page in the other language. First visit follows the browser language; the choice is then remembered.
- **Sticky mobile action bar:** three buttons — **Call Now** (`tel:`), **Text Us** (`sms:`), **Book a Service** (`/book`).
- **Footer:** phone, email, service areas, navigation, privacy and terms links, and the scope disclaimer.
- **Scope disclaimer (verbatim, editable in settings):**
  > We provide non-medical, non-emergency services only. We do not provide nursing, personal care or emergency response.

Phone, email, service areas and the disclaimer are always read from `SiteSettings`, never hard-coded. If the phone number is empty, the Call and Text buttons are hidden rather than shown broken.

---

## 6. Public pages

### 6.1 Home `/`

1. Hero: tagline, one-sentence description, Call Now and Book a Service buttons, warm photo.
2. "How we help": 6 featured services (flag `featured`), link to all services.
3. How it works: three steps — Contact us, We plan the visit together, We show up and help.
4. Membership plans summary with a link to `/pricing`.
5. Service area strip.
6. Mission statement.
7. Sponsor a Senior teaser.
8. Final call-to-action band with the phone number.

### 6.2 Services `/services`

- Grid of all active services in admin-defined order: icon or image, title, description.
- Each card has a "Request this service" link to `/book?service=<slug>`.
- Scope disclaimer displayed prominently above the footer.

### 6.3 Pricing `/pricing`

- One card per active plan: name, price, what is included, optional note, and one action button.
- Plans marked purchasable show **Join now**, leading to `/membership/[plan]`. Other plans show **Request this plan**, leading to `/book?plan=<slug>`.
- Custom-quote plans show "Custom quote" instead of a number.
- A "Manage my membership" link below the cards leads to `/membership/manage`.
- Prices are shown in Canadian dollars with a note on whether tax is included (see section 18).
- Short FAQ (static in v1): what counts as a visit, cancellation, service area, payment methods.

### 6.4 Book a Service `/book`

Request form, not a scheduling system. Copy must say: "We will contact you to confirm."

| Field | Type | Required | Rules |
|---|---|---|---|
| Full name | text | yes | 2–100 chars |
| Phone | tel | yes | Valid North American number |
| Email | email | no | Valid format if present |
| I am requesting for | radio | yes | Myself / A family member / Someone else |
| Service | select | yes | Active services + "Not sure yet" |
| Plan of interest | select | no | Active plans + "Not sure yet" |
| City / area | select | yes | Service areas from settings + "Other" |
| Preferred contact method | radio | yes | Call / Text / Email |
| Preferred day or time | text | no | Max 200 chars |
| Message | textarea | no | Max 2000 chars |
| Consent | checkbox | yes | "I agree to be contacted about this request" + privacy link |

Behaviour: validate client and server side, verify Turnstile token, rate-limit, store, email owner, email visitor if an email was given, show a clear success screen with the phone number for urgent follow-up.

### 6.5 About `/about`

Story of the business, mission, values (reliable, friendly, affordable), service area, scope disclaimer, call-to-action.

### 6.6 Contact `/contact`

Phone (call and text links), email, service areas list, hours if provided, and a short contact form (name, phone, email, message, consent) stored as a `BookingRequest` with type `GENERAL`.

### 6.7 Sponsor a Senior `/sponsor-a-senior`

- Explains the program: community members help seniors who cannot afford services.
- **v1 is an inquiry form only — no online payment.**
- Fields: full name, phone, email, organization (optional), how they would like to help (Sponsor visits / Nominate a senior in need / Other), message, consent.
- Stored as `SponsorInquiry`, emailed to the owner.
- Must not use the words "donation", "charity" or "tax receipt" unless the client confirms registered charity status.

### 6.8 Privacy `/privacy` and Terms `/terms`

Static pages in both languages. Privacy policy must cover what is collected, why, retention, who to contact, and the use of Stripe as payment processor, in line with Alberta PIPA. Terms must cover membership billing: monthly renewal, what a visit includes, unused visits, cancellation and refunds. Client to review wording before launch.

### 6.9 Membership purchase `/membership/[plan]`

Only plans flagged purchasable can be bought. At launch these are Mabel Check-In and Mabel Peace of Mind.

**Step 1 — sign-up form on the site**

| Field | Type | Required | Rules |
|---|---|---|---|
| Your full name | text | yes | 2–100 chars (the person paying) |
| Phone | tel | yes | Valid North American number |
| Email | email | yes | Used for receipts and the billing portal |
| Who will receive the visits | radio | yes | Myself / A family member / Someone else |
| Recipient full name | text | if not "Myself" | 2–100 chars |
| Recipient phone | tel | no | Valid North American number |
| Service address | text | yes | Street, city, postal code |
| City / area | select | yes | Service areas from settings; "Other" blocks purchase and offers the request form instead |
| Notes for the first visit | textarea | no | Max 1000 chars; helper text asks not to include medical details |
| Terms and consent | checkbox | yes | Agrees to terms, monthly billing and being contacted |

**Step 2 — payment on Stripe Checkout**

- The server saves a `Membership` with status `PENDING`, then redirects to a Stripe-hosted Checkout session in subscription mode, in the visitor's language.
- Card details are entered only on Stripe. The site never sees or stores card numbers.
- Cancelling on Stripe returns the visitor to the pricing page with their form data discarded.

**Step 3 — confirmation `/membership/success`**

- Confirms the plan, the monthly amount and the next billing date, and states that the business will call within one business day to schedule the first visit.
- The membership becomes `ACTIVE` only when the Stripe webhook confirms payment, never from the success page alone.

**Managing a membership `/membership/manage`**

- The member enters their email. If an active membership exists, they receive an email with a short-lived link to the Stripe customer portal, where they can update their card, see invoices, or cancel.
- The page always shows the same neutral message, so it cannot be used to check whether an email is a member.
- Cancellation takes effect at the end of the paid period.

**Webhook events handled**

| Event | Effect |
|---|---|
| `checkout.session.completed` | Link Stripe customer and subscription, set `ACTIVE`, email member and owner |
| `invoice.paid` | Update current period end |
| `invoice.payment_failed` | Set `PAST_DUE`, email owner and member |
| `customer.subscription.updated` | Sync status, plan and cancel-at-period-end flag |
| `customer.subscription.deleted` | Set `CANCELED`, email owner |

Webhook signatures are verified and each event id is processed once.

### 6.10 Languages

- Every public string comes from translation files (`en`, `fr`); nothing visible is hard-coded.
- Editable content (services, plans, tagline, disclaimer, hours, service areas) has an English and a French value in the admin.
- If a French value is empty, the English value is shown rather than a blank.
- French copy is Canadian French, drafted during the build and reviewed by the client before launch.
- Dates, phone numbers and currency are formatted per locale (`$200.00` in English, `200,00 $` in French).

---

## 7. Initial content (seed data)

### 7.1 Services (13)

| # | Slug | Title | Description |
|---|---|---|---|
| 1 | `senior-home-check-ins` | Senior Home Check-Ins | Regular visits to check on seniors and make sure everything is okay. |
| 2 | `companionship` | Companionship | Friendly conversations, coffee visits, walks and social activities. |
| 3 | `garbage-recycling` | Garbage & Recycling | Taking garbage and recycling bins out and bringing them back. |
| 4 | `light-house-cleaning` | Light House Cleaning | Tidying, organizing and basic household cleaning. |
| 5 | `garage-cleaning` | Garage Cleaning | Garage organization and light cleanup. |
| 6 | `car-cleaning` | Car Cleaning | Basic interior cleaning, vacuuming and exterior washing. |
| 7 | `snow-removal` | Snow Removal | Shovelling snow, clearing sidewalks and salting walkways. |
| 8 | `lawn-yard-maintenance` | Lawn & Yard Maintenance | Grass cutting, seasonal yard cleanup and outdoor assistance. |
| 9 | `grocery-pharmacy-pickup` | Grocery & Pharmacy Pickup | Picking up groceries, prescriptions and everyday essentials. |
| 10 | `errands-shopping` | Errands & Shopping Assistance | Helping with basic daily errands. |
| 11 | `family-updates` | Family Updates | Updates to family members after visits, with the client's permission. |
| 12 | `acreage-rural-help` | Acreage & Rural Property Help | Regular check-ins, outdoor maintenance and practical assistance. |
| 13 | `basic-roadside-assistance` | Basic Roadside Assistance | Limited non-emergency help for monthly members, subject to safety and availability. |

French titles and descriptions for all 13 services are written during the build and seeded alongside the English ones.

### 7.2 Plans (4) — **amounts to be confirmed by client, see section 18**

The pricing table in the PDF is misaligned. This is the most likely reading.

| Order | Slug | Name | Price text | Includes | Buy online |
|---|---|---|---|---|---|
| 1 | `quick-drop` | Quick Drop | $15–$20 per visit | Up to 45 minutes | No, request |
| 2 | `mabel-check-in` | Mabel Check-In | $200/month | 4 visits | **Yes**, $200.00 CAD monthly |
| 3 | `mabel-peace-of-mind` | Mabel Peace of Mind | $250/month | 8 visits | **Yes**, $250.00 CAD monthly |
| 4 | `snow-yard-acreage` | Snow, yard & acreage services | Custom quote | Based on service needs | No, request |

### 7.3 Site settings

| Key | Initial value |
|---|---|
| Business name | Mabel Home Help |
| Tagline | Small jobs. Friendly visits. Peace of mind. |
| Phone | *empty — to be confirmed* |
| Email | *empty — to be confirmed* |
| Location | Edmonton, Alberta, Canada |
| Service areas | Edmonton; St. Albert; Sherwood Park; Surrounding communities; Acreages |
| Disclaimer | Text from section 5 |

---

## 8. Admin dashboard

### 8.1 Access

- Email + password sign-in at `/admin/login`. No public registration.
- First admin created by a seed script; further admins added from `/admin/users`.
- Password reset by email link.
- All `/admin/*` routes require a valid session; every server action re-checks it.
- Session expires after 7 days of inactivity.

### 8.2 Overview `/admin`

- Counters: new requests, requests this week, active members, past-due members, new sponsor inquiries.
- Table of the 5 most recent requests and the 5 most recent memberships.
- Warning banner if phone or email in settings is empty, or if a purchasable plan has no Stripe price.

### 8.3 Requests inbox `/admin/requests`

- Table: date, name, phone, service, area, type, status.
- Filter by status and type, search by name or phone, sort by date, paginate (20 per page).
- Detail view: all submitted fields, tap-to-call and tap-to-text links, status selector, private notes.
- Statuses: `NEW` → `CONTACTED` → `SCHEDULED` → `DONE`, plus `ARCHIVED`.
- Delete permanently (with confirmation) to honour privacy removal requests.
- CSV export of the filtered list.

### 8.4 Sponsor inquiries `/admin/sponsors`

Same pattern as requests, with statuses `NEW`, `CONTACTED`, `CLOSED`, `ARCHIVED`.

### 8.5 Services `/admin/services`

- List with drag-to-reorder, active toggle, featured toggle.
- Create / edit: title and description in English and French (side-by-side tabs), slug (auto-generated, editable), illustration (picked from the project's SVG set, or an uploaded image), active, featured.
- Deleting is a soft delete (set inactive) if any request references the service.

### 8.6 Plans `/admin/plans`

- List with drag-to-reorder and active toggle.
- Create / edit: name, price text, includes and optional note in English and French; highlighted flag; active.
- Price text is free text so "$15–$20 per visit" and "Custom quote" both work.
- **Buy online** toggle with a monthly amount in CAD. Saving creates the matching Stripe product and price automatically; the owner never opens Stripe to do this.
- Changing the amount creates a new Stripe price for new members. Existing members keep their current price, and the form says so before saving.
- A plan with active members cannot be deleted, only deactivated (hidden from the site, existing members unaffected).

### 8.7 Settings `/admin/settings`

Phone, email, business name, location, notification email recipients, and in both languages: tagline, service areas (add / remove / reorder), hours, disclaimer text.

### 8.8 Members `/admin/members`

- Table: member name, recipient name, plan, status, started, next billing date, area.
- Filter by status and plan, search by name, phone or email, paginate, CSV export.
- Detail view: payer and recipient details, service address, notes from sign-up, private admin notes, tap-to-call and tap-to-text links, language preference.
- Billing summary read from Stripe: status, amount, next billing date, whether cancellation is scheduled, link to the customer in the Stripe dashboard.
- Actions: cancel at period end (with confirmation). Refunds and immediate cancellation are done in the Stripe dashboard, not here.
- Statuses: `PENDING`, `ACTIVE`, `PAST_DUE`, `CANCELED`. `PENDING` records older than 24 hours are purged automatically.

### 8.9 Users `/admin/users`

List admins, invite by email, deactivate. An admin cannot deactivate their own account or the last active admin.

### 8.10 Content publishing

Every save revalidates the affected public pages so changes appear without a redeploy. Each save shows a success or error toast.

---

## 9. Data model

```prisma
enum RequestType   { BOOKING GENERAL }
enum RequestStatus { NEW CONTACTED SCHEDULED DONE ARCHIVED }
enum SponsorStatus { NEW CONTACTED CLOSED ARCHIVED }
enum ContactMethod { CALL TEXT EMAIL }
enum RequesterRole { SELF FAMILY OTHER }
enum SponsorIntent { SPONSOR_VISITS NOMINATE_SENIOR OTHER }
enum Locale        { EN FR }
enum MembershipStatus { PENDING ACTIVE PAST_DUE CANCELED }

model Service {
  id            String   @id @default(cuid())
  slug          String   @unique
  titleEn       String
  titleFr       String?
  descriptionEn String
  descriptionFr String?
  illustration  String            // key of an SVG in the project set
  imageUrl      String?           // optional uploaded replacement
  sortOrder     Int      @default(0)
  isActive      Boolean  @default(true)
  isFeatured    Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  requests      BookingRequest[]
}

model Plan {
  id              String   @id @default(cuid())
  slug            String   @unique
  nameEn          String
  nameFr          String?
  priceTextEn     String
  priceTextFr     String?
  includesEn      String
  includesFr      String?
  noteEn          String?
  noteFr          String?
  sortOrder       Int      @default(0)
  isActive        Boolean  @default(true)
  isHighlighted   Boolean  @default(false)
  isPurchasable   Boolean  @default(false)
  monthlyCents    Int?              // CAD cents, required when purchasable
  stripeProductId String?
  stripePriceId   String?           // current price for new members
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  requests        BookingRequest[]
  memberships     Membership[]
}

model SiteSettings {
  id                 Int      @id @default(1)   // single row
  businessName       String
  taglineEn          String
  taglineFr          String?
  phone              String?
  email              String?
  location           String
  serviceAreasEn     String[]
  serviceAreasFr     String[]
  hoursEn            String?
  hoursFr            String?
  disclaimerEn       String
  disclaimerFr       String?
  notificationEmails String[]
  updatedAt          DateTime @updatedAt
}

model Membership {
  id                   String           @id @default(cuid())
  status               MembershipStatus @default(PENDING)
  planId               String
  plan                 Plan             @relation(fields: [planId], references: [id], onDelete: Restrict)
  locale               Locale           @default(EN)
  payerName            String
  payerPhone           String
  payerEmail           String
  requesterRole        RequesterRole
  recipientName        String?
  recipientPhone       String?
  serviceAddress       String
  area                 String
  notes                String?
  adminNotes           String?
  stripeCustomerId     String?
  stripeSubscriptionId String?          @unique
  stripePriceId        String?          // price the member actually pays
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean          @default(false)
  canceledAt           DateTime?
  consentAt            DateTime
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt

  @@index([status, createdAt])
  @@index([payerEmail])
}

model StripeEvent {
  id          String   @id              // Stripe event id, for idempotency
  type        String
  processedAt DateTime @default(now())
}

model BookingRequest {
  id             String        @id @default(cuid())
  type           RequestType   @default(BOOKING)
  status         RequestStatus @default(NEW)
  locale         Locale        @default(EN)
  fullName       String
  phone          String
  email          String?
  requesterRole  RequesterRole?
  serviceId      String?
  service        Service?      @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  planId         String?
  plan           Plan?         @relation(fields: [planId], references: [id], onDelete: SetNull)
  area           String?
  contactMethod  ContactMethod?
  preferredTime  String?
  message        String?
  adminNotes     String?
  consentAt      DateTime
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([status, createdAt])
}

model SponsorInquiry {
  id           String        @id @default(cuid())
  status       SponsorStatus @default(NEW)
  locale       Locale        @default(EN)
  fullName     String
  phone        String?
  email        String
  organization String?
  intent       SponsorIntent
  message      String?
  adminNotes   String?
  consentAt    DateTime
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([status, createdAt])
}

// User, Session, Account, Verification tables are generated by the auth library.
```

---

## 10. Technical stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, latest stable) + TypeScript strict |
| Styling | Tailwind CSS |
| UI components | shadcn/ui (Radix), Lucide icons |
| Tables | TanStack Table |
| Drag to reorder | dnd-kit |
| Forms and validation | React Hook Form + Zod (schemas shared client/server) |
| Database | PostgreSQL on Neon |
| ORM | Prisma |
| Auth | Better Auth (email + password, DB sessions) |
| Internationalisation | next-intl (locale routing, translation files, formatting) |
| Payments | Stripe Billing: Checkout (subscription mode), Customer Portal, webhooks |
| Email | Resend + React Email |
| Image upload | UploadThing |
| Spam protection | Cloudflare Turnstile + honeypot field |
| Rate limiting | Upstash Ratelimit |
| Hosting | Vercel |
| Monitoring | Sentry |
| Analytics | Vercel Analytics or Plausible (cookieless) |
| Tests | Vitest (unit), Playwright (end-to-end) |
| Package manager | pnpm |

### 10.1 Architecture

- One Next.js application serves the public site and the admin.
- Public pages are statically rendered and revalidated on demand after admin saves.
- Admin mutations and public form submissions use Server Actions; the only API routes are the auth handler and the Stripe webhook.
- All database access goes through a `server/` layer; components never import Prisma directly.
- Stripe is the source of truth for billing state. The `Membership` table is a mirror updated only by verified webhooks, plus the contact details collected at sign-up.
- Public routes sit under a `[locale]` segment; the admin is English only and sits outside it.

### 10.2 Folder structure

```
messages/
  en.json  fr.json       UI strings
public/
  brand/                 logo.svg, logo-mark.svg, favicon, og image
  illustrations/         one SVG per service + hero and section art
src/
  app/
    [locale]/            page.tsx, services/, pricing/, membership/, book/, about/,
                         contact/, sponsor-a-senior/, privacy/, terms/, layout.tsx
    admin/
      login/
      (dashboard)/       page.tsx, requests/, members/, sponsors/, services/,
                         plans/, settings/, users/, layout.tsx
    api/auth/[...all]/   auth handler
    api/stripe/webhook/  Stripe webhook handler
    sitemap.ts  robots.ts  layout.tsx  globals.css
  components/
    ui/                  shadcn components
    public/              header, footer, action bar, language switcher,
                         service card, plan card
    admin/               sidebar, data table, form shells, bilingual field
    forms/               booking, contact, sponsor, membership sign-up
  i18n/                  routing and request config
  server/
    db.ts                Prisma client
    auth.ts              auth config + requireAdmin()
    stripe.ts            Stripe client, checkout, portal, price sync
    queries/             read functions (cached, tagged, locale-aware)
    actions/             server actions (validated, authorised)
    email/               templates (en + fr) and send functions
  lib/
    validation/          Zod schemas
    localize.ts          pick En/Fr field with English fallback
    utils.ts  constants.ts
prisma/
  schema.prisma  migrations/  seed.ts
tests/
  unit/  e2e/
```

### 10.3 Environment variables

```
DATABASE_URL
DIRECT_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
EMAIL_FROM
NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
UPLOADTHING_TOKEN
SENTRY_DSN
NEXT_PUBLIC_SITE_URL
SEED_ADMIN_EMAIL
SEED_ADMIN_PASSWORD
```

A committed `.env.example` lists every key with no values. Local and preview environments use Stripe test-mode keys only; live keys exist only in production and are entered by the client or account owner.

---

## 11. Design system

### 11.1 Principles

Warm, calm, trustworthy. Clarity over decoration. Nothing a senior has to hunt for.

### 11.2 Colour tokens (starting point, to refine in design phase)

| Token | Hex | Use |
|---|---|---|
| `green-900` | `#1F3D2B` | Headings, footer background |
| `green-700` | `#2F5D43` | Primary buttons, links |
| `green-500` | `#4E8B66` | Hover, icons, accents |
| `green-100` | `#E3EFE6` | Tinted sections, badges |
| `cream-50` | `#FBF8F1` | Page background |
| `cream-100` | `#F4EEDF` | Cards, alternate sections |
| `cream-300` | `#E2D7BD` | Borders, dividers |
| `ink` | `#1C241F` | Body text |
| `ink-muted` | `#4F5A53` | Secondary text |
| `danger` | `#B3261E` | Errors, destructive actions |

All text and background pairs must reach WCAG AA contrast (4.5:1 body, 3:1 large text). Verify during design.

### 11.3 Typography

- Headings: Fraunces (serif, warm).
- Body and UI: Atkinson Hyperlegible (designed for low-vision readers).
- Public body text minimum 18px, line height 1.6. Admin may use 15–16px.
- Fonts self-hosted via `next/font`.

### 11.4 Components and layout

- Buttons minimum 48px high on public pages; tap targets at least 44×44px.
- Maximum text line length about 70 characters.
- Rounded corners 12–16px, soft shadows, generous spacing.
- Visible focus ring on every interactive element.
- Breakpoints: 360, 768, 1024, 1280. Design mobile first.
- Motion limited to subtle fades; respect `prefers-reduced-motion`.
- Admin uses the same tokens with a sidebar layout that collapses to a drawer on mobile.

- French strings run about 20% longer than English: buttons, navigation and cards must not truncate or overflow in French.

### 11.5 Brand assets and imagery

All visual assets are created in-project as hand-authored SVG, in the green and cream palette, so the site launches with no dependency on client-supplied material.

| Asset | Details |
|---|---|
| Logo | Wordmark + symbol, horizontal and stacked versions, light and dark variants |
| Logo mark | Symbol alone, used for favicon, app icon and small spaces |
| Favicon set | SVG favicon, PNG fallbacks, Apple touch icon |
| Service illustrations | 13, one per service, in one consistent line-and-fill style |
| Hero illustration | Warm home scene for the Home page |
| Section illustrations | About, Sponsor a Senior, "how it works" steps, empty and success states |
| Social share image | 1200×630, one per language |

- Style: friendly flat illustration, rounded shapes, limited palette. Never clinical or hospital imagery.
- Every asset is a separate file under `public/`, so any of them can be regenerated or replaced by an imported file without touching code.
- Review loop: assets are presented together for approval at M2; rejected ones are redrawn or replaced by client-supplied files.
- The v1 design does not rely on photographs. Real photos of the team or clients can be added later through the admin image upload.
- All images have meaningful alt text in both languages; purely decorative illustrations are hidden from screen readers.

---

## 12. Email notifications

| Trigger | To | Content |
|---|---|---|
| New booking or contact request | Notification recipients in settings | All fields + link to admin detail |
| New booking request (email given) | Visitor | Confirmation, what happens next, business phone |
| New sponsor inquiry | Notification recipients | All fields + link to admin detail |
| New sponsor inquiry | Visitor | Thank-you confirmation |
| Membership activated | Member | Welcome, plan, amount, next billing date, what happens next, how to manage |
| Membership activated | Notification recipients | Member and recipient details + link to admin detail |
| Payment failed | Member | Card problem, link to update it |
| Payment failed / membership cancelled | Notification recipients | Member name, plan, link to admin detail |
| Billing portal link requested | Member | Short-lived link to the Stripe portal |
| Admin invite / password reset | Admin | Secure, expiring link |

- Visitor and member emails are sent in the language used on the site at submission (stored as `locale`). Owner emails are in English.
- Payment receipts and invoices are sent by Stripe, not by the site.
- Sending domain authenticated with SPF, DKIM and DMARC.
- An email failure must never fail the form submission: the request is saved first, the send error is logged to Sentry.

---

## 13. Non-functional requirements

### 13.1 Performance

- Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
- LCP < 2.5s, CLS < 0.1, INP < 200ms on a mid-range phone over 4G.
- Images served through `next/image` in modern formats with explicit dimensions.

### 13.2 Accessibility

- WCAG 2.1 AA.
- Full keyboard navigation, skip link, semantic landmarks, one `h1` per page.
- Every form field has a visible label; errors are announced and tied to their field.
- Page remains usable at 200% zoom and with large system text.

### 13.3 Security

- HTTPS only; secure, HTTP-only, same-site session cookies.
- Passwords hashed by the auth library; minimum 10 characters.
- Login rate-limited (5 attempts per 15 minutes per IP and per email).
- Public forms: Turnstile, honeypot, rate limit (5 submissions per hour per IP).
- Zod validation on every server action; authorisation re-checked server side.
- Security headers: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors 'none'`.
- Upload restrictions: images only, 5MB maximum, admin only.
- No secrets in the repository; dependencies checked with `pnpm audit` before launch.
- Payments: card data is handled only on Stripe-hosted pages (PCI SAQ A). The site stores Stripe ids, never card details.
- Stripe webhook: signature verified, raw body used, event ids stored for idempotency, endpoint excluded from locale routing and auth.
- Amounts and price ids are always taken from the database on the server, never from the browser.

### 13.4 Privacy and legal

- Alberta PIPA: collect only what is needed, state the purpose at collection, allow access and deletion on request.
- Explicit consent checkbox on every form, with timestamp stored.
- No medical or health information requested anywhere. Form helper text asks visitors not to include it.
- CASL: confirmation emails are transactional only; no marketing list in v1.
- Cookieless analytics so no cookie banner is required.
- Retention: requests older than 24 months are deleted or anonymised (client to confirm period). Cancelled membership records are kept for the period required for tax and accounting records, then anonymised.
- Membership terms shown before payment: price, monthly renewal, how to cancel. The consent checkbox cannot be pre-ticked.

### 13.5 SEO

- Unique title and meta description per page; Open Graph and Twitter image.
- `LocalBusiness` JSON-LD with name, phone, area served, and services.
- `sitemap.xml`, `robots.txt`; `/admin` disallowed and `noindex`.
- Each page declares `hreflang` alternates (`en-CA`, `fr-CA`, `x-default`) and the correct `lang` attribute; both language versions are in the sitemap.
- Membership sign-up, success and manage pages are `noindex`.
- Clean, descriptive URLs; headings follow a logical order.
- Google Business Profile and Search Console set up with the client at launch.

### 13.6 Reliability

- Daily database backups with 7-day point-in-time recovery (Neon).
- Sentry alerts for server errors and failed emails.
- Friendly custom 404 and error pages that show the phone number.

### 13.7 Browser support

Last two versions of Chrome, Safari, Edge, Firefox; iOS Safari 15+; Android Chrome. Tested on a small phone (360px), a tablet and a desktop.

---

## 14. Environments and delivery

| Environment | Purpose | Database |
|---|---|---|
| Local | Development | Local Postgres or Neon dev branch |
| Preview | One per pull request, client review | Neon preview branch |
| Production | Live site | Neon main branch |

- Git: `main` is production; work happens on feature branches merged by pull request.
- CI on every pull request: type-check, lint, unit tests, build.
- Prisma migrations run in the deploy step; never edited on production by hand.
- Domain, hosting, database and email accounts are created under the client's ownership, with the developer added as a collaborator.

---

## 15. Testing

- **Unit (Vitest):** Zod schemas, phone formatting, slug generation, authorisation helper.
- **End-to-end (Playwright):**
  1. Visitor submits the booking form and sees the success screen; the request exists in the database.
  2. Invalid form shows field errors and stores nothing.
  3. Unauthenticated access to `/admin` redirects to login.
  4. Admin signs in, edits a plan price, and the public pricing page shows the new value.
  5. Admin changes a request status and adds a note.
  6. Admin updates the phone number and the header shows it.
  7. Visitor switches to French on the Services page, stays on the same page, and sees French content; a service with no French text falls back to English.
  8. Visitor completes membership sign-up and pays with a Stripe test card; after the webhook, the membership is `ACTIVE` and visible in the admin.
  9. A failed-payment webhook sets the membership to `PAST_DUE`; a replayed event changes nothing.
  10. Admin enables "Buy online" on a plan and the pricing page shows the Join button.
- **Unit additions:** localisation fallback helper, webhook event handlers, currency formatting per locale.
- **Stripe:** all automated and manual payment tests run in Stripe test mode with Stripe's published test cards, using the Stripe CLI to forward webhooks locally.
- **Translation check:** a script fails CI if `en.json` and `fr.json` do not have the same keys.
- **Manual:** accessibility pass with keyboard and a screen reader, real-device check on iPhone and Android, email rendering in Gmail and Outlook, full read-through of the French site by a French speaker.

---

## 16. Milestones

| # | Milestone | Deliverable | Hours |
|---|---|---|---|
| M0 | Kickoff | Open questions answered, accounts created (hosting, database, email, Stripe) | 4 |
| M1 | Foundation | Repo, CI, database, schema, seed, auth, locale routing, deploy pipeline | 13 |
| M2 | Design and assets | Tokens, component library, logo, 13 service illustrations, hero art, Home + one inner page approved | 18 |
| M3 | Public site | All public pages in English and French, reading from the database | 22 |
| M4 | Forms and email | Booking, contact, sponsor forms; bilingual notifications; spam protection | 10 |
| M5 | Memberships | Sign-up form, Stripe Checkout, webhooks, customer portal, member emails | 16 |
| M6 | Admin | Login, overview, inboxes, members, services, plans with Stripe sync, settings, users | 24 |
| M7 | Quality | Accessibility, SEO, performance, tests, security headers, French review | 9 |
| M8 | Launch | Final content, domain, email DNS, Stripe live mode, training, handover | 6 |
| | **Total** | | **122** |

Estimated calendar time: 6–7 weeks part-time. Stripe live mode depends on the client completing Stripe's business verification, which should be started at M0.

---

## 17. Acceptance criteria

The project is complete when:

1. All pages in section 4 are live on the client's domain over HTTPS.
2. All 13 services and all confirmed plans are displayed and editable from the admin.
3. The confirmed phone number appears on every page as a working call link, with a working text link on mobile.
4. Booking, contact and sponsor forms store submissions, notify the owner by email, and reject spam and invalid input.
5. The owner can sign in, edit services, plans and contact information, and see the changes live without developer help.
6. The owner can view, filter, update, export and delete requests.
7. The scope disclaimer appears on every page.
8. Lighthouse and accessibility targets in section 13 are met on Home, Services and Book.
9. All Playwright scenarios in section 15 pass.
10. The client has received a handover: admin walkthrough, credentials ownership, and a one-page owner guide.
11. Every public page, form and visitor email is available in English and French, with a working language switcher and no untranslated strings.
12. A visitor can subscribe to each purchasable plan with a real card in production, the membership appears in the admin as active, and the member can cancel through the billing portal.
13. Logo, favicon, service illustrations and hero art are approved by the client or replaced by supplied files.

---

## 18. Open questions for the client

Work proceeds on the stated assumption until answered.

| # | Question | Assumption used |
|---|---|---|
| 1 | Confirmed business phone and email? | Empty editable fields; must be set before launch |
| 2 | Are the plan prices in 7.2 read correctly ($200 for 4 visits, $250 for 8)? | As in 7.2 |
| 3 | Business hours? | Not shown until provided |
| 4 | Domain name and who owns hosting accounts? | Client owns all accounts |
| 5 | Who receives notification emails? | The business email |
| 6 | Is the business insured, bonded, or are staff background-checked? (trust signals) | Not mentioned on site unless confirmed |
| 7 | Data retention period for requests? | 24 months |
| 8 | Is the business registered for GST? Are listed prices before or after tax? | Not registered; prices charged as listed, no tax added. If registered, Stripe Tax is enabled and 5% GST is added at checkout |
| 9 | Membership rules: do unused visits carry over? Refund policy? Minimum term? | No carry-over, no minimum term, cancel any time effective at period end, no partial-month refunds |
| 10 | Should Quick Drop ($15–$20 per visit) also be payable online? | No, request only |
| 11 | Who reviews the French copy? | Client or a French speaker they nominate |
| 12 | Legal business name and bank details for the Stripe account? | Client creates and verifies the Stripe account themselves |

### Decisions already confirmed (2026-10-12)

| Topic | Decision |
|---|---|
| Sponsor a Senior | Inquiry form only, no online payment, no charity wording |
| Booking | Request form, no calendar |
| Memberships | Purchasable online with recurring card billing |
| Languages | English and French |
| Logo, illustrations, images | Created in-project as SVG; regenerated or replaced by imports if not approved |
| Page copy | Drafted during the build from the brief, in both languages |

---

## 19. Client deliverables needed before launch

- Answers to section 18.
- Confirmed phone number and email.
- A verified Stripe account in the business's name, with the developer invited as a team member.
- About Us story (a few paragraphs or bullet points), or approval of the drafted version.
- Review and approval of the French copy.
- Approval of the logo and illustrations at M2.
- Approval of privacy policy and terms wording, including the membership terms.
- Access to the domain registrar or agreement on which domain to buy.

---

## 20. Implementation status (2026-10-12)

The application is built to this specification. Differences from the text
above, and what still depends on outside accounts:

| Topic | Specified | As built |
|---|---|---|
| Package manager | pnpm | npm (pnpm was not installed on the development machine) |
| ORM version | Prisma (latest) | Prisma 6.19: Prisma 7 needs Node 20.19+, the machine runs Node 20.15 |
| Caching | Static pages, `revalidatePath` | Next.js 16 Cache Components: cached queries with one tag, `updateTag` on admin saves |
| Middleware | `middleware.ts` | `src/proxy.ts` (the Next.js 16 name) |
| API routes | Auth and Stripe webhook only | As specified; CSV export is a Server Action |
| Service image upload | UploadThing | Not wired. The service form accepts an `https://` image address instead |
| Service areas editor | Add / remove / reorder | One area per line in a text box (same result, simpler) |
| Favicon set | SVG, PNG fallbacks, Apple touch icon | SVG icon and generated Apple touch icon; no `.ico` file |
| Analytics | Vercel Analytics or Plausible | Vercel Analytics, active only when hosted on Vercel |

Not verifiable until the accounts exist (code is in place, see README "Going
live"): Stripe checkout, portal and webhooks against real Stripe; Resend
delivery; Turnstile; Upstash rate limiting; Sentry event delivery.

Verified locally: type-check, lint, 41 unit tests (including Stripe webhook
handling and EN/FR key parity) and 11 end-to-end tests against a production
build (section 15 scenarios 1 to 7; scenarios 8 and 10 need Stripe test keys,
scenario 9 is covered by unit tests).

---

## 21. Production audit (2026-10-13)

A review before launch covering responsiveness, accessibility, performance,
security and failure modes. Everything below is fixed in the code unless marked
as a remaining limit.

### Measured

| Check | Result |
|---|---|
| Responsive layout | Every public page in both languages and every admin screen, at 360, 414, 768, 1024, 1280 and 1536 px: no sideways scroll, no cut-off text (automated, `tests/e2e/responsive.spec.ts`), plus a visual pass on screenshots |
| Accessibility | No automated WCAG 2.1/2.2 A or AA violations on public pages (desktop and phone, including the open menu and an invalid form) or on admin screens (`tests/e2e/accessibility.spec.ts`). Lighthouse accessibility 100 |
| Lighthouse, mobile, simulated slow 4G | Home 91 / Services 92 / Book 93 performance; accessibility, best practices and SEO 100 on all three. CLS 0, total blocking time about 100 ms |
| Remaining limit | Lighthouse's simulated LCP is 3.1 to 3.3 s against the 2.5 s target in section 13.1 (measured unthrottled on the development machine: under 1 s). JavaScript per page is 207 KB compressed, most of it the framework |
| Tests | 49 unit tests, 28 end-to-end tests |

### Changes that differ from earlier sections

| Section | Was | Now | Why |
|---|---|---|---|
| 13.3 Form rate limit | 5 per hour per IP | 10 per hour per IP | A seniors' residence or family home shares one address |
| 13.3 Sign-in rate limit | 5 per 15 min per IP and per email | 5 per 15 min per email+IP pair, 20 per IP, 50 per hour per email | The old per-email limit let a stranger lock the owner out |
| 13.3 Headers | HSTS with preload | HSTS for this host only | Preload and includeSubDomains would bind every other subdomain of the business |
| 13.3 CSP images | Listed hosts | Any https host | A service can use a photo hosted anywhere |
| 13.4 Retention | Stated, not built | Requests and inquiries older than 24 months are deleted when the admin overview is opened | Matches the privacy policy |
| 6.9 Unpaid sign-ups | Purged after 24 hours | Checked against Stripe; activated if paid, removed only once expired | A missed webhook could otherwise lose a paying customer's record |
| 6.9 Join button | Shown when the Stripe key is set | Shown only when the key and the webhook secret are both set | Nobody can pay before payments can be recorded |
| 6.4 Names | Any text, 2 to 100 characters | Letters, spaces and name punctuation | The name is echoed in emails sent from the business's domain |
| 8.1 Auth endpoint | All Better Auth routes | GET only (the reset link) | Direct POSTs bypassed the sign-in limits |

### Still to do outside the code

- A manual pass with a keyboard and a screen reader, and on a real iPhone and
  Android phone (section 15).
- Everything in section 20 that needs live accounts (Stripe, Resend, Turnstile,
  Upstash, Sentry) is still unverified against the real services.
- A French speaker should review the French copy.
