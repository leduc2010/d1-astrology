import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Reveal } from '@/core/ui';
import {
  detailBody,
  detailLabel,
  factLine,
  systemName,
  systemSource,
  topicBody,
  topicHeadline,
  type ReadingDetail,
  type ReadingFact,
} from '@/core/reading';
import {
  AnswerBubble,
  OrtusColors as c,
  OrtusLinkButton,
  OrtusRadii,
  OrtusSizes,
  OrtusSpacing,
  OrtusText,
  PromptCard,
  QuestionBubble,
  QuotaPill,
  SectionLabel,
  SourceChip,
  TypingDots,
} from '@/designsystem';
import { useT } from '@/i18n';

import { dailyAllowance, freeLeft, offersAds, type AiQuota } from './aiQuota';
import { answerDetails, isComplete, isWriting, type AnswerMessage, type ChatMessage } from './chatMessage';

/** S06-01 empty chat: today's allowance, a short welcome and a few questions to start with. */
export function AiIntro({ quota, onAsk }: { quota: AiQuota; onAsk: (question: string) => void }) {
  const { tf, ta } = useT();
  return (
    <View style={styles.intro}>
      <Reveal index={0}>
        <QuotaRow quota={quota} />
      </Reveal>
      <Reveal index={1} style={styles.introText}>
        <OrtusText variant="subtitle" color={c.textPrimary}>
          {tf('ai_intro_title')}
        </OrtusText>
        <OrtusText variant="callout" color={c.textSecondary}>
          {tf('ai_intro_body')}
        </OrtusText>
      </Reveal>
      <Reveal index={2}>
        <SectionLabel text={tf('ai_suggestions_label')} color={c.mysticLight} />
      </Reveal>
      {ta('ai_suggestions').map((question, i) => (
        <Reveal key={question} index={i + 3}>
          <PromptCard text={question} onPress={() => onAsk(question)} />
        </Reveal>
      ))}
    </View>
  );
}

/**
 * "Free 2/3" and "From ads 0/5"; the allowance that the next question will use is lit. Premium
 * shows its one allowance, and the ads pill goes when ads are switched off.
 */
function QuotaRow({ quota }: { quota: AiQuota }) {
  const { tf } = useT();
  const left = freeLeft(quota);
  const allowance = dailyAllowance(quota);
  if (quota.premium) {
    return (
      <View style={styles.row}>
        <QuotaPill text={tf('ai_quota_premium', left, allowance)} highlighted={left > 0} />
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <QuotaPill text={tf('ai_quota_free', left, allowance)} highlighted={left > 0} />
      {offersAds(quota) ? (
        <QuotaPill
          text={tf('ai_quota_ads', quota.adsWatched, quota.limits.adsPerDay)}
          highlighted={left === 0 && quota.adCredits > 0}
        />
      ) : null}
    </View>
  );
}

export function ChatLine({ message, onViewSources }: { message: ChatMessage; onViewSources: () => void }) {
  const { tf } = useT();
  return (
    <Reveal index={0}>
      {message.kind === 'question' ? <QuestionBubble text={message.text} /> : null}
      {message.kind === 'answer' ? <AnswerView answer={message} onViewSources={onViewSources} /> : null}
      {message.kind === 'investmentDeclined' ? (
        <AnswerBubble>
          <OrtusText variant="body" color={c.textPrimary}>
            {tf('ai_declined_investment')}
          </OrtusText>
        </AnswerBubble>
      ) : null}
    </Reveal>
  );
}

const clamp = (value: number, max: number): number => Math.min(Math.max(value, 0), max);

/**
 * S06-03 answer, written out part by part: headline, one bullet per system, a couple of details
 * read in full, then the suggestion.
 * Once it is finished (or stopped) the systems it drew on are listed with a way to see the details.
 */
function AnswerView({ answer, onViewSources }: { answer: AnswerMessage; onViewSources: () => void }) {
  const t = useT();
  const { reading } = answer;
  const details = answerDetails(answer);
  const shownFacts = reading.facts.slice(0, clamp(answer.revealed - 1, reading.facts.length));
  const shownDetails = details.slice(0, clamp(answer.revealed - 1 - reading.facts.length, details.length));
  const writing = isWriting(answer);
  return (
    <AnswerBubble>
      {answer.revealed >= 1 ? (
        <Reveal index={0}>
          <OrtusText variant="bodyMedium" color={c.textPrimary}>
            {topicHeadline(t, reading.topic, reading.tone)}
          </OrtusText>
        </Reveal>
      ) : null}
      {shownFacts.map((fact) => (
        <FactBullet key={`fact-${fact.system}`} fact={fact} />
      ))}
      {shownDetails.map((detail, i) => (
        <DetailBullet key={`detail-${i}`} detail={detail} />
      ))}
      {isComplete(answer) ? (
        <Reveal index={0} style={styles.suggestion}>
          <OrtusText variant="callout" color={c.textSecondary}>
            {t.tf('ai_suggestion', topicBody(t, reading.topic, reading.tone))}
          </OrtusText>
        </Reveal>
      ) : null}
      {writing ? <TypingDots style={styles.dots} /> : null}
      {answer.stopped ? (
        <OrtusText variant="footnote" color={c.textMuted}>
          {t.tf('ai_stopped')}
        </OrtusText>
      ) : null}
      {!writing && shownFacts.length > 0 ? <AnswerSources facts={shownFacts} onViewSources={onViewSources} /> : null}
    </AnswerBubble>
  );
}

function FactBullet({ fact }: { fact: ReadingFact }) {
  const t = useT();
  return (
    <Bullet>
      <OrtusText variant="callout" color={c.textPrimary}>
        {factLine(t, fact)}
      </OrtusText>
    </Bullet>
  );
}

/** A detail's chart label over its reading. */
function DetailBullet({ detail }: { detail: ReadingDetail }) {
  const t = useT();
  return (
    <Bullet>
      <View style={styles.detail}>
        <OrtusText variant="captionStrong" color={c.textSecondary}>
          {detailLabel(t, detail)}
        </OrtusText>
        <OrtusText variant="callout" color={c.textPrimary}>
          {detailBody(t, detail)}
        </OrtusText>
      </View>
    </Bullet>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <Reveal index={0} style={styles.bullet}>
      {/* Centres the dot on the first line of text. */}
      <View style={styles.dotBox}>
        <View style={styles.dot} />
      </View>
      <View style={styles.flex}>{children}</View>
    </Reveal>
  );
}

function AnswerSources({ facts, onViewSources }: { facts: readonly ReadingFact[]; onViewSources: () => void }) {
  const t = useT();
  return (
    <Reveal index={0} style={styles.sources}>
      <View style={styles.chips}>
        {facts.map((fact) => (
          <SourceChip key={fact.system} text={systemName(t, fact.system)} source={systemSource(fact.system)} />
        ))}
      </View>
      <OrtusLinkButton text={t.tf('ai_view_sources')} onPress={onViewSources} color={c.mysticLight} />
    </Reveal>
  );
}

const styles = StyleSheet.create({
  intro: { gap: OrtusSpacing.md },
  introText: { gap: OrtusSpacing.xs },
  row: { flexDirection: 'row', gap: OrtusSpacing.xs },
  suggestion: { paddingTop: OrtusSpacing.xxs },
  dots: { paddingVertical: OrtusSpacing.xs },
  detail: { gap: OrtusSpacing.hair },
  bullet: { flexDirection: 'row', gap: OrtusSpacing.xs },
  dotBox: { paddingTop: OrtusSpacing.xs, alignItems: 'center' },
  dot: { width: OrtusSizes.dot, height: OrtusSizes.dot, borderRadius: OrtusRadii.pill, backgroundColor: c.mysticLight },
  flex: { flex: 1 },
  sources: { paddingTop: OrtusSpacing.xxs, gap: OrtusSpacing.xxs, alignItems: 'flex-start' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: OrtusSpacing.xxs },
});
