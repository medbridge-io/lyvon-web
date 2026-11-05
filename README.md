# lyvon-web

The LYVON 2027 website (lyvon.io): static pages in EN, KO, JA and 繁中, deployed on Cloudflare Pages.

- Build output: repository root (no build command).
- `functions/api/lesson-request.js` is a Pages Function that forwards form submissions to the LYVON Google Apps Script.
  - Set `APPS_SCRIPT_URL` and `APPS_SCRIPT_SECRET` as Secrets in Cloudflare Pages → Settings → Variables.
- `_redirects` holds the 301 redirects from the old lyvon.io URLs. `_headers` holds the security headers.
- `/card`, `/philosophy` and `/start` are carried over unchanged from medbridge-io/lyvon-platform.
- Rollback: medbridge-io/lyvon-platform is the previous site. It is unchanged.
