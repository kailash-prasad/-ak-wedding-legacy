# A & K — Royal Heirloom upgrade

## Scope
Implemented on feature/royal-thank-you-simplified. The existing Netlify project deploys this branch to https://lustrous-pastelito-d75323.netlify.app/.
No production main merge, invitation repository edits, DNS changes, new backend, or secret changes.

## Experience
- Botanical bronze double doors, central crest, 3D opening, light spill, skip/replay, focus containment.
- Ivory courtyard with original scalable architectural artwork, drifting petals and moving botanical layers.
- Interactive unfolding envelope, readable parchment letter, signature flourish.
- Four illustrated chapters with autoplay, pause, tabs, arrows, keyboard navigation, touch/mouse horizontal gestures and modal viewing.
- Parchment guestbook, existing server endpoint and Turnstile integration, success animation only after HTTP success with {ok:true}.
- Moonlit courtyard farewell with ascending lanterns.
- Reduced-motion media query plus a manual motion control; autoplay stops when offscreen or hidden, paused, modal-open or keyboard-focused.

## Updating photographs
Edit memories-config.js. Set each chapter's image from null to a local asset path or HTTPS URL, and supply descriptive alt text.
Set albumUrl to the real album URL and albumIsPlaceholder to false.
Current images are explicitly labeled illustrations. The example.com album is explicitly marked temporary.

## Verification
- Node syntax checks, git diff --check.
- Seven isolated submission tests: confirmed saved, false-success rejection, 429, 403, 503, network uncertainty and failed verification script. Run: node tests/secure-forms.test.cjs.
- Live browser: doors reveal main content; letter unfolds and becomes focusable; gallery changes chapter, pauses and opens/closes enlarged artwork.
- Autoplay observed advancing chapter in the live browser.
- 360 and 390 px phone-width iframe reviews; document width equals viewport after entrance. These are browser layout checks, not physical-device performance tests.
- Manual motion-off tested with the letter; it remains readable.
- Live backend OPTIONS returns 204; missing-token request returns 400 with Verification required.
- Existing deployed Supabase function matches repository backend source. No backend change.
- Live successful message submission remains unverified because Cloudflare requests an interactive human verification. The protection was not bypassed.
- OS-level prefers-reduced-motion and physical iPhone/Android frame rates were not emulated or measured.
