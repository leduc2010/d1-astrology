import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  OrtusBottomSheet,
  OrtusChip,
  OrtusColors,
  OrtusSpacing,
  OrtusText,
  OrtusWideButton,
  SectionLabel,
} from '@/designsystem';
import { useT } from '@/i18n';

export type ReadingFeedbackSheetProps = {
  onSend: () => void;
  onDismiss: () => void;
};

/** [reasons] with [index] toggled in or out. */
const toggled = (reasons: readonly number[], index: number): readonly number[] =>
  reasons.includes(index) ? reasons.filter((it) => it !== index) : [...reasons, index];

/**
 * S05-07: "does this ring true?". The answer and reasons stay on the device in this version, so
 * only [onSend] is reported; the choices themselves live in sheet state.
 */
export function ReadingFeedbackSheet({ onSend, onDismiss }: ReadingFeedbackSheetProps) {
  const { tf, ta } = useT();
  // null until answered; true = "that's me", false = "not quite".
  const [ringsTrue, setRingsTrue] = useState<boolean | null>(null);
  const [reasons, setReasons] = useState<readonly number[]>([]);
  return (
    <OrtusBottomSheet onDismiss={onDismiss} title={tf('reading_feedback_link')}>
      {(close) => (
        <>
          <View style={styles.row}>
            <OrtusChip text={tf('reading_feedback_yes')} selected={ringsTrue === true} onPress={() => setRingsTrue(true)} />
            <OrtusChip text={tf('reading_feedback_no')} selected={ringsTrue === false} onPress={() => setRingsTrue(false)} />
          </View>
          {ringsTrue === false ? (
            <>
              <SectionLabel text={tf('reading_feedback_why')} />
              <View style={styles.flow}>
                {ta('reading_feedback_reasons').map((reason, i) => (
                  <OrtusChip
                    key={reason}
                    text={reason}
                    selected={reasons.includes(i)}
                    onPress={() => setReasons((current) => toggled(current, i))}
                  />
                ))}
              </View>
            </>
          ) : null}
          <OrtusWideButton
            text={tf('reading_feedback_send')}
            onPress={() => {
              onSend();
              close();
            }}
            enabled={ringsTrue !== null}
          />
          <OrtusText variant="footnote" color={OrtusColors.textMuted}>
            {tf('reading_feedback_note')}
          </OrtusText>
        </>
      )}
    </OrtusBottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: OrtusSpacing.xs },
  flow: { flexDirection: 'row', flexWrap: 'wrap', gap: OrtusSpacing.xs },
});
