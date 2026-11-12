import { fireEvent, render, screen } from '@testing-library/react-native';
import { ScrollView } from 'react-native';

import { OrtusWheelPicker, OrtusWheelRow } from '../component/WheelPicker';
import { UiCue } from '../feedback/UiFeedback';
import { OrtusSizes } from '../theme/dimens';
import { recordingFeedback, withDesignSystem } from '../testing/recordingFeedback';

const ROW = OrtusSizes.wheelRow;
const YEARS = ['1995', '1996', '1997', '1998'];

const scrollEvent = (y: number) => ({ nativeEvent: { contentOffset: { x: 0, y } } });

async function renderWheel(onSelect = jest.fn(), feedback = recordingFeedback()) {
  await render(
    withDesignSystem(
      <ScrollView>
        <OrtusWheelRow>
          <OrtusWheelPicker items={YEARS} selectedIndex={0} onSelect={onSelect} label="Year" testID="year" />
        </OrtusWheelRow>
      </ScrollView>,
      feedback,
    ),
  );
  return { onSelect, feedback, wheel: screen.getByTestId('year-scroll', { includeHiddenElements: true }) };
}

describe('OrtusWheelPicker', () => {
  test('takes the drag inside a scrolling page (Android nested scrolling)', async () => {
    const { wheel } = await renderWheel();
    expect(wheel.props.nestedScrollEnabled).toBe(true);
  });

  test('commits the row it comes to rest on, once, with one Select cue', async () => {
    const { onSelect, feedback, wheel } = await renderWheel();

    await fireEvent(wheel, 'scrollBeginDrag', scrollEvent(0));
    await fireEvent(wheel, 'momentumScrollBegin', scrollEvent(ROW));
    await fireEvent(wheel, 'momentumScrollEnd', scrollEvent(2 * ROW));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(2);
    expect(feedback.cues).toEqual([UiCue.Select]);
  });

  test('is one adjustable control named after its label', async () => {
    await renderWheel();
    expect(screen.getByLabelText('Year').props.accessibilityValue).toMatchObject({ now: 0, text: '1995' });
  });
});
