import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { OrtusTabBar, type TabItem } from '../component/TabBar';
import { UiCue } from '../feedback/UiFeedback';
import { OrtusIcons } from '../icons/OrtusIcons';
import { recordingFeedback, withDesignSystem } from '../testing/recordingFeedback';

const ITEMS: readonly TabItem[] = [
  { label: 'Today', icon: OrtusIcons.Today },
  { label: 'Calendar', icon: OrtusIcons.Calendar },
  { label: 'Me', icon: OrtusIcons.Me },
];

function Controlled({ onSelect }: { onSelect: (index: number) => void }) {
  const [selected, setSelected] = useState(0);
  return (
    <OrtusTabBar
      items={ITEMS}
      selectedIndex={selected}
      bottomInset={0}
      onSelect={(index) => {
        setSelected(index);
        onSelect(index);
      }}
    />
  );
}

describe('OrtusTabBar', () => {
  test('renders one tab per item, the current one selected', async () => {
    await render(withDesignSystem(<Controlled onSelect={() => {}} />, recordingFeedback()));

    expect(screen.getAllByRole('tab')).toHaveLength(ITEMS.length);
    expect(screen.getByRole('tab', { name: 'Today' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Calendar' })).not.toBeSelected();
  });

  test('pressing a tab selects it and plays one Select cue', async () => {
    const feedback = recordingFeedback();
    const onSelect = jest.fn();
    await render(withDesignSystem(<Controlled onSelect={onSelect} />, feedback));

    await fireEvent.press(screen.getByRole('tab', { name: 'Calendar' }));

    expect(onSelect).toHaveBeenCalledWith(1);
    expect(screen.getByRole('tab', { name: 'Calendar' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Today' })).not.toBeSelected();
    expect(feedback.cues).toEqual([UiCue.Select]);
  });

  test('works under reduced motion', async () => {
    await render(withDesignSystem(<Controlled onSelect={() => {}} />, recordingFeedback(), true));
    expect(screen.getByRole('tab', { name: 'Me' })).not.toBeSelected();
  });
});
