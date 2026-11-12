# Ortus Destiny (React Native) — project rules

Personal app (not a Leansoft app). App ID: `com.ortusdestiny.astrology.astra`.
React Native port of the Kotlin app in `D:\DLAB\d1-astrology` (read-only reference: spec `TAI-LIEU-DAC-TA-APP.md`,
design `design/brief-claude-design.md`, Kotlin sources). Progress: `docs/PHASES.md` — read it first. Parity gaps: `docs/BUGS.md`.
See also `AGENTS.md` (Expo rules).

## Toolchain
- Node 22 is required by Expo SDK 58. Portable copy: `export PATH=/d/DLAB/tools/node22:$PATH` before any npm/npx command (system Node is 20).
- `npm run typecheck`, `npm run lint`, `npm test`; `npm run check` runs all three.
- `.npmrc` sets `legacy-peer-deps` (expo-router's web deps pull react-dom 19.3.1 vs react 19.3.0).

## Code rules
- `src/engine/` is pure TypeScript: no React, no I/O. Outputs must match the Kotlin engine on the same inputs.
- Shared look lives in `src/designsystem/` only; features never hard-code colors, durations or sizes that exist as tokens.
- Every user-visible string goes through i18n (`src/i18n/`); English default; 14 locales.
- Motion: slow, subtle, uses motion tokens, respects reduced motion. Sound only through `SoundPlayer`, max one cue per action.
- Ads/billing/telemetry are interfaces with stubs; no real IDs or keys. Never send birth data to any SDK or third party.
- Ask AI (RN-only) is the one online feature: after the owner's consent (`aiConsent`) it sends the question, language,
  a few earlier turns and the chart summary from `features/ai/chartContext.ts` to our proxy `server/ai-proxy`
  (Cloudflare Worker, OpenAI-compatible provider). Never name or birth place, and no literal date or clock time; the
  summary is derived from birth date/time, which the consent copy discloses. The model key lives only in the
  Worker's secrets. Without `EXPO_PUBLIC_AI_PROXY_URL` Ask AI answers offline. Proxy checks: `cd server/ai-proxy && npm test`.
- RN-only strings go in `src/i18n/rn-strings.json` (all 14 locales); `npm run i18n:convert` merges them.
- Content: disclaimers on reading/AI/match screens, no total compatibility %, no fear-based wording, no copied interpretation text.
- Do not bundle Swiss Ephemeris code or data (AGPL).
- Tests and emulator use made-up birth data only.

## Workflow
- One phase at a time; typecheck + lint + jest green before a local conventional commit. Never push.
- After each phase: review the diff, fix HIGH, log deferred items in `docs/BUGS.md`.
- Subagents: pass `model: "opus"` (the default subagent model fails).
