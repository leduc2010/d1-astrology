import { type StyleProp, View, type ViewStyle } from 'react-native';

import { OrtusTag, TagTone } from '../../designsystem';
import { useT } from '../../i18n';
import type { TopicReading } from './reading';

/** Gold when most systems agree, green when all of them do; never a score. */
export function agreementTone(reading: TopicReading): TagTone {
  if (reading.available > 1 && reading.agreement === reading.available) return TagTone.Auspicious;
  if (reading.agreement > 1) return TagTone.Gold;
  return TagTone.Neutral;
}

export type AgreementTagProps = {
  reading: TopicReading;
  style?: StyleProp<ViewStyle>;
};

/** "2/3": how many systems point the same way, read out as "2 of 3 systems agree". */
export function AgreementTag({ reading, style }: AgreementTagProps) {
  const { tf } = useT();
  return (
    <View
      accessible
      accessibilityLabel={tf('reading_agreement_description', reading.agreement, reading.available)}
      style={style}
    >
      <OrtusTag text={tf('reading_agreement', reading.agreement, reading.available)} tone={agreementTone(reading)} />
    </View>
  );
}
