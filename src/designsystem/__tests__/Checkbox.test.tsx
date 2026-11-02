import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { OrtusCheckboxRow } from '../component/Checkbox';
import { UiCue } from '../feedback/UiFeedback';
import { recordingFeedback, withDesignSystem } from '../testing/recordingFeedback';

function Controlled({ onChange }: { onChange: (checked: boolean) => void }) {
  const [checked, setChecked] = useState(false);
  return (
    <OrtusCheckboxRow
      title="I agree"
      checked={checked}
      onCheckedChange={(next) => {
        setChecked(next);
        onChange(next);
      }}
    />
  );
}

describe('OrtusCheckboxRow', () => {
  test('is a checkbox whose checked state follows presses, with one Toggle cue each', async () => {
    const feedback = recordingFeedback();
    const onChange = jest.fn();
    await render(withDesignSystem(<Controlled onChange={onChange} />, feedback));

    const box = screen.getByRole('checkbox');
    expect(box).not.toBeChecked();

    await fireEvent.press(box);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('checkbox')).toBeChecked();

    await fireEvent.press(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('checkbox')).not.toBeChecked();

    expect(feedback.cues).toEqual([UiCue.Toggle, UiCue.Toggle]);
  });

  test('a locked row is announced as checked and disabled', async () => {
    await render(withDesignSystem(<OrtusCheckboxRow title="Required" checked onCheckedChange={null} badge="Required" />, recordingFeedback()));
    const box = screen.getByRole('checkbox');
    expect(box).toBeChecked();
    expect(box).toBeDisabled();
  });
});
