import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface HoldTimerProps {
  durationMinutes?: number;
  onExpire?: () => void;
}

export function HoldTimer({ durationMinutes = 10, onExpire }: HoldTimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isUrgent = timeLeft < 120; // Less than 2 minutes

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
      isUrgent ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
    }`}>
      <Clock size={16} className={isUrgent ? 'animate-pulse' : ''} />
      <span className="text-sm">
        Tickets held for {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
