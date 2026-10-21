# Getting Nico Builds! (game #2) into the App Store

**Already done in this repo (nothing to do):**
- Capacitor iOS project with bundle id `com.nickhigh.game2`: portrait, iPhone only, iOS 15+, status bar hidden, and `ITSAppUsesNonExemptEncryption=false`.
- An original app icon at every size: `store/icons/icon-{20,29,40,58,60,76,80,87,120,152,167,180,1024}.png` plus `AppIcon-512@2x.png` in the asset catalog. It is a full-bleed square with no alpha channel.
- Launch art: `store/launch-2732.png` and the `Splash.imageset`.
- StoreKit 2 products in code (`src/store.ts`) and in `store/products.json`, shown only behind the parental gate.
- `codemagic.yaml`: the same workflow and signing setup as the science-game (integration `codemagic`, environment group `ios_signing_key`, secret `CERTIFICATE_PRIVATE_KEY`).
- Privacy and support pages: https://nhigh723.github.io/nico-game-2/privacy.html and https://nhigh723.github.io/nico-game-2/support.html
- Phone screenshots in `screenshots/`. They are 1170×2532, which is the 6.1" size; Apple's required 6.9" size is 1320×2868, so re-shoot them at that size first.

**Nothing has been published, and no secrets were created or changed.**

## What Nick has to do by hand

### Before anything else
1. **Final name:** the name is on hold for the attorney check. Set `MASCOT_NAME` in `src/brand.ts`, then update the static names listed in the README. Apple's app name must be unique.
2. **Support email:** send one so it can go on `support.html` and `privacy.html`. Apple rejects pages without a contact.

### Apple Developer and App Store Connect
3. **Register the bundle id:** developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → **+** → App IDs → App. Use the explicit bundle ID `com.nickhigh.game2` and leave every capability off. In-App Purchase is on by default.
4. **Create the app:** App Store Connect → Apps → **+** → New App. Platform iOS, the name from step 1, bundle id `com.nickhigh.game2`, SKU `game2`.
5. **Send back the Apple ID number** from App Information. It replaces `APP_STORE_APPLE_ID: 0000000000` in `codemagic.yaml`.
6. **Paid Apps Agreement:** this is already done if game #1 did it, since it is per account.
7. **Pricing and subscriptions:**
   - Price: Free, all countries.
   - Create the subscription group "Nico Club (game 2)" with:
     - `com.nickhigh.game2.club.yearly`: 1 year, $29.99, 7-day free trial, level 1.
     - `com.nickhigh.game2.club.monthly`: 1 month, $4.99, 7-day free trial, level 2.
   - Create the non-consumable `com.nickhigh.game2.forever` at $59.99.
   - Give each product a display name, a description and a review screenshot. The grown-ups screen behind the gear works for the screenshot.
8. **App Privacy:** answer "Data Not Collected".
9. **Age rating and Kids Category:** set the age rating to 4+ and choose Kids Category, ages 5 and under.
10. **Store listing:**
    - Subtitle, description and keywords: draft these from the README.
    - Support URL and privacy URL: the two pages above.
    - Screenshots: upload `screenshots/` after re-shooting at 1320×2868.
11. **Code-repo access for Codemagic:** if the repo should be private, flip `nhigh723/nico-game-2` to private. GitHub Pages on a private repo needs a paid plan, so the web demo would then need another host.

### Codemagic
12. **Add the app:** Add application → GitHub → `nhigh723/nico-game-2` → Capacitor/Other. Codemagic picks up `codemagic.yaml`.
13. **API key integration:** if the team integration named `codemagic` (Developer Portal API key) already exists from game #1, it is reused. Otherwise add it under Team settings → Team integrations → Developer Portal.
14. **Environment variables:** in this app's settings, add the group `ios_signing_key` with the secure variable `CERTIFICATE_PRIVATE_KEY`. Use the same value as game #1 so the same distribution certificate is reused. If it is already a team-level group, skip this.
15. **Build:** Start new build → workflow **iOS release (TestFlight)**. Test the purchases with a Sandbox tester (Users and Access → Sandbox) on TestFlight.

### Submit
16. When you're happy with it, submit the TestFlight build for review together with the three in-app products.
