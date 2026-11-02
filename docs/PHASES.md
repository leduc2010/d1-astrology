# Phases — Ortus Destiny, React Native port

Port of the Kotlin/Compose app (reference: `D:\DLAB\d1-astrology`, phases P0–P12 there, read-only).
Same features, flows and look. Status legend: `[ ]` todo · `[~]` in progress · `[x]` done (commit hash).

Rules for every phase: `npm run typecheck`, `npm run lint`, `npm test` green → local conventional commit
(never push) → review the diff (typescript/react reviewer), fix HIGH, log deferred items and parity gaps in `docs/BUGS.md`.

## P0 — Foundation
- [x] Separate git repo, Expo SDK 58 + TypeScript strict + Expo Router (`src/app/`), Jest (`jest-expo`), ESLint (`expo lint`)
- [x] Design system `src/designsystem/`: colors, type, spacing, shapes, motion tokens, gradients, icons, starfield, buttons, cards, chips, tab bar, sheets, inputs, wheel picker
- [x] Navigation: bottom bar (Today · Calendar · Charts · Ask AI · Me), child screens on the root stack, `src/navigation/routes.ts` helpers
- [x] Sound: cues ported from the Kotlin WAVs, one `SoundPlayer`, honours the Settings toggle, max one cue per action
- [x] i18n: i18next + converter from the Android `strings.xml` files, 14 locales (en default, vi, es, pt-BR, fr, de, ru, hi, id, ko, zh, ar, nl, bn)

## P1 — Engine (pure TS + tests)
- [x] Julian day, solar time, VN historical zones, lunar calendar (VN/CN meridian), Vietnam lunar switch years
- [x] Can chi, almanac (Trực, 28 tú, hoàng đạo hours, solar terms, festivals, moon phase, directions, life trigram)
- [x] Sun, planets, natal chart (angles, whole-sign houses, aspects)
- [x] BaZi pillars, details, luck pillars, strength; Tử Vi chart + brightness; match (BaZi, folk, synastry); yearly outlook
- [x] Every Kotlin engine test ported, incl. Swiss Ephemeris reference tolerances

## P2 — Splash, language, onboarding
- [x] Splash held until settings and profile load; language sheet (root layout, core/ui `LanguageSheet`)
- [x] Onboarding S01-01…08 (welcome, consent, solar/lunar date cross-check, time unknown allowed, place search + manual coords with optional UTC offset, name/gender, review with zone history, chart build)
- [x] Profile store (AsyncStorage), place catalog, true solar time, day turns at 23:00 true solar (core/data, bb14f24)

## P3 — Today + Calendar + Day detail
- [x] Today (date hero, pillars, hours grid, personal section, yearly outlook, day facts)
- [x] Calendar 1901–2099 month pager (6-week grid, legend, upcoming, week start setting)
- [x] Day detail (prev/next, pillars, hours, officer/mansion/moon/term, good/avoid, clash, disclaimer)

## P4 — Charts
- [x] Hub; Bát Tự (pillar table, ten gods, hidden stems, stages, nạp âm, balance, luck pillars, strength)
- [x] Tử Vi 4×4 grid, palace detail sheet, Tuần/Triệt/Thân, Tứ Hóa, star texts by brightness
- [x] Natal wheel (SVG), big three, planets with houses and texts, aspects, elements, unknown-time Moon

## P5 — Readings, Ask AI (mock), Match
- [x] Readings: lens switch, six topics with agreement counts, article, my trio, feedback, disclaimer
- [x] Ask AI mock: streamed sample answers, sources sheet, persisted daily quota + rewarded-ad stub, crisis notice (14 locales), investment decline, disclaimer
- [x] Match: saved pairs, add person (consent, on-device), result by system (synastry level bars, Bát Tự marks, folk bonds), ≤3 strengths / ≤3 cares, no total %

## P6 — Premium stub, Me, Profiles, Privacy
- [x] Billing interface + stub (Unknown/Free/Premium), paywall + My plan (hidden while `premiumEnabled=false`)
- [x] Me: language, sound, reduced motion, week start, personalised tips consent, usage consent; Profiles + edit birth details; Privacy erase-all; legal links hidden when blank; support lines

## P7 — Telemetry, ads stubs, translations check, RTL
- [x] Remote config defaults + clamps, analytics/crash no-ops behind usage consent (off by default); ad placements interface + stub (core/telemetry, wired in the root layout)
- [x] Locale key/placeholder check (`src/i18n/__tests__/locales.test.ts`, mirrors Kotlin `check_locales.py`), RTL for Arabic (`applyLayoutDirection` + one reload on switching direction)

## P8 — Verification
- [x] Walk every tab on the Android emulator (Expo Go); fix what it shows; final review (025a44c, 314e4f7, b8fffd1, 93db914)

## Log
- 2026-11-02 — Repo created at `D:\DLAB\ortus-destiny-rn` (own git repo, per user request; not inside d1-astrology). Expo SDK 58, RN 0.88, React 19.3, TS 6.
- 2026-11-03 — P1 engine ported to `src/engine/` (pure TS, 25 modules, barrel `index.ts`); all 11 Kotlin engine test classes ported (93 tests) incl. Swiss Ephemeris tolerances. Rename: natal `elementBalance` → `zodiacElementBalance` (clashed with BaZi `elementBalance` in the barrel).
- 2026-11-03 — P0: design system (tokens checked against Kotlin `Dimens.kt`/`Color.kt` fixture, starfield via ported Kotlin `Random(seed)`), sound (`SoundPlayer`, 6 WAV cues), i18n (14 locales converted from `strings.xml`), route helpers. Flat route graph like Kotlin: tabs under `(tabs)`, child screens on the root stack.
- 2026-11-03 — Core: `src/core/model`, `core/data` (repositories, resolved birth, places, billing/ads stubs, eraser; 41 Kotlin tests ported), `core/reading`, `core/telemetry`, `core/ui` (text helpers, birth wheels, shared bits). App shell: splash hold, language, onboarding gate, consent, screen views by route name, ad placements (Free only), Premium offered (`EXPO_PUBLIC_PREMIUM_ENABLED`, off by default).
- 2026-11-03 — Features P2–P6 ported by parallel agents, each with every Kotlin feature test (onboarding 17, today/calendar 23, charts 8, AI, readings/match 31, me/premium 35); full suite 66 suites / 568 tests green. Shared bits moved into core/ui (date text, screen model, app links); `FadingScrollView` forwards its ref. Parity gaps R009–R016 in `docs/BUGS.md`. Next: review pass, then P8 emulator walk.
- 2026-11-03 — P8: walked every tab and child screen on the Android emulator in Expo Go with made-up birth data (onboarding, Today, Day detail, Calendar, Charts hub, Tử Vi, Bát Tự, Natal, Ask AI, Readings, My trio, Match add/result/remove, Me, Profiles, edit birth, Privacy + erase sheet, language sheet with 14 locales, Vietnamese and Arabic strings). Fixed: sheets under the status bar and tall sheet scrolling, `withAlpha` crash on rgba tokens (Natal), palace grid uneven widths and stale borders, link buttons stretching. Full suite 68 suites / 576 tests green. Remaining gaps R018–R025 in `docs/BUGS.md`. All phases done.
