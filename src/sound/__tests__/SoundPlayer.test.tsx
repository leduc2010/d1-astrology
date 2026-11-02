import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import type { AudioPlayer, AudioSource } from 'expo-audio';

import { UiCue, useUiFeedback, type UiFeedback } from '@/designsystem/feedback/UiFeedback';

import { CUE_SOURCES, CUE_VOLUMES, MIN_GAP_MS } from '../cues';
import { SoundPlayer } from '../SoundPlayer';
import { SoundProvider, useSound } from '../SoundProvider';

const mockCreateAudioPlayer = jest.fn();
const mockSetAudioModeAsync = jest.fn((_mode: unknown) => Promise.resolve());

jest.mock('expo-audio', () => ({
  createAudioPlayer: (source: unknown) => mockCreateAudioPlayer(source),
  setAudioModeAsync: (mode: unknown) => mockSetAudioModeAsync(mode),
}));

type FakePlayer = AudioPlayer & { source: AudioSource; plays: number; removed: boolean };

function fakePlayer(source: AudioSource, isLoaded = true): FakePlayer {
  const player = {
    source,
    isLoaded,
    volume: 1,
    plays: 0,
    removed: false,
    seekTo: jest.fn(() => Promise.resolve()),
    play() {
      player.plays += 1;
    },
    remove() {
      player.removed = true;
    },
  };
  return player as unknown as FakePlayer;
}

function setup(options: { isLoaded?: boolean } = {}) {
  let time = 1_000;
  const created: FakePlayer[] = [];
  const configureAudio = jest.fn(() => Promise.resolve());
  const sound = new SoundPlayer({
    createPlayer: (source) => {
      const player = fakePlayer(source, options.isLoaded ?? true);
      created.push(player);
      return player;
    },
    configureAudio,
    now: () => time,
  });
  const playerOf = (cue: UiCue) => created.find((p) => p.source === CUE_SOURCES[cue]);
  const totalPlays = () => created.reduce((sum, p) => sum + p.plays, 0);
  const advance = (ms: number) => {
    time += ms;
  };
  return { sound, created, configureAudio, playerOf, totalPlays, advance };
}

describe('SoundPlayer', () => {
  test('is enabled by default and plays a cue at its volume', () => {
    const { sound, playerOf } = setup();
    expect(sound.isEnabled).toBe(true);

    sound.perform(UiCue.Reveal);

    const player = playerOf(UiCue.Reveal)!;
    expect(player.plays).toBe(1);
    expect(player.volume).toBe(CUE_VOLUMES.Reveal);
    expect(player.seekTo).toHaveBeenCalledWith(0);
  });

  test('cue volumes match Kotlin', () => {
    expect(CUE_VOLUMES).toEqual({ Tap: 0.35, Select: 0.35, Toggle: 0.35, Open: 0.45, Reveal: 0.6, Success: 0.6 });
    expect(MIN_GAP_MS).toBe(70);
  });

  test('plays nothing while disabled', () => {
    const { sound, totalPlays, advance } = setup();
    sound.setEnabled(false);

    sound.perform(UiCue.Tap);
    advance(500);
    sound.perform(UiCue.Success);

    expect(sound.isEnabled).toBe(false);
    expect(totalPlays()).toBe(0);
  });

  test('re-enabling plays again', () => {
    const { sound, totalPlays } = setup();
    sound.setEnabled(false);
    sound.setEnabled(true);
    sound.perform(UiCue.Tap);
    expect(totalPlays()).toBe(1);
  });

  test('one cue per action: cues closer than the minimum gap are dropped', () => {
    const { sound, totalPlays, advance } = setup();

    sound.perform(UiCue.Tap);
    sound.perform(UiCue.Select);
    advance(MIN_GAP_MS - 1);
    sound.perform(UiCue.Toggle);
    expect(totalPlays()).toBe(1);

    advance(1);
    sound.perform(UiCue.Toggle);
    expect(totalPlays()).toBe(2);
  });

  test('a cue that has not loaded yet is skipped and does not hold the throttle', () => {
    const { sound, totalPlays } = setup({ isLoaded: false });
    sound.perform(UiCue.Tap);
    expect(totalPlays()).toBe(0);
  });

  test('load configures audio once and creates one player per cue', () => {
    const { sound, created, configureAudio } = setup();
    sound.load();
    sound.load();
    expect(configureAudio).toHaveBeenCalledTimes(1);
    expect(created).toHaveLength(Object.keys(UiCue).length);
  });

  test('release frees every player, and a later cue loads again', () => {
    const { sound, created } = setup();
    sound.load();
    sound.release();
    expect(created.every((p) => p.removed)).toBe(true);

    sound.perform(UiCue.Tap);
    expect(created).toHaveLength(Object.keys(UiCue).length + 1);
  });

  test('a player that fails to load never breaks the action', () => {
    const sound = new SoundPlayer({
      createPlayer: () => {
        throw new Error('no audio device');
      },
      configureAudio: () => Promise.resolve(),
      now: () => 0,
    });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => sound.perform(UiCue.Tap)).not.toThrow();
    warn.mockRestore();
  });

  test('the default audio session mixes with other apps and respects silent mode', () => {
    mockCreateAudioPlayer.mockImplementation((source: AudioSource) => fakePlayer(source));
    new SoundPlayer().load();
    expect(mockSetAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
    });
  });
});

describe('SoundProvider', () => {
  beforeEach(() => {
    mockCreateAudioPlayer.mockReset();
    mockCreateAudioPlayer.mockImplementation((source: AudioSource) => fakePlayer(source));
  });

  test('provides the sound player as the design-system feedback sink', async () => {
    let fromSound: UiFeedback | undefined;
    let fromDesignSystem: UiFeedback | undefined;
    function Probe() {
      fromSound = useSound();
      fromDesignSystem = useUiFeedback();
      return <Text>probe</Text>;
    }
    const view = await render(
      <SoundProvider>
        <Probe />
      </SoundProvider>,
    );
    expect(fromSound).toBeInstanceOf(SoundPlayer);
    expect(fromDesignSystem).toBe(fromSound);
    expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(Object.keys(UiCue).length);

    await view.rerender(
      <SoundProvider enabled={false}>
        <Probe />
      </SoundProvider>,
    );
    expect((fromSound as SoundPlayer).isEnabled).toBe(false);

    const players = mockCreateAudioPlayer.mock.results.map((r) => r.value as FakePlayer);
    await view.unmount();
    expect(players.every((p) => p.removed)).toBe(true);
  });
});
