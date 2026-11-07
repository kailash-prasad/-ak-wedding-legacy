# Secure submissions — setup and acceptance criteria

Status: **source code committed; not deployed**.

1. Provision a Supabase project and apply the reviewed migration in `supabase/migrations/001_initial.sql`.
2. Provision Cloudflare Turnstile and Upstash Redis (REST). Configure the site key on the client; secret key on the Edge Function.
3. Deploy `supabase/functions/public-submit` with `--no-verify-jwt`; the endpoint performs its own verification. Set `ALLOWED_ORIGIN` to the exact production/staging origin, `TURNSTILE_SECRET_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
4. In a non-committed deployment configuration set `window.AK_CONFIG.submitEndpoint` to the function URL and `window.AK_CONFIG.turnstileSiteKey` to the public site key. Never put service credentials in frontend files.
5. Confirm no anonymous database INSERT policies are enabled. Public submissions must go through the function.
6. Test valid blessing, valid capsule, invalid payload, CAPTCHA failure, rate-limit rejection, missing backend, mobile form behavior, and private capsule isolation.
7. Verify guest text is escaped when displayed (existing app uses textContent).
8. Only then enable production submissions and verify database rows are created.

Note: The current `app.js` directly submits to Supabase if legacy `supabaseUrl` and `supabaseAnonKey` are configured. Leave those unset. `secure-forms.js` replaces the legacy form event listeners when the secure endpoint is configured.

No live backend or keys were available to the assistant. Do not advertise guest messages as persisted until end-to-end verification passes.
