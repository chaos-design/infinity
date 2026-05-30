import { act, render, screen } from '@testing-library/react';
import { format } from 'date-fns';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Clock } from '../components/clock';

describe('Clock', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates on the next second boundary instead of drifting by mount time', () => {
    vi.useFakeTimers();

    const initialTime = new Date('2026-05-26T12:00:00.500');
    vi.setSystemTime(initialTime);

    render(<Clock showSeconds />);
    expect(
      screen.getByText(format(initialTime, 'HH:mm:ss')),
    ).toBeInTheDocument();

    const almostNextSecond = new Date(initialTime.getTime() + 499);
    vi.setSystemTime(almostNextSecond);
    act(() => {
      vi.advanceTimersByTime(499);
    });

    expect(
      screen.getByText(format(initialTime, 'HH:mm:ss')),
    ).toBeInTheDocument();

    const nextSecond = new Date(initialTime.getTime() + 500);
    vi.setSystemTime(nextSecond);
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(
      screen.getByText(format(nextSecond, 'HH:mm:ss')),
    ).toBeInTheDocument();
  });
});
