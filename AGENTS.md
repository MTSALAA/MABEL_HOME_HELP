<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project notes

Read `README.md` ("How it is put together") before changing structure, and
`docs/CAHIER_DE_CHARGES.md` for what the product must do.

- **Two root layouts, no `app/layout.tsx`**: `src/app/[locale]/` (public,
  English and French) and `src/app/admin/` (English only).
- **Every visible public string** lives in `messages/en.json` and
  `messages/fr.json` with identical keys (`npm test` fails otherwise). Never
  hard-code public copy.
- **Editable content** (services, plans, settings) has `...En` / `...Fr`
  columns; read it through `src/server/queries/content.ts`, and call
  `updateTag(CONTENT_TAG)` after any admin write.
- **Admin security**: `src/proxy.ts` only checks that a cookie exists. Every
  admin page and every admin Server Action must start with `requireAdmin()`,
  then check its arguments (`isId`, `typeof`): they arrive untyped.
  `/api/auth` exports GET only; sign-in goes through `server/actions/auth.ts`
  so the rate limits cannot be bypassed.
- **Forms**: values belong in the HTML (`defaultValue` / `defaultChecked`), not
  only in react-hook-form defaults, so pages are correct before hydration and
  early typing is never overwritten. Public forms load Zod on first use
  (`lazySchemaResolver` in `form-kit.tsx`): never import a schema from
  `lib/validation/public` into a client component except as a type.
- **Client translations**: only the namespaces listed in `CLIENT_NAMESPACES`
  (`src/app/[locale]/layout.tsx`) reach the browser. Add one there before
  using it with `useTranslations()` in a `"use client"` file.
- **Accessible names** start with the visible label (`Common.labelWithDetail`),
  so voice control works; do not replace visible text with a different
  `aria-label`.
- **New screens** go into `tests/e2e/responsive.spec.ts` and
  `tests/e2e/accessibility.spec.ts`.
- **Money**: amounts and Stripe price ids always come from the database on the
  server. Membership status changes only in `syncMembership`
  (`src/server/memberships.ts`), from live Stripe state, never from an event
  snapshot or the browser. Unpaid sign-ups are never deleted on age alone.
- **Verification**: `npm run typecheck`, `npm run lint`, `npm test`,
  `npm run test:e2e`. Do not run `next build` while `npm run dev` is running.
