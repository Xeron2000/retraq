import type { ReplaySpeed } from '../utils/replayPlayback';

interface ReplayControlsProps {
  canReplay: boolean;
  cursorTimeLabel: string;
  isPlaying: boolean;
  speed: ReplaySpeed;
  onPlayPause: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onSetSpeed: (speed: ReplaySpeed) => void;
}

const SPEED_OPTIONS: ReplaySpeed[] = [1, 2, 4];

export default function ReplayControls({
  canReplay,
  cursorTimeLabel,
  isPlaying,
  speed,
  onPlayPause,
  onStepBackward,
  onStepForward,
  onReset,
  onSetSpeed,
}: ReplayControlsProps) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <span className='rounded-lg border border-base-300 bg-base-100/70 px-3 py-1 text-xs text-base-content/70'>
        {cursorTimeLabel}
      </span>

      <div className='join'>
        <button
          aria-label='后退一步'
          className='btn btn-sm join-item'
          disabled={!canReplay}
          onClick={onStepBackward}
          type='button'
        >
          后退一步
        </button>
        <button
          aria-label={isPlaying ? '暂停' : '播放'}
          className='btn btn-sm join-item'
          disabled={!canReplay}
          onClick={onPlayPause}
          type='button'
        >
          {isPlaying ? '暂停' : '播放'}
        </button>
        <button
          aria-label='前进一步'
          className='btn btn-sm join-item'
          disabled={!canReplay}
          onClick={onStepForward}
          type='button'
        >
          前进一步
        </button>
        <button aria-label='重置' className='btn btn-sm join-item' disabled={!canReplay} onClick={onReset} type='button'>
          重置
        </button>
      </div>

      <div className='join'>
        {SPEED_OPTIONS.map((option) => (
          <button
            key={option}
            aria-label={`${option}x`}
            aria-pressed={speed === option}
            className={`btn btn-sm join-item ${speed === option ? 'btn-primary' : 'btn-ghost'}`}
            disabled={!canReplay}
            onClick={() => onSetSpeed(option)}
            type='button'
          >
            {option}x
          </button>
        ))}
      </div>
    </div>
  );
}
