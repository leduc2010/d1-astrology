/**
 * Ask AI proxy (Cloudflare Worker). Holds the model API key so it never ships in the app,
 * applies the house rules, rate-limits per client and streams the answer back as plain text.
 *
 * POST /v1/ask  { question, language, chart, history }  ->  200 text/plain (streamed)
 * Errors: 400 bad request, 401 wrong app key, 413 too large, 429 rate limited, 502 provider failed.
 */
import { BadRequest, chatMessages, LIMITS, parseAskRequest } from './prompt.ts';
import { sseToText } from './upstream.ts';

/** Cloudflare's rate limiting binding (wrangler.toml `[[ratelimits]]`). */
type RateLimiter = { limit(options: { key: string }): Promise<{ success: boolean }> };

export type Env = {
  /** OpenAI-compatible base URL, e.g. https://generativelanguage.googleapis.com/v1beta/openai */
  AI_BASE_URL: string;
  AI_MODEL: string;
  /** Optional OpenAI `reasoning_effort` (e.g. "minimal" for Gemini 3); left out when unset. */
  AI_REASONING_EFFORT?: string;
  /** Secret: `wrangler secret put AI_API_KEY`. */
  AI_API_KEY: string;
  /** Optional secret the app sends as X-App-Key; keeps casual callers out (not real security). */
  APP_KEY?: string;
  ASK_LIMITER?: RateLimiter;
};

const MAX_BODY_BYTES = 64_000;
/** The whole provider call, stream included. */
const PROVIDER_TIMEOUT_MS = 60_000;

const plain = (status: number, text: string): Response =>
  new Response(text, { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });

export async function handle(request: Request, env: Env, fetcher: typeof fetch = fetch): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === '/health') return plain(200, 'ok');
  if (url.pathname !== '/v1/ask') return plain(404, 'not found');
  if (request.method !== 'POST') return plain(405, 'method');
  if (env.APP_KEY && request.headers.get('x-app-key') !== env.APP_KEY) return plain(401, 'key');

  const client = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (env.ASK_LIMITER && !(await env.ASK_LIMITER.limit({ key: client })).success) return plain(429, 'slow down');

  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return plain(413, 'too large');
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return plain(413, 'too large');
  let ask;
  try {
    ask = parseAskRequest(JSON.parse(raw));
  } catch (e) {
    return plain(400, e instanceof BadRequest ? e.message : 'json');
  }

  let upstream: Response;
  try {
    upstream = await fetcher(`${env.AI_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.AI_API_KEY}` },
      body: JSON.stringify({
        model: env.AI_MODEL,
        messages: chatMessages(ask),
        stream: true,
        temperature: 0.7,
        max_tokens: LIMITS.maxOutputTokens,
        ...(env.AI_REASONING_EFFORT ? { reasoning_effort: env.AI_REASONING_EFFORT } : {}),
      }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
  } catch {
    return plain(502, 'provider');
  }
  if (upstream.status === 429) return plain(429, 'provider busy');
  if (!upstream.ok || upstream.body === null) {
    // Status only: provider error bodies can echo the request.
    console.warn(`provider status ${upstream.status}`);
    return plain(502, 'provider');
  }
  return new Response(sseToText(upstream.body), {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export default {
  fetch: (request: Request, env: Env): Promise<Response> => handle(request, env),
};
