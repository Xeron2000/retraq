import { describe, expect, it } from 'vitest';
import {
  buildReplayProgressStorageKey,
  createInitialReplayPlaybackState,
  createReplayProgressRecord,
  deserializeReplayProgress,
  replayPlaybackReducer,
  serializeReplayProgress,
  type ReplayProgressRecord,
} from '../utils/replayPlayback';

describe('replayPlayback transport', () => {
  it('restores saved cursor when the trade id matches', () => {
    const saved: ReplayProgressRecord = {
      version: 1,
      tradeId: 42,
      cursorTime: 1_712_800_600_000,
      speed: 2,
      savedAt: 1_712_900_000_000,
    };

    expect(
      createInitialReplayPlaybackState({
        tradeId: 42,
        entryTime: 1_712_800_000_000,
        savedProgress: saved,
      }),
    ).toEqual({
      cursorTime: saved.cursorTime,
      isPlaying: false,
      speed: 2,
    });
  });

  it('falls back to the trade entry time when saved progress is absent or mismatched', () => {
    expect(
      createInitialReplayPlaybackState({
        tradeId: 42,
        entryTime: 1_712_800_000_000,
        savedProgress: {
          version: 1,
          tradeId: 7,
          cursorTime: 1_712_800_600_000,
          speed: 4,
          savedAt: 1_712_900_000_000,
        },
      }),
    ).toEqual({
      cursorTime: 1_712_800_000_000,
      isPlaying: false,
      speed: 1,
    });
  });

  it('steps forward and backward inside the replay bounds', () => {
    const initial = createInitialReplayPlaybackState({
      tradeId: 42,
      entryTime: 1000,
      savedProgress: null,
    });

    const steppedForward = replayPlaybackReducer(initial, {
      type: 'step',
      direction: 'forward',
      stepMs: 100,
      minTime: 1000,
      maxTime: 1400,
    });

    const steppedBackward = replayPlaybackReducer(steppedForward, {
      type: 'step',
      direction: 'backward',
      stepMs: 100,
      minTime: 1000,
      maxTime: 1400,
    });

    expect(steppedForward.cursorTime).toBe(1100);
    expect(steppedBackward.cursorTime).toBe(1000);
  });

  it('clamps the cursor at the replay bounds and pauses when a tick reaches the end', () => {
    const playing = replayPlaybackReducer(
      {
        cursorTime: 1300,
        isPlaying: true,
        speed: 4,
      },
      {
        type: 'tick',
        stepMs: 100,
        minTime: 1000,
        maxTime: 1400,
      },
    );

    const clampedBackward = replayPlaybackReducer(playing, {
      type: 'step',
      direction: 'backward',
      stepMs: 500,
      minTime: 1000,
      maxTime: 1400,
    });

    expect(playing).toEqual({
      cursorTime: 1400,
      isPlaying: false,
      speed: 4,
    });
    expect(clampedBackward.cursorTime).toBe(1000);
  });

  it('supports play, pause, reset, and speed changes', () => {
    const initial = createInitialReplayPlaybackState({
      tradeId: 42,
      entryTime: 1000,
      savedProgress: null,
    });

    const started = replayPlaybackReducer(initial, { type: 'play' });
    const spedUp = replayPlaybackReducer(started, { type: 'setSpeed', speed: 4 });
    const paused = replayPlaybackReducer(spedUp, { type: 'pause' });
    const reset = replayPlaybackReducer(paused, { type: 'reset', resetTime: 1000 });

    expect(started.isPlaying).toBe(true);
    expect(spedUp.speed).toBe(4);
    expect(paused.isPlaying).toBe(false);
    expect(reset).toEqual({
      cursorTime: 1000,
      isPlaying: false,
      speed: 4,
    });
  });

  it('round-trips versioned replay progress records', () => {
    const record = createReplayProgressRecord({
      tradeId: 42,
      cursorTime: 1_712_800_600_000,
      speed: 2,
      savedAt: 1_712_900_000_000,
    });

    const serialized = serializeReplayProgress(record);

    expect(deserializeReplayProgress(serialized)).toEqual(record);
    expect(buildReplayProgressStorageKey(42)).toBe('retraq:replay-progress:42');
  });
});
