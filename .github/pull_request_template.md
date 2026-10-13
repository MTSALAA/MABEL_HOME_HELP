## What changed

<!-- One or two sentences on what this does and why. -->

## How it was checked

- [ ] `npm run typecheck` and `npm run lint`
- [ ] `npm test`
- [ ] `npm run test:e2e` (flows, responsive widths, accessibility)
- [ ] Looked at the changed screens on a phone-sized and a desktop-sized window

## Checklist

- [ ] New public text is in both `messages/en.json` and `messages/fr.json`
- [ ] New admin actions start with `requireAdmin()` and check their arguments
- [ ] A changed `prisma/schema.prisma` comes with a migration
- [ ] New screens are added to the responsive and accessibility tests
- [ ] No secrets, real customer data or `.env` values in the diff
