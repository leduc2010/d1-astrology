import type { BirthProfile } from '@/core/model';
import { Topic, TOPICS } from '@/core/reading';
import { TestProfiles } from '@/core/testing';

import {
  hasZiWei,
  parseLens,
  parseTopic,
  ReadingLens,
  readingsLoadOf,
  readingsUiState,
  withFeedback,
  type ReadingsReady,
  type ReadingsUiState,
} from '../readingsModel';

const OWNER: BirthProfile = TestProfiles.owner;

function stateOf(profile: BirthProfile | null, lens = ReadingLens.COMBINED, sent: readonly Topic[] = []): ReadingsUiState {
  return readingsUiState(readingsLoadOf(profile), lens, sent);
}

function ready(state: ReadingsUiState): ReadingsReady {
  if (state.kind !== 'Ready') throw new Error(`expected Ready, got ${state.kind}`);
  return state;
}

// Ports ReadingsViewModelTest.
describe('ReadingsViewModel', () => {
  test('without a profile there is nothing to read', () => {
    expect(stateOf(null).kind).toBe('NoProfile');
  });

  test('a profile gives the six readings with Tu Vi', () => {
    const state = ready(stateOf(OWNER));
    expect(state.readings.map((it) => it.topic)).toEqual([...TOPICS]);
    expect(state.lens).toBe(ReadingLens.COMBINED);
    expect(hasZiWei(state)).toBe(true);
  });

  test('without a birth time Tu Vi is missing', () => {
    const state = ready(stateOf({ ...OWNER, clock: null }));
    expect(hasZiWei(state)).toBe(false);
  });

  test('selecting a lens keeps the readings', () => {
    const load = readingsLoadOf(OWNER);
    const before = ready(readingsUiState(load, ReadingLens.COMBINED, []));
    const after = ready(readingsUiState(load, ReadingLens.BAZI, []));
    expect(after.readings).toEqual(before.readings);
    expect(after.lens).toBe(ReadingLens.BAZI);
  });

  test('feedback is remembered per topic', () => {
    const sent = withFeedback([], Topic.LOVE);
    const state = ready(stateOf(OWNER, ReadingLens.COMBINED, sent));
    expect(state.feedbackSent).toEqual([Topic.LOVE]);
  });

  test('a date outside the supported range is unavailable', () => {
    expect(stateOf({ ...OWNER, date: TestProfiles.outOfRange }).kind).toBe('Unavailable');
  });
});

// RN only: routes carry topic and lens as strings.
describe('route params', () => {
  test('topic and lens keys parse back, unknown keys do not', () => {
    expect(parseTopic('LOVE')).toBe(Topic.LOVE);
    expect(parseTopic('NOPE')).toBeNull();
    expect(parseTopic('1')).toBeNull();
    expect(parseTopic(undefined)).toBeNull();
    expect(parseLens('BAZI')).toBe(ReadingLens.BAZI);
    expect(parseLens('nope')).toBe(ReadingLens.COMBINED);
    expect(withFeedback([Topic.LOVE], Topic.LOVE)).toEqual([Topic.LOVE]);
  });
});
