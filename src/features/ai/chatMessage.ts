import type { AskAiFailure } from '@/core/data';
import type { ReadingDetail, TopicReading } from '@/core/reading';

/** Headline and suggestion, around the per-system bullets. */
const EXTRA_PARTS = 2;

/** Kept short for a chat bubble; the reading article shows them all. */
const MAX_DETAILS = 2;

export type QuestionMessage = { readonly kind: 'question'; readonly id: number; readonly text: string };

/** The guide's short "no investment advice" reply: no reading, no question spent. */
export type InvestmentDeclinedMessage = { readonly kind: 'investmentDeclined'; readonly id: number };

/**
 * An answer drawn from the owner's [reading]. It is written out part by part: the headline,
 * one bullet per system, a few details read in full, then a suggestion. [revealed] counts
 * the parts shown so far.
 */
export type AnswerMessage = {
  readonly kind: 'answer';
  readonly id: number;
  readonly reading: TopicReading;
  readonly revealed: number;
  readonly stopped: boolean;
};

/**
 * An answer written by the online model (RN-only), streamed in as [text]. waiting: sent, nothing
 * back yet; streaming: text arriving; done; stopped by the owner; failed with nothing usable.
 */
export type ReplyMessage = {
  readonly kind: 'reply';
  readonly id: number;
  readonly text: string;
  readonly status: 'waiting' | 'streaming' | 'done' | 'stopped' | 'failed';
  readonly failure: AskAiFailure | null;
  /** The question was given back because nothing usable came (failed or stopped before any text). */
  readonly refunded: boolean;
};

/** One line of the conversation. */
export type ChatMessage = QuestionMessage | InvestmentDeclinedMessage | AnswerMessage | ReplyMessage;

export function replyMessage(id: number): ReplyMessage {
  return { kind: 'reply', id, text: '', status: 'waiting', failure: null, refunded: false };
}

export const isReplyWriting = (r: ReplyMessage): boolean => r.status === 'waiting' || r.status === 'streaming';

export function answerMessage(id: number, reading: TopicReading): AnswerMessage {
  return { kind: 'answer', id, reading, revealed: 0, stopped: false };
}

export const answerDetails = (a: AnswerMessage): readonly ReadingDetail[] => a.reading.details.slice(0, MAX_DETAILS);
export const answerParts = (a: AnswerMessage): number =>
  a.reading.facts.length + answerDetails(a).length + EXTRA_PARTS;
export const isComplete = (a: AnswerMessage): boolean => a.revealed >= answerParts(a);
export const isWriting = (a: AnswerMessage): boolean => !a.stopped && !isComplete(a);

/** True for an answer still being written out. */
export const isWritingMessage = (m: ChatMessage): boolean =>
  (m.kind === 'answer' && isWriting(m)) || (m.kind === 'reply' && isReplyWriting(m));
