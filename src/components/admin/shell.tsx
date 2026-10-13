"use client";

import {
  ClipboardListIcon,
  ExternalLinkIcon,
  HandHeartIcon,
  HeartHandshakeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  SettingsIcon,
  TagIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/public/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/server/actions/auth";

export type ShellBadges = {
  requests: number;
  sponsors: number;
  pastDue: number;
};

const NAV = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboardIcon, badge: null },
  { href: "/admin/requests", label: "Requests", Icon: ClipboardListIcon, badge: "requests" },
  { href: "/admin/members", label: "Members", Icon: UsersIcon, badge: "pastDue" },
  { href: "/admin/sponsors", label: "Sponsor inquiries", Icon: HandHeartIcon, badge: "sponsors" },
  { href: "/admin/services", label: "Services", Icon: HeartHandshakeIcon, badge: null },
  { href: "/admin/plans", label: "Plans & pricing", Icon: TagIcon, badge: null },
  { href: "/admin/settings", label: "Settings", Icon: SettingsIcon, badge: null },
  { href: "/admin/users", label: "Admin users", Icon: UserCogIcon, badge: null },
] as const;

function NavList({
  badges,
  onNavigate,
}: {
  badges: ShellBadges;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="flex flex-col gap-1">
        {NAV.map(({ href, label, Icon, badge }) => {
          const active =
            href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          const count = badge ? badges[badge] : 0;
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-[0.95rem] font-bold transition-colors",
                  active
                    ? "bg-forest-700 text-white"
                    : "text-cream-50/85 hover:bg-cream-50/10 hover:text-white",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {count > 0 ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-bold",
                      badge === "pastDue"
                        ? "bg-danger text-white"
                        : "bg-honey text-forest-950",
                    )}
                  >
                    {count}
                    <span className="sr-only">
                      {badge === "pastDue" ? " past due" : " new"}
                    </span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarFooter({ name, email }: { name: string; email: string }) {
  return (
    <div className="border-t border-cream-50/15 p-4">
      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="mb-3 flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-bold text-cream-50/85 hover:bg-cream-50/10 hover:text-white"
      >
        <ExternalLinkIcon className="size-4" aria-hidden="true" />
        View the website
      </a>
      <p className="truncate px-2 text-sm font-bold text-cream-50">{name}</p>
      <p className="truncate px-2 text-xs text-forest-300">{email}</p>
      <form action={signOutAction} className="mt-3">
        <Button
          type="submit"
          variant="outline"
          className="w-full border-cream-50/30 bg-transparent text-cream-50 hover:bg-cream-50/10 hover:text-white"
        >
          <LogOutIcon aria-hidden="true" />
          Sign out
        </Button>
      </form>
    </div>
  );
}

export function AdminShell({
  admin,
  badges,
  children,
}: {
  admin: { name: string; email: string };
  badges: ShellBadges;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-forest-900 lg:flex">
        <div className="border-b border-cream-50/15 px-5 py-5">
          <Link href="/admin" className="inline-block rounded-lg">
            <Logo tone="light" />
          </Link>
        </div>
        <NavList badges={badges} />
        <SidebarFooter name={admin.name} email={admin.email} />
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-cream-300 bg-cream-50 px-4 py-3 lg:hidden">
          <Link href="/admin" className="rounded-lg">
            <Logo />
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-lg" aria-label="Open menu">
                <MenuIcon aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-[min(18rem,100vw)] flex-col gap-0 border-0 bg-forest-900 p-0 text-cream-50"
            >
              <SheetHeader className="border-b border-cream-50/15 px-5 py-5">
                <SheetTitle className="text-left">
                  <Logo tone="light" />
                </SheetTitle>
                <SheetDescription className="sr-only">Admin navigation</SheetDescription>
              </SheetHeader>
              <NavList badges={badges} onNavigate={() => setOpen(false)} />
              <SidebarFooter name={admin.name} email={admin.email} />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
