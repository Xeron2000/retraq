import type { CompareMode } from '../utils/comparePane';

interface CompareModeControlsProps {
  mode: CompareMode;
  onChangeMode: (mode: CompareMode) => void;
}

export default function CompareModeControls({ mode, onChangeMode }: CompareModeControlsProps) {
  return (
    <div className='join'>
      <button
        aria-pressed={mode === 'off'}
        className={`btn btn-sm join-item ${mode === 'off' ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => onChangeMode('off')}
        type='button'
      >
        关闭
      </button>
      <button
        aria-pressed={mode === 'symbol'}
        className={`btn btn-sm join-item ${mode === 'symbol' ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => onChangeMode('symbol')}
        type='button'
      >
        交易对
      </button>
      <button
        aria-pressed={mode === 'timeframe'}
        className={`btn btn-sm join-item ${mode === 'timeframe' ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => onChangeMode('timeframe')}
        type='button'
      >
        周期
      </button>
    </div>
  );
}
