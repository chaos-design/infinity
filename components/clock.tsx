import { format } from 'date-fns';
import type React from 'react';
import { useEffect, useState } from 'react';

interface ClockProps {
  showSeconds?: boolean;
}

export const Clock: React.FC<ClockProps> = ({ showSeconds = true }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    let timer: number | undefined;

    const scheduleNextTick = () => {
      const now = new Date();
      setTime(now);

      const nowMs = now.getTime();
      const tickSize = showSeconds ? 1000 : 60_000;
      const remainder = nowMs % tickSize;
      const delay = remainder === 0 ? tickSize : tickSize - remainder;

      timer = window.setTimeout(scheduleNextTick, delay);
    };

    scheduleNextTick();

    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [showSeconds]);

  return (
    <div className="flex flex-col items-center justify-center text-white select-none mb-8">
      <div className="mb-2 flex items-end gap-3 text-[5.5rem] md:text-[8rem] leading-none font-bold tracking-[-0.06em] tabular-nums drop-shadow-[0_4px_32px_rgba(0,0,0,0.6)]">
        <span>{format(time, showSeconds ? 'HH:mm:ss' : 'HH:mm')}</span>
      </div>
      <div className="text-xl md:text-2xl font-medium tracking-wide opacity-95 drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)]">
        {format(time, 'EEEE, MMMM d, yyyy')}
      </div>
    </div>
  );
};
