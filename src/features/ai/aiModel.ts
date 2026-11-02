import {
  askUsage,
  deepEqual,
  resolveBirth,
  type AskUsage,
  type AskUsageRepository,
  type ObservableRepository,
  type RewardedAds,
} from '@/core/data';
import { DEFAULT_ASK_LIMITS, type AskLimits, type BirthProfile } from '@/core/model';
import { Readings, readingCharts, type TopicReading } from '@/core/reading';

import { aiQuota, canAsk, canWatchAd, rewarded, spend, type AiQuota } from './aiQuota';
import { answerMessage, isWriting, isWritingMessage, type AnswerMessage, type ChatMessage } from './chatMessage';
import { isCrisis } from './crisisDetector';
import { isInvestmentQuestion } from './investmentDetector';
import { topicOf } from './topicDetector';

/** Pause before the first part of an answer appears, then between parts. */
export const THINKING_MS = 900;
export const PART_MS = 700;

export type AiReady = {
  readonly kind: 'ready';
  readonly ownerName: string;
  readonly readings: readonly TopicReading[];
  readonly messages: readonly ChatMessage[];
  readonly quota: AiQuota;
  readonly outOfQuestions: boolean;
  readonly watchingAd: boolean;
  readonly showSupport: boolean;
  readonly isAnswering: boolean;
};

/** Unavailable: the profile could not be turned into charts (a date outside the supported range). */
export type AiUiState = { readonly kind: 'loading' } | { readonly kind: 'noProfile' } | { readonly kind: 'unavailable' } | AiReady;

/**
 * What the conversation holds apart from the profile; lives as long as the screen's model. The
 * quota is read back from the usage store first ([quotaLoaded]) and saved after every change.
 */
type ChatSession = {
  readonly messages: readonly ChatMessage[];
  readonly quota: AiQuota;
  readonly quotaDay: number | null;
  readonly quotaLoaded: boolean;
  readonly outOfQuestions: boolean;
  readonly watchingAd: boolean;
  readonly showSupport: boolean;
};

const NEW_SESSION: ChatSession = {
  messages: [],
  quota: aiQuota(),
  quotaDay: null,
  quotaLoaded: false,
  outOfQuestions: false,
  watchingAd: false,
  showSupport: false,
};

type Owner = { readonly name: string; readonly readings: readonly TopicReading[] } | 'failed' | null;

export type AiModelDeps = {
  readonly profiles: ObservableRepository<BirthProfile | null>;
  readonly rewardedAds: RewardedAds;
  readonly usage: AskUsageRepository;
  /** Today's local date as an epoch day. */
  readonly today: () => number;
};

const toQuota = (saved: AskUsage): AiQuota =>
  aiQuota({ freeUsed: saved.freeUsed, adsWatched: saved.adsWatched, adCredits: saved.adCredits });

function ownerOf(profile: BirthProfile): Owner {
  try {
    return { name: profile.name, readings: Readings.all(readingCharts(resolveBirth(profile))) };
  } catch {
    return 'failed';
  }
}

/**
 * Offline "Ask AI": answers come from the owner's own topic readings, picked by what the question
 * is about, and are written out part by part like a chat reply. Plain TypeScript: the screen reads
 * it through `useAiModel`, tests drive it directly.
 */
export class AiModel {
  private session: ChatSession = NEW_SESSION;
  private profile: BirthProfile | null | undefined = undefined;
  private owner: Owner | undefined = undefined;
  private premium = false;
  private limits: AskLimits = DEFAULT_ASK_LIMITS;
  private nextId = 0;
  private answerTimer: ReturnType<typeof setTimeout> | null = null;
  private snapshot: AiUiState = { kind: 'loading' };
  private readonly listeners = new Set<() => void>();
  private unsubscribeProfile: (() => void) | null = null;

  constructor(private readonly deps: AiModelDeps) {}

  /** Starts listening to the profile and reads today's usage; returns the matching stop. */
  start(): () => void {
    const { profiles, usage } = this.deps;
    this.unsubscribeProfile = profiles.subscribe((p) => this.setProfile(p));
    const current = profiles.current();
    if (current !== undefined) this.setProfile(current);
    // A store that cannot be read leaves the screen loading rather than guessing "no profile".
    profiles.load().then((p) => this.setProfile(p), () => undefined);
    usage.load().then(
      (saved) => this.quotaLoaded(saved),
      // Unreadable counts: a fresh allowance, never a lost question.
      () => this.quotaLoaded(null),
    );
    const writing = this.session.messages.find(isWritingMessage);
    if (writing && this.answerTimer === null) this.scheduleReveal(writing.id, PART_MS);
    return () => this.stop();
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getState = (): AiUiState => this.snapshot;

  /** Premium and the remote limits apply as soon as they arrive. */
  setAllowance(premium: boolean, limits: AskLimits): void {
    if (premium === this.premium && deepEqual(limits, this.limits)) return;
    this.premium = premium;
    this.limits = limits;
    this.emit();
  }

  /**
   * Sends [text]. Returns true when the question was taken (the field can be cleared); false
   * while an answer is still being written, before the readings are ready, or when today's
   * questions are used up (the out-of-questions sheet opens instead).
   */
  onAsk(text: string): boolean {
    const question = text.trim();
    const ready = this.snapshot;
    if (question === '' || ready.kind !== 'ready' || ready.isAnswering) return false;
    if (isCrisis(question)) {
      // Not stored and not counted: the owner is offered people to talk to, not a reading.
      this.update((s) => ({ ...s, showSupport: true }));
      return true;
    }
    if (isInvestmentQuestion(question)) {
      // No investment advice (spec §12): a short refusal, and today's allowance is untouched.
      const questionId = this.nextId++;
      const replyId = this.nextId++;
      this.update((s) => ({
        ...s,
        messages: [...s.messages, { kind: 'question', id: questionId, text: question }, { kind: 'investmentDeclined', id: replyId }],
      }));
      return true;
    }
    this.rollQuotaDay();
    if (!canAsk(this.session.quota)) {
      this.update((s) => ({ ...s, outOfQuestions: true }));
      return false;
    }
    const topic = topicOf(question);
    const reading = ready.readings.find((it) => it.topic === topic);
    if (!reading) return false;
    const questionId = this.nextId++;
    const answerId = this.nextId++;
    this.update((s) => ({
      ...s,
      messages: [...s.messages, { kind: 'question', id: questionId, text: question }, answerMessage(answerId, reading)],
      quota: spend(s.quota),
    }));
    this.saveQuota();
    this.scheduleReveal(answerId, THINKING_MS);
    return true;
  }

  /** Stops the answer being written; what is already shown stays. */
  onStop(): void {
    this.cancelAnswer();
    this.updateWriting((a) => ({ ...a, stopped: true }));
  }

  /** Plays a rewarded ad; watching it to the end adds one question for today. */
  onWatchAd(): void {
    this.rollQuotaDay();
    const chat = this.session;
    if (chat.watchingAd || !canWatchAd(chat.quota)) return;
    this.update((s) => ({ ...s, watchingAd: true }));
    void this.showAd();
  }

  onDismissOutOfQuestions(): void {
    this.update((s) => ({ ...s, outOfQuestions: false }));
  }

  onDismissSupport(): void {
    this.update((s) => ({ ...s, showSupport: false }));
  }

  /** Clears the conversation; today's allowance is kept. */
  onNewChat(): void {
    this.cancelAnswer();
    this.update((s) => ({ ...s, messages: [] }));
  }

  private stop(): void {
    this.cancelAnswer();
    this.unsubscribeProfile?.();
    this.unsubscribeProfile = null;
  }

  private async showAd(): Promise<void> {
    let isRewarded: boolean;
    try {
      isRewarded = await this.deps.rewardedAds.show();
    } catch {
      // A failed ad earns nothing, like a skipped one.
      isRewarded = false;
    }
    this.update((s) => ({
      ...s,
      watchingAd: false,
      quota: isRewarded ? rewarded(s.quota) : s.quota,
      outOfQuestions: s.outOfQuestions && !isRewarded,
    }));
    if (isRewarded) this.saveQuota();
  }

  private setProfile(profile: BirthProfile | null): void {
    if (this.profile !== undefined && deepEqual(profile, this.profile)) return;
    this.profile = profile;
    this.owner = profile ? ownerOf(profile) : null;
    this.emit();
  }

  private quotaLoaded(saved: AskUsage | null): void {
    if (this.session.quotaLoaded) return;
    this.update((s) => ({
      ...s,
      quota: saved ? toQuota(saved) : aiQuota(),
      quotaDay: saved?.epochDay ?? null,
      quotaLoaded: true,
    }));
  }

  private scheduleReveal(id: number, wait: number): void {
    this.answerTimer = setTimeout(() => this.revealNext(id), wait);
  }

  private revealNext(id: number): void {
    this.answerTimer = null;
    this.updateWriting((a) => (a.id === id ? { ...a, revealed: a.revealed + 1 } : a));
    const answer = this.session.messages.find((it) => it.id === id);
    if (answer?.kind !== 'answer' || !isWriting(answer)) return;
    this.scheduleReveal(id, PART_MS);
  }

  private cancelAnswer(): void {
    if (this.answerTimer !== null) clearTimeout(this.answerTimer);
    this.answerTimer = null;
  }

  private updateWriting(transform: (a: AnswerMessage) => AnswerMessage): void {
    this.update((s) => ({
      ...s,
      messages: s.messages.map((it) => (it.kind === 'answer' && isWriting(it) ? transform(it) : it)),
    }));
  }

  /**
   * Free questions and ad rewards start over each local day; Premium and new limits apply as
   * soon as they arrive.
   */
  private rollQuotaDay(): void {
    const day = this.deps.today();
    this.update((s) => {
      const quota = s.quotaDay === day ? s.quota : aiQuota();
      return { ...s, quota: { ...quota, premium: this.premium, limits: this.limits }, quotaDay: day };
    });
  }

  /**
   * Writes today's counts. If the store cannot be written they still hold for this screen; the
   * worst case after a restart is a refilled allowance, never a lost question.
   */
  private saveQuota(): void {
    const { quota, quotaDay } = this.session;
    if (quotaDay === null) return;
    this.deps.usage
      .save(askUsage(quotaDay, quota.freeUsed, quota.adsWatched, quota.adCredits))
      .catch(() => undefined);
  }

  private update(transform: (s: ChatSession) => ChatSession): void {
    this.session = transform(this.session);
    this.emit();
  }

  private emit(): void {
    this.snapshot = this.derive();
    this.listeners.forEach((listener) => listener());
  }

  private derive(): AiUiState {
    const { owner, session: chat } = this;
    if (owner === undefined) return { kind: 'loading' };
    if (owner === null) return { kind: 'noProfile' };
    if (owner === 'failed') return { kind: 'unavailable' };
    if (!chat.quotaLoaded) return { kind: 'loading' };
    // A count from an earlier day shows as a fresh allowance until the next question rolls it over.
    const base = chat.quotaDay === this.deps.today() ? chat.quota : aiQuota();
    return {
      kind: 'ready',
      ownerName: owner.name,
      readings: owner.readings,
      messages: chat.messages,
      quota: { ...base, premium: this.premium, limits: this.limits },
      outOfQuestions: chat.outOfQuestions,
      watchingAd: chat.watchingAd,
      showSupport: chat.showSupport,
      isAnswering: chat.messages.some(isWritingMessage),
    };
  }
}
