# Security

## Reporting a problem

Please report a suspected vulnerability privately, not in a public issue:
open a private advisory at
<https://github.com/MTSALAA/MABEL_HOME_HELP/security/advisories/new>.

Include what you found, how to reproduce it, and what it could expose. Please
do not include real customer data. You will get a reply as soon as the report
has been read, and credit in the fix if you would like it.

## What is in scope

The public website, the admin dashboard, the form and payment flows, and the
build and deployment configuration in this repository.

## How the site protects people

- Card details are only ever entered on Stripe's pages. The site stores Stripe
  references, never card numbers.
- Admin access needs a signed-in, active admin on every page and every action,
  with rate-limited sign-in.
- Public forms are validated on the server, rate limited, and protected
  against automated submissions.
- No medical or health information is requested anywhere.
- Requests and inquiries are deleted automatically after 24 months.
