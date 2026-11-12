# Ask AI proxy (Cloudflare Worker)

Holds the model API key, applies the house rules (`src/prompt.ts`) and streams answers to the app.
The app sends only the question, its language, up to 6 earlier turns and a chart summary worked out
on the device. It never sends a name or birth place. Pillars and planet positions can be worked
back to the birth date and time, and the app's consent text says so. Request bodies are not logged.

Provider: any OpenAI-compatible chat API. The default is Google Gemini (`gemini-3.1-flash-lite`,
`AI_REASONING_EFFORT = "minimal"`). Use a key with billing on: on the free tier Google may use
prompts to improve its products. To switch, change `AI_BASE_URL`, `AI_MODEL` and
`AI_REASONING_EFFORT` in `wrangler.toml`. Remove `AI_REASONING_EFFORT` for a provider that does
not accept `reasoning_effort`. Examples:

| Provider | AI_BASE_URL | AI_MODEL (check the provider's docs) |
|---|---|---|
| Gemini (default) | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-3.1-flash-lite` |
| DeepSeek | `https://api.deepseek.com` | `deepseek-flash` |
| Qwen (Alibaba, intl) | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | a `qwen-*` model |
| Kimi (Moonshot) | `https://api.moonshot.ai/v1` | a `kimi-*` model |
| GLM (Zhipu) | `https://open.bigmodel.cn/api/paas/v4` | a `glm-*` model |

## Run locally

```bash
cd server/ai-proxy
npm install
cp .dev.vars.example .dev.vars   # put your provider key in AI_API_KEY
npm run dev                      # http://localhost:8787
```

App side (Android emulator reaches the Mac at 10.0.2.2), in the project root `.env.local`:

```
EXPO_PUBLIC_AI_PROXY_URL=http://10.0.2.2:8787
EXPO_PUBLIC_AI_APP_KEY=<same as APP_KEY>
```

Restart Metro after changing it (`EXPO_PUBLIC_*` values are inlined at bundle time). Without
`EXPO_PUBLIC_AI_PROXY_URL`, Ask AI answers offline from the owner's readings.

## Deploy

```bash
npx wrangler login
npx wrangler secret put AI_API_KEY    # Gemini key from Google AI Studio (billing on)
npx wrangler secret put APP_KEY
npm run deploy                   # prints https://ortus-ai-proxy.<account>.workers.dev
```

Then build the app with `EXPO_PUBLIC_AI_PROXY_URL` set to that URL.

## Checks

```bash
npm test          # node --test, no network
npm run typecheck
```

## Before a public release

- `APP_KEY` only keeps casual callers out, because anyone can pull it from the APK. Add Play
  Integrity / App Attest checks before a wide launch.
- The rate limit is a per-IP burst limit (20 a minute). The daily allowance is counted in the app.
  Move it server-side (KV or Durable Objects) if abuse shows up.
- Set a spending cap with the provider.
- The privacy policy must name the provider and its country, because chart summaries are processed
  there.
