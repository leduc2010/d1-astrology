import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { OrtusShapes, OrtusSizes, OrtusStroke, OrtusText, type OrtusTypeVariant } from '../../designsystem';
import { type Branch, branchElement } from '../../engine';
import { elementColors } from './elementStyle';
import { branchHan } from './ganZhiText';

/* Shared bits for showing people: the owner and the others they added. (relationshipName is in textItems.) */

export type YearSealProps = {
  branch: Branch;
  size?: number;
  variant?: OrtusTypeVariant;
  style?: StyleProp<ViewStyle>;
};

/** A person's year branch as a round seal, tinted by the branch's element. */
export function YearSeal({ branch, size = OrtusSizes.matchSeal, variant = 'han', style }: YearSealProps) {
  const tone = elementColors(branchElement(branch));
  return (
    <View
      style={[
        styles.seal,
        { width: size, height: size, backgroundColor: tone.container, borderColor: tone.content },
        style,
      ]}
    >
      <OrtusText variant={variant} color={tone.content}>
        {branchHan(branch)}
      </OrtusText>
    </View>
  );
}

const styles = StyleSheet.create({
  seal: {
    ...OrtusShapes.pill,
    overflow: 'hidden',
    borderWidth: OrtusStroke.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
