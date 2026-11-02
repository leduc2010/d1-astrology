import { askUsage, epochDayOf } from '@/core/data';
import { ASK_DEFAULT_FREE, ASK_DEFAULT_PREMIUM, DEFAULT_ASK_LIMITS, type AskLimits } from '@/core/model';
import { Topic } from '@/core/reading';
import { FakeAskUsageRepository, FakeProfileRepository, TestProfiles } from '@/core/testing';

import { AiModel, PART_MS, THINKING_MS, type AiReady } from '../aiModel';
import { canAsk, canWatchAd, offersAds, questionsLeft } from '../aiQuota';
import { isComplete, type AnswerMessage } from '../chatMessage';

// Port of AiViewModelTest.

const START_DAY = epochDayOf({ year: 2026, month: 11, day: 1 });

let profiles: FakeProfileRepository;
let usage: FakeAskUsageRepository;
let day: number;
let adResult: () => Promise<boolean>;
let premium: boolean;
let limits: AskLimits;
let stops: (() => void)[];

beforeEach(() => {
  jest.useFakeTimers();
  profiles = new FakeProfileRepository();
  usage = new FakeAskUsageRepository();
  day = START_DAY;
  adResult = () => Promise.resolve(true);
  premium = false;
  limits = DEFAULT_ASK_LIMITS;
  stops = [];
});

afterEach(() => {
  stops.forEach((stop) => stop());
  jest.useRealTimers();
});

/** Lets the store reads and the ad promise settle without moving the clock. */
const settle = () => jest.advanceTimersByTimeAsync(0);
const advanceUntilIdle = () => jest.runAllTimersAsync();

async function startModel(): Promise<AiModel> {
  const model = new AiModel({ profiles, rewardedAds: { show: () => adResult() }, usage, today: () => day });
  model.setAllowance(premium, limits);
  stops.push(model.start());
  await settle();
  return model;
}

async function readyModel(): Promise<AiModel> {
  profiles.state.set(TestProfiles.owner);
  return startModel();
}

function ready(model: AiModel): AiReady {
  const state = model.getState();
  if (state.kind !== 'ready') throw new Error(`expected ready, was ${state.kind}`);
  return state;
}

function lastAnswer(model: AiModel): AnswerMessage {
  const last = ready(model).messages.at(-1);
  if (last?.kind !== 'answer') throw new Error('expected an answer last');
  return last;
}

async function askAndFinish(model: AiModel, times: number): Promise<void> {
  for (let i = 0; i < times; i++) {
    expect(model.onAsk(`question ${i}`)).toBe(true);
    await advanceUntilIdle();
  }
}

test('no profile asks for birth details', async () => {
  const model = await startModel();

  expect(model.getState()).toEqual({ kind: 'noProfile' });
});

test('a date outside the supported range is unavailable', async () => {
  profiles.state.set({ ...TestProfiles.owner, date: TestProfiles.outOfRange });
  const model = await startModel();

  expect(model.getState()).toEqual({ kind: 'unavailable' });
});

test('a question is answered from the matching reading, part by part', async () => {
  const model = await readyModel();

  expect(model.onAsk('  Should I change jobs?  ')).toBe(true);

  expect(ready(model).messages[0]).toEqual({ kind: 'question', id: 0, text: 'Should I change jobs?' });
  expect(lastAnswer(model).reading.topic).toBe(Topic.CAREER);
  expect(lastAnswer(model).revealed).toBe(0);
  expect(ready(model).isAnswering).toBe(true);

  await jest.advanceTimersByTimeAsync(THINKING_MS + 1);
  expect(lastAnswer(model).revealed).toBe(1);

  await advanceUntilIdle();
  expect(isComplete(lastAnswer(model))).toBe(true);
  expect(ready(model).isAnswering).toBe(false);
  expect(questionsLeft(ready(model).quota)).toBe(ASK_DEFAULT_FREE - 1);
});

test('a second question waits for the answer in progress', async () => {
  const model = await readyModel();
  model.onAsk('career?');

  expect(model.onAsk('love?')).toBe(false);
  expect(ready(model).messages).toHaveLength(2);
});

test('stop keeps what was shown and frees the composer', async () => {
  const model = await readyModel();
  model.onAsk('career?');
  await jest.advanceTimersByTimeAsync(THINKING_MS + PART_MS + 1);

  model.onStop();
  await advanceUntilIdle();

  expect(lastAnswer(model).stopped).toBe(true);
  expect(lastAnswer(model).revealed).toBe(2);
  expect(ready(model).isAnswering).toBe(false);
  expect(model.onAsk('love?')).toBe(true);
});

test('a crisis message opens support without storing it or using a question', async () => {
  const model = await readyModel();

  expect(model.onAsk('Tôi muốn chết')).toBe(true);

  expect(ready(model).showSupport).toBe(true);
  expect(ready(model).messages).toHaveLength(0);
  expect(questionsLeft(ready(model).quota)).toBe(ASK_DEFAULT_FREE);

  model.onDismissSupport();
  expect(ready(model).showSupport).toBe(false);
});

test('an investment question is declined without using a question', async () => {
  const model = await readyModel();

  expect(model.onAsk('Có nên đầu tư chứng khoán năm nay?')).toBe(true);

  const messages = ready(model).messages;
  expect(messages).toHaveLength(2);
  expect(messages.at(-1)?.kind).toBe('investmentDeclined');
  expect(ready(model).isAnswering).toBe(false);
  expect(questionsLeft(ready(model).quota)).toBe(ASK_DEFAULT_FREE);
});

test('after the free questions the out-of-questions sheet opens', async () => {
  const model = await readyModel();
  await askAndFinish(model, ASK_DEFAULT_FREE);

  expect(model.onAsk('one more?')).toBe(false);

  expect(ready(model).outOfQuestions).toBe(true);
  expect(ready(model).messages).toHaveLength(ASK_DEFAULT_FREE * 2);
});

test('a finished ad earns a question and closes the sheet', async () => {
  const model = await readyModel();
  await askAndFinish(model, ASK_DEFAULT_FREE);
  model.onAsk('one more?');
  let finishAd: (watched: boolean) => void = () => undefined;
  adResult = () => new Promise((resolve) => (finishAd = resolve));

  model.onWatchAd();
  expect(ready(model).watchingAd).toBe(true);
  model.onWatchAd(); // ignored while one is playing
  finishAd(true);
  await advanceUntilIdle();

  expect(ready(model).watchingAd).toBe(false);
  expect(ready(model).outOfQuestions).toBe(false);
  expect(questionsLeft(ready(model).quota)).toBe(1);
  expect(ready(model).quota.adsWatched).toBe(1);
  expect(model.onAsk('one more?')).toBe(true);
});

test('a skipped or failed ad earns nothing', async () => {
  const model = await readyModel();
  await askAndFinish(model, ASK_DEFAULT_FREE);
  model.onAsk('one more?');

  adResult = () => Promise.resolve(false);
  model.onWatchAd();
  await settle();
  adResult = () => Promise.reject(new Error('no fill'));
  model.onWatchAd();
  await settle();

  expect(ready(model).outOfQuestions).toBe(true);
  expect(questionsLeft(ready(model).quota)).toBe(0);
  expect(ready(model).watchingAd).toBe(false);
});

test('the allowance starts over on a new day', async () => {
  const model = await readyModel();
  await askAndFinish(model, ASK_DEFAULT_FREE);

  day += 1;

  expect(model.onAsk('career?')).toBe(true);
  expect(questionsLeft(ready(model).quota)).toBe(ASK_DEFAULT_FREE - 1);
});

test('questions and ads used today are saved', async () => {
  const model = await readyModel();
  await askAndFinish(model, ASK_DEFAULT_FREE);
  model.onWatchAd();
  await advanceUntilIdle();

  expect(usage.current()).toEqual(askUsage(day, ASK_DEFAULT_FREE, 1, 1));
});

test('a restart keeps what was used today', async () => {
  usage.state.set(askUsage(day, ASK_DEFAULT_FREE, 2, 0));

  const model = await readyModel();

  expect(canAsk(ready(model).quota)).toBe(false);
  expect(ready(model).quota.adsWatched).toBe(2);
  expect(model.onAsk('career?')).toBe(false);
  expect(ready(model).outOfQuestions).toBe(true);
});

test('counts saved on an earlier day show a fresh allowance', async () => {
  usage.state.set(askUsage(day - 1, ASK_DEFAULT_FREE, 5));

  const model = await readyModel();

  expect(questionsLeft(ready(model).quota)).toBe(ASK_DEFAULT_FREE);
  expect(model.onAsk('career?')).toBe(true);
  await settle();
  expect(usage.current()).toEqual(askUsage(day, 1));
});

test('a failed save keeps the count for this session', async () => {
  usage.writeFailure = new Error('disk full');
  const model = await readyModel();

  expect(model.onAsk('career?')).toBe(true);
  await advanceUntilIdle();

  expect(questionsLeft(ready(model).quota)).toBe(ASK_DEFAULT_FREE - 1);
});

test('new chat clears messages but keeps the allowance', async () => {
  const model = await readyModel();
  model.onAsk('career?');

  model.onNewChat();
  await advanceUntilIdle();

  expect(ready(model).messages).toHaveLength(0);
  expect(questionsLeft(ready(model).quota)).toBe(ASK_DEFAULT_FREE - 1);
});

test('premium members keep asking past the free allowance', async () => {
  premium = true;
  const model = await readyModel();
  await askAndFinish(model, ASK_DEFAULT_FREE + 1);

  expect(ready(model).quota.premium).toBe(true);
  expect(questionsLeft(ready(model).quota)).toBe(ASK_DEFAULT_PREMIUM - ASK_DEFAULT_FREE - 1);
  expect(canWatchAd(ready(model).quota)).toBe(false);
});

test('subscribing mid-day lifts the limit for the next question', async () => {
  const model = await readyModel();
  await askAndFinish(model, ASK_DEFAULT_FREE);
  expect(canAsk(ready(model).quota)).toBe(false);

  model.setAllowance(true, limits);

  expect(canAsk(ready(model).quota)).toBe(true);
  expect(model.onAsk('one more?')).toBe(true);
});

test('remote limits set the allowance and switching ads off removes the ad offer', async () => {
  limits = { ...DEFAULT_ASK_LIMITS, freePerDay: 1, adsPerDay: 0 };
  const model = await readyModel();
  await askAndFinish(model, 1);

  expect(model.onAsk('another?')).toBe(false);
  expect(ready(model).outOfQuestions).toBe(true);
  expect(offersAds(ready(model).quota)).toBe(false);
  model.onWatchAd();
  await advanceUntilIdle();
  expect(canAsk(ready(model).quota)).toBe(false);
});

test('blank text is ignored', async () => {
  const model = await readyModel();

  expect(model.onAsk('   ')).toBe(false);
  expect(ready(model).messages).toHaveLength(0);
});

// RN only: React may stop and start the model again (strict mode, remount) mid-answer.
test('a restart mid-answer carries on writing it', async () => {
  const model = await readyModel();
  model.onAsk('career?');
  stops.pop()?.();

  stops.push(model.start());
  await advanceUntilIdle();

  expect(isComplete(lastAnswer(model))).toBe(true);
});
