import { AskAiError, epochDayOf, HttpAskAi, type AskAi, type AskAiRequest } from '@/core/data';
import { DEFAULT_ASK_LIMITS } from '@/core/model';
import { Readings, readingCharts } from '@/core/reading';
import { resolveBirth } from '@/core/data';
import { currentUiText } from '@/core/ui';
import { FakeAskUsageRepository, FakeProfileRepository, TestProfiles } from '@/core/testing';

import { AiModel, historyOf, type AiReady } from '../aiModel';
import { freeLeft } from '../aiQuota';
import { chartContext } from '../chartContext';
import type { ChatMessage, ReplyMessage } from '../chatMessage';

// RN-only: the online Ask AI path (proxy client, chart summary, consent, streaming, refunds).

const DAY = epochDayOf({ year: 2026, month: 11, day: 1 });

/** An AskAi whose answer the test drives chunk by chunk. */
class ScriptedAskAi implements AskAi {
  readonly requests: AskAiRequest[] = [];
  private emit: ((chunk: string) => void) | null = null;
  private finish: (() => void) | null = null;
  private fail: ((e: unknown) => void) | null = null;
  signal: AbortSignal | null = null;

  ask(request: AskAiRequest, onText: (chunk: string) => void, signal: AbortSignal): Promise<void> {
    this.requests.push(request);
    this.emit = onText;
    this.signal = signal;
    return new Promise((resolve, reject) => {
      this.finish = resolve;
      this.fail = reject;
    });
  }

  write(chunk: string) {
    this.emit?.(chunk);
  }
  end() {
    this.finish?.();
  }
  error(e: unknown) {
    this.fail?.(e);
  }
}

let profiles: FakeProfileRepository;
let usage: FakeAskUsageRepository;
let askAi: ScriptedAskAi;
let granted: number;
let stops: (() => void)[];

beforeEach(() => {
  profiles = new FakeProfileRepository();
  profiles.state.set(TestProfiles.owner);
  usage = new FakeAskUsageRepository();
  askAi = new ScriptedAskAi();
  granted = 0;
  stops = [];
});

afterEach(() => stops.forEach((stop) => stop()));

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

async function startModel(consented = true): Promise<AiModel> {
  const model = new AiModel({
    profiles,
    rewardedAds: { show: () => Promise.resolve(false) },
    usage,
    today: () => DAY,
    askAi,
    grantAiConsent: async () => {
      granted++;
    },
  });
  model.setAllowance(false, DEFAULT_ASK_LIMITS);
  model.setAiConsent(consented);
  stops.push(model.start());
  await settle();
  return model;
}

function ready(model: AiModel): AiReady {
  const state = model.getState();
  if (state.kind !== 'ready') throw new Error(`expected ready, was ${state.kind}`);
  return state;
}

function lastReply(model: AiModel): ReplyMessage {
  const last = ready(model).messages.at(-1);
  if (last?.kind !== 'reply') throw new Error('expected a reply last');
  return last;
}

describe('chart summary', () => {
  const t = currentUiText();
  const charts = readingCharts(resolveBirth(TestProfiles.owner));
  const text = chartContext(t, charts, Readings.all(charts));

  it('holds the three systems and every topic', () => {
    expect(text).toContain('# Chart overview');
    expect(text).toMatch(/Day master: /);
    expect(text).toMatch(/Rising: /);
    expect(text.match(/^# /gm)).toHaveLength(7);
  });

  it('never holds the name, birth date, time or place', () => {
    const { name, date, place } = TestProfiles.owner;
    expect(text).not.toMatch(new RegExp(`\\b${name}\\b`)); // "Tan Lang" (a star) is fine
    expect(text).not.toContain(String(date.year));
    expect(text).not.toContain(place.name);
    expect(text).not.toMatch(/\b12:00\b/);
  });

  it('fits the proxy limit', () => {
    expect(text.length).toBeLessThan(16_000);
  });
});

describe('online answers', () => {
  it('asks for consent first, keeps the question, then sends it once agreed', async () => {
    const model = await startModel(false);

    expect(model.onAsk('Will work go well?')).toBe(false);
    expect(ready(model).askConsent).toBe(true);
    expect(askAi.requests).toHaveLength(0);
    expect(freeLeft(ready(model).quota)).toBe(DEFAULT_ASK_LIMITS.freePerDay);

    model.onAcceptAiConsent();

    expect(granted).toBe(1);
    expect(ready(model).askConsent).toBe(false);
    expect(askAi.requests.map((r) => r.question)).toEqual(['Will work go well?']);
  });

  it('declining sends nothing', async () => {
    const model = await startModel(false);
    model.onAsk('Will work go well?');

    model.onDeclineAiConsent();

    expect(ready(model).askConsent).toBe(false);
    expect(askAi.requests).toHaveLength(0);
    expect(ready(model).messages).toEqual([]);
  });

  it('streams the reply in, spends one question and sends the chart summary', async () => {
    const model = await startModel();

    expect(model.onAsk('  Will work go well?  ')).toBe(true);
    expect(lastReply(model).status).toBe('waiting');
    expect(ready(model).isAnswering).toBe(true);
    askAi.write('Your Career ');
    expect(lastReply(model)).toMatchObject({ status: 'streaming', text: 'Your Career ' });
    askAi.write('palace is calm.');
    askAi.end();
    await settle();

    expect(lastReply(model)).toMatchObject({ status: 'done', text: 'Your Career palace is calm.' });
    expect(ready(model).isAnswering).toBe(false);
    expect(freeLeft(ready(model).quota)).toBe(DEFAULT_ASK_LIMITS.freePerDay - 1);
    const request = askAi.requests[0]!;
    expect(request.question).toBe('Will work go well?');
    expect(request.language).toBe('en');
    expect(request.chart).toContain('# Chart overview');
    expect(request.history).toEqual([]);
  });

  it('gives the question back when the guide fails before writing anything', async () => {
    const model = await startModel();
    model.onAsk('Will work go well?');

    askAi.error(new AskAiError('busy'));
    await settle();

    expect(lastReply(model)).toMatchObject({ status: 'failed', failure: 'busy', refunded: true });
    expect(freeLeft(ready(model).quota)).toBe(DEFAULT_ASK_LIMITS.freePerDay);
  });

  it('keeps a partial reply when the stream breaks, and counts it', async () => {
    const model = await startModel();
    model.onAsk('Will work go well?');
    askAi.write('Half an answer');

    askAi.error(new AskAiError('failed'));
    await settle();

    expect(lastReply(model)).toMatchObject({ status: 'failed', failure: 'failed', text: 'Half an answer', refunded: false });
    expect(freeLeft(ready(model).quota)).toBe(DEFAULT_ASK_LIMITS.freePerDay - 1);
  });

  it('stop aborts the request; stopping before any text gives the question back', async () => {
    const model = await startModel();
    model.onAsk('Will work go well?');

    model.onStop();

    expect(askAi.signal?.aborted).toBe(true);
    expect(lastReply(model).status).toBe('failed');
    expect(freeLeft(ready(model).quota)).toBe(DEFAULT_ASK_LIMITS.freePerDay);
    expect(ready(model).isAnswering).toBe(false);
  });

  it('stop after some text keeps it', async () => {
    const model = await startModel();
    model.onAsk('Will work go well?');
    askAi.write('So far');

    model.onStop();
    askAi.end();
    await settle();

    expect(lastReply(model)).toMatchObject({ status: 'stopped', text: 'So far' });
  });

  it('New chat before any text gives the question back', async () => {
    const model = await startModel();
    model.onAsk('Will work go well?');

    model.onNewChat();
    await settle();

    expect(askAi.signal?.aborted).toBe(true);
    expect(ready(model).messages).toEqual([]);
    expect(freeLeft(ready(model).quota)).toBe(DEFAULT_ASK_LIMITS.freePerDay);
    expect(usage.state.current()?.freeUsed ?? 0).toBe(0);
  });

  it('a chunk arriving after Stop is ignored', async () => {
    const model = await startModel();
    model.onAsk('Will work go well?');
    askAi.write('So far');
    model.onStop();

    askAi.write(' and more');

    expect(lastReply(model)).toMatchObject({ status: 'stopped', text: 'So far' });
    expect(ready(model).isAnswering).toBe(false);
  });

  it('a consent that cannot be saved is asked for again next time', async () => {
    const model = new AiModel({
      profiles,
      rewardedAds: { show: () => Promise.resolve(false) },
      usage,
      today: () => DAY,
      askAi,
      grantAiConsent: () => Promise.reject(new Error('disk full')),
    });
    model.setAllowance(false, DEFAULT_ASK_LIMITS);
    stops.push(model.start());
    await settle();
    model.onAsk('First?');

    expect(model.onAcceptAiConsent()).toBe(true);
    await settle();
    model.onStop();
    model.onAsk('Second?');

    expect(ready(model).askConsent).toBe(true);
    expect(askAi.requests).toHaveLength(1);
  });

  it('a different profile starts a fresh conversation', async () => {
    const model = await startModel();
    model.onAsk('First?');
    askAi.write('One.');
    askAi.end();
    await settle();

    profiles.state.set(TestProfiles.other);
    await settle();

    expect(ready(model).messages).toEqual([]);
  });

  it('sends earlier finished turns as history', async () => {
    const model = await startModel();
    model.onAsk('First?');
    askAi.write('One.');
    askAi.end();
    await settle();

    model.onAsk('Second?');

    expect(askAi.requests[1]!.history).toEqual([
      { role: 'user', content: 'First?' },
      { role: 'assistant', content: 'One.' },
    ]);
  });

  it('crisis and investment questions never go online', async () => {
    const model = await startModel();

    model.onAsk('I want to kill myself');
    model.onAsk('Which stocks should I buy?');

    expect(askAi.requests).toHaveLength(0);
  });
});

test('historyOf skips failed replies and offline answers, keeps the newest turns', () => {
  const reply = (id: number, text: string, status: ReplyMessage['status']): ReplyMessage => ({
    kind: 'reply',
    id,
    text,
    status,
    failure: null,
    refunded: false,
  });
  const messages: ChatMessage[] = [];
  for (let i = 0; i < 5; i++) {
    messages.push({ kind: 'question', id: i * 2, text: `q${i}` }, reply(i * 2 + 1, `a${i}`, 'done'));
  }
  messages.push({ kind: 'question', id: 20, text: 'lost' }, reply(21, '', 'failed'));

  expect(historyOf(messages).map((t) => t.content)).toEqual(['q2', 'a2', 'q3', 'a3', 'q4', 'a4']);
});

describe('HttpAskAi', () => {
  const stream = (...chunks: string[]) =>
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
        controller.close();
      },
    });
  const request: AskAiRequest = { question: 'q', language: 'vi', chart: 'c', history: [] };

  it('posts to /v1/ask with the app key and streams the text', async () => {
    const calls: { url: string; headers: Record<string, string>; body: string }[] = [];
    const client = new HttpAskAi('https://proxy.example/', 'k', async (url, init) => {
      calls.push({ url, headers: init.headers, body: init.body });
      return { ok: true, status: 200, body: stream('Xin ', 'chào') };
    });
    const chunks: string[] = [];

    await client.ask(request, (c) => chunks.push(c), new AbortController().signal);

    expect(chunks.join('')).toBe('Xin chào');
    expect(calls[0]!.url).toBe('https://proxy.example/v1/ask');
    expect(calls[0]!.headers['x-app-key']).toBe('k');
    expect(JSON.parse(calls[0]!.body)).toEqual(request);
  });

  it.each([
    [429, 'busy'],
    [502, 'failed'],
    [400, 'failed'],
  ])('maps status %i to %s', async (status, failure) => {
    const client = new HttpAskAi('https://p', '', async () => ({ ok: false, status, body: null }));
    await expect(client.ask(request, () => undefined, new AbortController().signal)).rejects.toEqual(
      new AskAiError(failure as 'busy' | 'failed'),
    );
  });

  it('a stalled connection times out as a failure', async () => {
    const stalled = new ReadableStream<Uint8Array>({ start() {} });
    const client = new HttpAskAi('https://p', '', async (_url, init) => {
      init.signal.addEventListener('abort', () => undefined);
      return { ok: true, status: 200, body: stalled };
    }, 20);
    await expect(client.ask(request, () => undefined, new AbortController().signal)).rejects.toEqual(
      new AskAiError('failed'),
    );
  });

  it('a network error is a failure', async () => {
    const client = new HttpAskAi('https://p', '', async () => {
      throw new TypeError('Network request failed');
    });
    await expect(client.ask(request, () => undefined, new AbortController().signal)).rejects.toBeInstanceOf(AskAiError);
  });
});
