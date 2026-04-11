import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ReplayControls from '../components/ReplayControls';

describe('ReplayControls', () => {
  it('renders the phase 2 control surface and toggles play/pause', async () => {
    const user = userEvent.setup();
    const onPlayPause = vi.fn();

    render(
      <ReplayControls
        canReplay
        cursorTimeLabel='2024-04-11 09:15'
        isPlaying={false}
        speed={2}
        onPlayPause={onPlayPause}
        onReset={vi.fn()}
        onSetSpeed={vi.fn()}
        onStepBackward={vi.fn()}
        onStepForward={vi.fn()}
      />,
    );

    expect(screen.getByText('2024-04-11 09:15')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '播放' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1x' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2x' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: '播放' }));
    expect(onPlayPause).toHaveBeenCalledTimes(1);
  });

  it('disables controls when replay is unavailable and forwards step/reset/speed actions', async () => {
    const user = userEvent.setup();
    const onStepBackward = vi.fn();
    const onStepForward = vi.fn();
    const onReset = vi.fn();
    const onSetSpeed = vi.fn();

    const { rerender } = render(
      <ReplayControls
        canReplay={false}
        cursorTimeLabel='等待交易'
        isPlaying={false}
        speed={1}
        onPlayPause={vi.fn()}
        onReset={onReset}
        onSetSpeed={onSetSpeed}
        onStepBackward={onStepBackward}
        onStepForward={onStepForward}
      />,
    );

    expect(screen.getByRole('button', { name: '后退一步' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '前进一步' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '重置' })).toBeDisabled();

    rerender(
      <ReplayControls
        canReplay
        cursorTimeLabel='2024-04-11 09:20'
        isPlaying
        speed={1}
        onPlayPause={vi.fn()}
        onReset={onReset}
        onSetSpeed={onSetSpeed}
        onStepBackward={onStepBackward}
        onStepForward={onStepForward}
      />,
    );

    await user.click(screen.getByRole('button', { name: '后退一步' }));
    await user.click(screen.getByRole('button', { name: '前进一步' }));
    await user.click(screen.getByRole('button', { name: '重置' }));
    await user.click(screen.getByRole('button', { name: '4x' }));

    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();
    expect(onStepBackward).toHaveBeenCalledTimes(1);
    expect(onStepForward).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onSetSpeed).toHaveBeenCalledWith(4);
  });
});
