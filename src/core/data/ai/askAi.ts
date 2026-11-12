import { fetch as expoFetch } from 'expo/fetch';

/**
 * The online Ask AI seam (RN-only). The app talks to its own proxy (server/ai-proxy), which holds
 * the model key and the house rules. What goes out is the question, the app language, a few
 * earlier turns and a chart summary already worked out on the device: never a name or birth place
 * (the summary is derived from the birth date and time; the consent sheet says so).
 */
export type AskAiTurn = { readonly role: 'user' | 'assistant'; readonly content: string };

export type AskAiRequest = {
  readonly question: string;
  readonly language: string;
  /** Chart facts as plain text (see features/ai/chartContext). */
  readonly chart: string;
  readonly history: readonly AskAiTurn[];
};

/** busy: rate limited, try again shortly. failed: offline, proxy or provider error. */
export type AskAiFailure = 'busy' | 'failed';

export class AskAiError extends Error {
  constructor(readonly failure: AskAiFailure) {
    super(`Ask AI ${failure}`);
    this.name = 'AskAiError';
  }
}

export interface AskAi {
  /**
   * Streams the answer to [onText] chunk by chunk and resolves when it is complete. Rejects with
   * [AskAiError], or with an abort error once [signal] fires.
   */
  ask(request: AskAiRequest, onText: (chunk: string) => void, signal: AbortSignal): Promise<void>;
}

type StreamingFetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal: AbortSignal },
) => Promise<{ ok: boolean; status: number; body: ReadableStream<Uint8Array> | null }>;

/** No byte from the proxy for this long (first byte or between chunks) counts as a failure. */
export const ASK_AI_IDLE_MS = 30_000;

/** Calls the proxy's POST /v1/ask and reads its plain-text stream. */
export class HttpAskAi implements AskAi {
  constructor(
    private readonly baseUrl: string,
    private readonly appKey: string,
    private readonly fetcher: StreamingFetch = expoFetch as unknown as StreamingFetch,
    private readonly idleMs: number = ASK_AI_IDLE_MS,
  ) {}

  async ask(request: AskAiRequest, onText: (chunk: string) => void, signal: AbortSignal): Promise<void> {
    // Our own controller: aborted by the caller's signal or by a stalled connection.
    const inner = new AbortController();
    const onAbort = () => inner.abort();
    signal.addEventListener('abort', onAbort);
    let timer: ReturnType<typeof setTimeout> | null = null;
    const arm = () => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => inner.abort(), this.idleMs);
    };
    arm();
    try {
      await this.stream(request, onText, inner.signal, arm);
    } catch (e) {
      if (signal.aborted) throw e;
      throw e instanceof AskAiError ? e : new AskAiError('failed');
    } finally {
      if (timer !== null) clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
    }
  }

  private async stream(
    request: AskAiRequest,
    onText: (chunk: string) => void,
    signal: AbortSignal,
    onProgress: () => void,
  ): Promise<void> {
    const response = await this.fetcher(`${this.baseUrl.replace(/\/$/, '')}/v1/ask`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-app-key': this.appKey },
      body: JSON.stringify(request),
      signal,
    });
    if (response.status === 429) throw new AskAiError('busy');
    if (!response.ok || response.body === null) throw new AskAiError('failed');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    // A read that never settles (stalled body) still ends when the signal fires.
    const aborted = new Promise<never>((_, reject) => {
      const fail = () => {
        reject(new AskAiError('failed'));
        reader.cancel().catch(() => undefined);
      };
      if (signal.aborted) fail();
      else signal.addEventListener('abort', fail, { once: true });
    });
    aborted.catch(() => undefined);
    for (;;) {
      const { done, value } = await Promise.race([reader.read(), aborted]);
      if (done) break;
      onProgress();
      const text = decoder.decode(value, { stream: true });
      if (text !== '') onText(text);
    }
    // A cancelled read ends like a finished one: an abort is never a complete answer.
    if (signal.aborted) throw new AskAiError('failed');
    const rest = decoder.decode();
    if (rest !== '') onText(rest);
  }
}

/**
 * The proxy from the build's EXPO_PUBLIC_AI_PROXY_URL (and optional EXPO_PUBLIC_AI_APP_KEY), or
 * null when the build has none: Ask AI then answers offline from the owner's readings.
 */
export function askAiFromEnv(): AskAi | null {
  const url = process.env.EXPO_PUBLIC_AI_PROXY_URL;
  if (!url) return null;
  return new HttpAskAi(url, process.env.EXPO_PUBLIC_AI_APP_KEY ?? '');
}
