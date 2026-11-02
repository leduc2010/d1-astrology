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
- R010 · LOW · ai — Rewarded-ad offer is gated by the `ai_rewarded` placement (none for Premium); readings for the chat are computed on the JS thread; usage save errors are swallowed (Kotlin: IOException only). Chat uses a plain ScrollView (FadingScrollView takes no ref) for scroll-to-end. `aiModel.ts` is 326 lines.
- R011 · LOW · calendar — Month pager is a paging FlatList (current = page >51% visible); month pages and the 60-day upcoming list are built on the JS thread; the day hero only fades in (no cross-fade out). Dates and weekday names use `Intl`, so a few locales may word them slightly differently from `java.time`; the date-pattern test checks pattern letters instead of parsing with Java.
- R012 · LOW · today/calendar — `fullDateText` is duplicated in `features/today` and `features/calendar`; move the date text helpers into `core/ui/dateText.ts`.
- R013 · LOW · charts — Charts computed on the JS thread; natal wheel glyphs tilt with the ring during the 1.2 s intro (upright at rest); luck strip opens at the current pillar via `contentOffset` (FadingScrollView takes no ref, so the leading fade can lag); selected palace card fades in without cross-fading the old one out; open sheets are not restored after process death.
- R014 · LOW · onboarding — Save failures catch any error (Kotlin: IOException) and offer retry; the coordinates sheet shows a saved place as `20` not `20.0` and uses the `numeric` keyboard; steps drift with Reanimated keyframes instead of `AnimatedContent`, and the erase-failed notice fades rather than expanding.

## Fixed
