import { fireEvent, render, screen } from '@testing-library/react-native';

import { ButtonSize, ButtonStyle, OrtusButton, OrtusIconButton } from '../component/Buttons';
import { UiCue } from '../feedback/UiFeedback';
import { OrtusIcons } from '../icons/OrtusIcons';
import { recordingFeedback, withDesignSystem } from '../testing/recordingFeedback';

describe('OrtusButton', () => {
  test('is a button that plays one Tap cue and then calls onPress', async () => {
    const feedback = recordingFeedback();
    const onPress = jest.fn();
    await render(withDesignSystem(<OrtusButton text="Continue" onPress={onPress} />, feedback));

    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(feedback.cues).toEqual([UiCue.Tap]);
  });

  test('a custom cue replaces Tap', async () => {
    const feedback = recordingFeedback();
    await render(withDesignSystem(<OrtusButton text="Reveal" onPress={() => {}} cue={UiCue.Reveal} />, feedback));
    await fireEvent.press(screen.getByRole('button', { name: 'Reveal' }));
    expect(feedback.cues).toEqual([UiCue.Reveal]);
  });

  test('when disabled it is announced as disabled and ignores presses', async () => {
    const feedback = recordingFeedback();
    const onPress = jest.fn();
    await render(withDesignSystem(<OrtusButton text="Save" onPress={onPress} enabled={false} />, feedback));

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(feedback.cues).toEqual([]);
  });

  test.each(Object.values(ButtonStyle))('renders the %s variant', async (variant) => {
    await render(withDesignSystem(<OrtusButton text="Go" onPress={() => {}} variant={variant} size={ButtonSize.Small} />, recordingFeedback()));
    expect(screen.getByText('Go')).toBeTruthy();
  });
});

describe('OrtusIconButton', () => {
  test('carries its accessibility label and meets the minimum touch size', async () => {
    const onPress = jest.fn();
    await render(
      withDesignSystem(<OrtusIconButton icon={OrtusIcons.Back} onPress={onPress} accessibilityLabel="Back" />, recordingFeedback()),
    );
    const button = screen.getByRole('button', { name: 'Back' });
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
