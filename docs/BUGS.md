# Bugs and parity gaps (React Native port)

Format: `R###` · severity · area — description. Kotlin bug IDs (B###) refer to `d1-astrology/docs/BUGS.md`.

## Open
- R001 · MEDIUM · sound — Android has no ringer-mode check: cues may play in silent/vibrate mode (Kotlin checks `AudioManager.ringerMode`). iOS honours the silent switch via `playsInSilentMode: false`. Needs a small native module or `expo-audio` support.
- R002 · LOW · designsystem — Glow uses RN `boxShadow` instead of a Compose blur; the scroll-fade band slope differs slightly; iOS RTL fade direction untested.
- R003 · LOW · designsystem — Bottom sheet drags from the handle only; wheel picker uses ScrollView `snapToInterval` with an 80 ms settle grace instead of LazyColumn snap-fling.
- R004 · LOW · designsystem — Tab icon tint cross-fades two glyphs instead of a colour tween; chips/segments expose role `tab`; tab bar hides on Keyboard events rather than IME insets.
- R005 · INFO · build — `@react-native-masked-view/masked-view` is native: Expo Go has it, a dev client needs a rebuild.

## Fixed
