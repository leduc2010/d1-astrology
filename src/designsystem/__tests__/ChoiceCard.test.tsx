import { fireEvent, render, screen } from '@testing-library/react-native';

import { OrtusChoiceCard } from '../component/ChoiceCard';
import { OrtusText } from '../component/OrtusText';
import { UiCue } from '../feedback/UiFeedback';
import { recordingFeedback, withDesignSystem } from '../testing/recordingFeedback';

describe('OrtusChoiceCard', () => {
  test('is a radio that reports its selected state', async () => {
    await render(
      withDesignSystem(
        <>
          <OrtusChoiceCard selected onPress={() => {}} accessibilityLabel="Yearly">
            <OrtusText variant="title">Yearly</OrtusText>
          </OrtusChoiceCard>
          <OrtusChoiceCard selected={false} onPress={() => {}} accessibilityLabel="Monthly">
            <OrtusText variant="title">Monthly</OrtusText>
          </OrtusChoiceCard>
        </>,
        recordingFeedback(),
      ),
    );

    expect(screen.getByRole('radio', { name: 'Yearly' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Yearly' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Monthly' })).not.toBeSelected();
  });

  test('a press plays one Select cue', async () => {
    const feedback = recordingFeedback();
    const onPress = jest.fn();
    await render(withDesignSystem(<OrtusChoiceCard selected={false} onPress={onPress} accessibilityLabel="Monthly" />, feedback));

    await fireEvent.press(screen.getByRole('radio', { name: 'Monthly' }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(feedback.cues).toEqual([UiCue.Select]);
  });
});
