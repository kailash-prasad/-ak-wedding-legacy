# A & K Wedding Legacy 2.0 — Foundation branch

Production remains on `main`; **do not merge this branch without approval**.

## Verified architecture
- Static HTML/CSS/JavaScript, deployed by GitHub Pages workflow.
- `config.js` has empty Supabase URL and anon key; existing forms do not persist.
- The current 'Keep this letter' button calls browser print, not a downloadable personalized keepsake.
- The quiz is client-side and works without a database.
- There is no admin dashboard, guest token authorization, or family chamber protection.

## Priority 0 implementation sequence
1. Create an independent Supabase project and enable backups. Review `supabase/migrations/001_initial.sql` before applying.
2. Build Edge Functions: `submit-blessing`, `submit-capsule`, `resolve-guest`, `admin-guest-qr`, and `admin-export`. Enforce rate limits, CAPTCHA, input validation and origin checks.
3. Authenticate admin via Supabase Auth; all privileged reads/writes require verified user JWT and `site_admins` membership. Never ship a service-role key to the browser.
4. Issue 256-bit random opaque guest tokens, store only SHA-256 token hashes, support expiry/revocation and short-lived server sessions. Do not put guest names or personal details in URLs.
5. Store private media in private buckets and issue short-lived signed URLs only after authorization.
6. Add admin pages for guest records, templates, approvals, gallery media, and QR exports.
7. Add staging deployment and end-to-end tests before any production merge.

## Known gaps / risk
- GitHub Pages serves static assets; it cannot enforce server-side privacy itself.
- The schema is an initial migration, **not yet applied or tested**.
- No public INSERT policies are intentional; existing client forms will not work until server functions are deployed.
- Time capsule opening must be server-enforced on/after 2027-12-05 in a chosen timezone.
- Generic QR may open the public site; VIP QR requires server-validated guest authorization.
- Existing invitation repository must remain untouched.

## Rollback
Keep `main` unchanged while developing. Once staging tests pass, tag the previous production commit before an approved merge. Roll back by reverting the merge or redeploying the tag.

## Staging
This branch is a development source, not a verified live staging URL. GitHub Pages production workflow currently deploys `main` only. Configure a separate staging site before accepting guest submissions.
