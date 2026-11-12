/**
 * Turns an OpenAI-compatible streaming chat completion (server-sent events) into plain text
 * chunks. Gemini (OpenAI compatibility), DeepSeek, Qwen, Kimi and GLM all speak this format, so
 * the provider is a matter of AI_BASE_URL and AI_MODEL.
 */

/** The text a single `data:` line adds, or null for keep-alives, `[DONE]` and reasoning-only deltas. */
export function deltaText(line: string): string | null {
  if (!line.startsWith('data:')) return null;
  const data = line.slice('data:'.length).trim();
  if (data === '' || data === '[DONE]') return null;
  try {
    const event = JSON.parse(data) as { choices?: { delta?: { content?: unknown } }[] };
    const content = event.choices?.[0]?.delta?.content;
    return typeof content === 'string' && content !== '' ? content : null;
  } catch {
    return null;
  }
}

/** Reads SSE bytes and passes on only the answer text, as UTF-8. */
export function sseToText(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let pending = '';
  const emitLines = (controller: TransformStreamDefaultController<Uint8Array>, flush: boolean) => {
    const lines = pending.split('\n');
    pending = flush ? '' : (lines.pop() ?? '');
    for (const line of lines) {
      const text = deltaText(line.replace(/\r$/, ''));
      if (text !== null) controller.enqueue(encoder.encode(text));
    }
  };
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        pending += decoder.decode(chunk, { stream: true });
        emitLines(controller, false);
      },
      flush(controller) {
        pending += decoder.decode();
        emitLines(controller, true);
      },
    }),
  );
}
