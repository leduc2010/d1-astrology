# Bugs and parity gaps (React Native port)

Format: `R###` · severity · area — description. Kotlin bug IDs (B###) refer to `d1-astrology/docs/BUGS.md`.

## Open
- R001 · MEDIUM · sound — Android has no ringer-mode check: cues may play in silent/vibrate mode (Kotlin checks `AudioManager.ringerMode`). iOS honours the silent switch via `playsInSilentMode: false`. Needs a small native module or `expo-audio` support.
- R002 · LOW · designsystem — Glow uses RN `boxShadow` instead of a Compose blur; the scroll-fade band slope differs slightly; iOS RTL fade direction untested.
- R003 · LOW · designsystem — Bottom sheet drags from the handle only; wheel picker uses ScrollView `snapToInterval` with an 80 ms settle grace instead of LazyColumn snap-fling.
- R004 · LOW · designsystem — Tab icon tint cross-fades two glyphs instead of a colour tween; chips/segments expose role `tab`; tab bar hides on Keyboard events rather than IME insets.
- R005 · INFO · build — `@react-native-masked-view/masked-view` is native: Expo Go has it, a dev client needs a rebuild.
- R006 · LOW · core/data — Zone offsets come from `Intl` (Hermes ICU); old historical rules may differ from java.time tzdb on some devices. Vietnam North/South history is table-driven and matches Kotlin tests.
- R007 · LOW · core/data — Birth clock keeps minutes only (seconds truncated), as Kotlin; AsyncStorage writes are per-key, not atomic across a whole profile.
- R008 · INFO · core/data — Settings `clear()` keeps the chosen `app_language` (Android keeps per-app locale outside DataStore); AskUsage stores the local epoch day instead of an ISO string.
- R009 · LOW · ai — Support opens as the `/ai-support` stack screen (Kotlin cross-fades inside the tab). Support country comes from the `expo-localization` region only (Kotlin: network → SIM → system region).
- R010 · LOW · ai — Rewarded-ad offer is gated by the `ai_rewarded` placement (none for Premium); readings for the chat are computed on the JS thread; usage save errors are swallowed (Kotlin: IOException only). Chat uses a plain ScrollView with scroll-to-end, like Kotlin (no scroll fade there). `aiModel.ts` is 326 lines.
- R011 · LOW · calendar — Month pager is a paging FlatList (current = page >51% visible); month pages and the 60-day upcoming list are built on the JS thread; the day hero only fades in (no cross-fade out). Dates and weekday names use `Intl`, so a few locales may word them slightly differently from `java.time`; the date-pattern test checks pattern letters instead of parsing with Java.
- R013 · LOW · charts — Charts computed on the JS thread; natal wheel glyphs tilt with the ring during the 1.2 s intro (upright at rest); luck strip scrolls to the current pillar once its tiles are measured (one frame at the start first); selected palace card fades in without cross-fading the old one out; open sheets are not restored after process death.
- R014 · LOW · onboarding — Save failures catch any error (Kotlin: IOException) and offer retry; the coordinates sheet shows a saved place as `20` not `20.0` and uses the `numeric` keyboard; steps drift with Reanimated keyframes instead of `AnimatedContent`, and the erase-failed notice fades rather than expanding.
- R015 · LOW · me/premium — "Manage subscription" always opens the Google Play subscriptions page (iOS would need the App Store page). Legal links, support e-mail and version come from `EXPO_PUBLIC_TERMS_URL` / `EXPO_PUBLIC_PRIVACY_URL` / `EXPO_PUBLIC_SUPPORT_EMAIL` and the Expo config; a build without them hides those rows. Models catch any error (Kotlin: IOException). Purchase in progress blocks hardware back and swipe-back. Week-start labels use a local weekday helper.
- R016 · LOW · readings/match — Readings and match reports are computed synchronously in `useMemo` (Kotlin: `Dispatchers.Default`); save/delete catch any error; an unknown readings topic in the route goes back (RN-only, tested); add-person form holds a year range instead of a year list (the RN wheels take a range); each axis row is announced as one label.
- R017 · INFO · core/data — Erase-all clears partners, profile and settings but keeps the Ask AI daily counter, as Kotlin `DataEraser` does: it holds no personal data, and clearing it would let erase-all reset the daily quota.

## Fixed
- R012 · fixed 35c7e2e · today/calendar — `fullDateText` was duplicated in `features/today` and `features/calendar`; move the date text helpers into `core/ui/dateText.ts`.
