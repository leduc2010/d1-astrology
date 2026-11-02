import { StyleSheet, View } from 'react-native';

import { basedOn, detailLabel, factLabel, systemSource, topicName } from '@/core/reading';
import { usePremiumOffered } from '@/core/ui';
import {
  ButtonStyle,
  OrtusBottomSheet,
  OrtusCard,
  OrtusColors as c,
  OrtusIcons,
  OrtusListRow,
  OrtusSpacing,
  OrtusText,
  OrtusWideButton,
  PremiumTag,
  SourceChip,
} from '@/designsystem';
import { useT } from '@/i18n';

import { adsLeft, canWatchAd, dailyAllowance, offersAds, type AiQuota } from './aiQuota';
import { answerDetails, type AnswerMessage } from './chatMessage';

/** What an answer was drawn from: each system's signal, then the details it read in full. */
export function SourcesSheet({ answer, onDismiss }: { answer: AnswerMessage; onDismiss: () => void }) {
  const t = useT();
  const { reading } = answer;
  return (
    <OrtusBottomSheet onDismiss={onDismiss} title={t.tf('ai_sources_title')} subtitle={t.tf('ai_sources_subtitle')}>
      <OrtusText variant="title" color={c.textPrimary}>
        {topicName(t, reading.topic)}
      </OrtusText>
      {reading.facts.map((fact) => (
        <View key={`fact-${fact.system}`} style={styles.source}>
          <SourceChip text={basedOn(t, fact.system)} source={systemSource(fact.system)} />
          <OrtusText variant="callout" color={c.textSecondary}>
            {factLabel(t, fact)}
          </OrtusText>
        </View>
      ))}
      {answerDetails(answer).map((detail, i) => (
        <View key={`detail-${i}`} style={styles.source}>
          <SourceChip text={basedOn(t, detail.system)} source={systemSource(detail.system)} />
          <OrtusText variant="callout" color={c.textSecondary}>
            {detailLabel(t, detail)}
          </OrtusText>
        </View>
      ))}
    </OrtusBottomSheet>
  );
}

export type OutOfQuestionsSheetProps = {
  quota: AiQuota;
  watchingAd: boolean;
  onWatchAd: () => void;
  onOpenPaywall: () => void;
  onDismiss: () => void;
};

/**
 * S06-05: today's questions are used up. Watching an ad earns one more (up to the daily cap), or
 * Premium raises the allowance; otherwise come back tomorrow. Premium members only see the last.
 */
export function OutOfQuestionsSheet({ quota, watchingAd, onWatchAd, onOpenPaywall, onDismiss }: OutOfQuestionsSheetProps) {
  const { tf } = useT();
  const allowance = dailyAllowance(quota);
  return (
    <OrtusBottomSheet
      onDismiss={onDismiss}
      title={quota.premium ? tf('ai_out_title_premium', allowance) : tf('ai_out_title', allowance)}
      subtitle={tf('ai_out_body')}
    >
      {(close) => (
        <>
          {quota.premium ? null : (
            <MoreQuestions quota={quota} watchingAd={watchingAd} onWatchAd={onWatchAd} onOpenPaywall={onOpenPaywall} />
          )}
          <OrtusWideButton text={tf('ai_out_tomorrow')} onPress={close} variant={ButtonStyle.Outline} />
        </>
      )}
    </OrtusBottomSheet>
  );
}

type MoreQuestionsProps = Omit<OutOfQuestionsSheetProps, 'onDismiss'>;

/**
 * The ways to keep asking today: one more question per ad while ads are on, or Premium where this
 * build sells it.
 */
function MoreQuestions({ quota, watchingAd, onWatchAd, onOpenPaywall }: MoreQuestionsProps) {
  const { tf } = useT();
  const premiumOffered = usePremiumOffered();
  const ads = offersAds(quota);
  return (
    <View style={styles.more}>
      {ads ? <WatchAd quota={quota} watchingAd={watchingAd} onWatchAd={onWatchAd} /> : null}
      {premiumOffered ? (
        <OrtusCard contentPadding={OrtusSpacing.none}>
          <OrtusListRow
            title={tf('ai_out_premium')}
            subtitle={tf('ai_out_premium_more')}
            leading={<PremiumTag text={tf('ai_out_premium_tag')} />}
            onPress={onOpenPaywall}
          />
        </OrtusCard>
      ) : null}
      {ads ? (
        <OrtusText variant="footnote" color={c.textMuted} style={styles.centred}>
          {tf('ai_out_order')}
        </OrtusText>
      ) : null}
    </View>
  );
}

function WatchAd({ quota, watchingAd, onWatchAd }: Pick<MoreQuestionsProps, 'quota' | 'watchingAd' | 'onWatchAd'>) {
  const { tf } = useT();
  const available = canWatchAd(quota);
  const label = watchingAd ? 'ai_out_watching' : available ? 'ai_out_watch' : 'ai_out_watch_none';
  return (
    <View style={styles.watch}>
      <OrtusWideButton
        text={tf(label)}
        onPress={onWatchAd}
        enabled={available && !watchingAd}
        leadingIcon={OrtusIcons.Sparkle}
      />
      <OrtusText variant="captionSmall" color={c.textMuted}>
        {tf('ai_out_watch_left', adsLeft(quota), quota.limits.adsPerDay)}
      </OrtusText>
    </View>
  );
}

const styles = StyleSheet.create({
  source: { gap: OrtusSpacing.xxs, alignItems: 'flex-start' },
  more: { gap: OrtusSpacing.md },
  watch: { gap: OrtusSpacing.xxs, alignItems: 'center', alignSelf: 'stretch' },
  centred: { textAlign: 'center' },
});
