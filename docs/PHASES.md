# Phases — Ortus Destiny, React Native port

Port of the Kotlin/Compose app (reference: `D:\DLAB\d1-astrology`, phases P0–P12 there, read-only).
Same features, flows and look. Status legend: `[ ]` todo · `[~]` in progress · `[x]` done (commit hash).

Rules for every phase: `npm run typecheck`, `npm run lint`, `npm test` green → local conventional commit
(never push) → review the diff (typescript/react reviewer), fix HIGH, log deferred items and parity gaps in `docs/BUGS.md`.

## P0 — Foundation
- [x] Separate git repo, Expo SDK 58 + TypeScript strict + Expo Router (`src/app/`), Jest (`jest-expo`), ESLint (`expo lint`)
- [ ] Design system `src/designsystem/`: colors, type, spacing, shapes, motion tokens, gradients, icons, starfield, buttons, cards, chips, tab bar, sheets, inputs, wheel picker
- [ ] Navigation: bottom bar (Today · Calendar · Charts · Ask AI · Me), stacks per tab
- [ ] Sound: cues ported from the Kotlin WAVs, one `SoundPlayer`, honours the Settings toggle, max one cue per action
- [ ] i18n: i18next + converter from the Android `strings.xml` files, 14 locales (en default, vi, es, pt-BR, fr, de, ru, hi, id, ko, zh, ar, nl, bn)

## P1 — Engine (pure TS + tests)
- [x] Julian day, solar time, VN historical zones, lunar calendar (VN/CN meridian), Vietnam lunar switch years
- [x] Can chi, almanac (Trực, 28 tú, hoàng đạo hours, solar terms, festivals, moon phase, directions, life trigram)
- [x] Sun, planets, natal chart (angles, whole-sign houses, aspects)
- [x] BaZi pillars, details, luck pillars, strength; Tử Vi chart + brightness; match (BaZi, folk, synastry); yearly outlook
- [x] Every Kotlin engine test ported, incl. Swiss Ephemeris reference tolerances

## P2 — Splash, language, onboarding
- [ ] Splash held until settings and profile load; language sheet
- [ ] Onboarding S01-01…08 (welcome, consent, solar/lunar date cross-check, time unknown allowed, place search + manual coords with optional UTC offset, name/gender, review with zone history, chart build)
- [ ] Profile store (AsyncStorage), place catalog, true solar time, day turns at 23:00 true solar

## P3 — Today + Calendar + Day detail
- [ ] Today (date hero, pillars, hours grid, personal section, yearly outlook, day facts)
- [ ] Calendar 1901–2099 month pager (6-week grid, legend, upcoming, week start setting)
- [ ] Day detail (prev/next, pillars, hours, officer/mansion/moon/term, good/avoid, clash, disclaimer)

## P4 — Charts
- [ ] Hub; Bát Tự (pillar table, ten gods, hidden stems, stages, nạp âm, balance, luck pillars, strength)
- [ ] Tử Vi 4×4 grid, palace detail sheet, Tuần/Triệt/Thân, Tứ Hóa, star texts by brightness
- [ ] Natal wheel (SVG), big three, planets with houses and texts, aspects, elements, unknown-time Moon

## P5 — Readings, Ask AI (mock), Match
- [ ] Readings: lens switch, six topics with agreement counts, article, my trio, feedback, disclaimer
- [ ] Ask AI mock: streamed sample answers, sources sheet, persisted daily quota + rewarded-ad stub, crisis notice (14 locales), investment decline, disclaimer
- [ ] Match: saved pairs, add person (consent, on-device), result by system (synastry level bars, Bát Tự marks, folk bonds), ≤3 strengths / ≤3 cares, no total %

## P6 — Premium stub, Me, Profiles, Privacy
- [ ] Billing interface + stub (Unknown/Free/Premium), paywall + My plan (hidden while `premiumEnabled=false`)
- [ ] Me: language, sound, reduced motion, week start, personalised tips consent, usage consent; Profiles + edit birth details; Privacy erase-all; legal links hidden when blank; support lines

## P7 — Telemetry, ads stubs, translations check, RTL
- [ ] Remote config defaults + clamps, analytics/crash no-ops behind usage consent (off by default); ad placements interface + stub
- [ ] Locale key/placeholder check script, RTL for Arabic

## P8 — Verification
- [ ] Walk every tab on the Android emulator; fix what it shows; final review

## Log
- 2026-11-02 — Repo created at `D:\DLAB\ortus-destiny-rn` (own git repo, per user request; not inside d1-astrology). Expo SDK 58, RN 0.88, React 19.3, TS 6.
- 2026-11-03 — P1 engine ported to `src/engine/` (pure TS, 25 modules, barrel `index.ts`); all 11 Kotlin engine test classes ported (93 tests) incl. Swiss Ephemeris tolerances. Rename: natal `elementBalance` → `zodiacElementBalance` (clashed with BaZi `elementBalance` in the barrel).
