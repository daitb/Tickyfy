import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Badge } from './ui/badge';

interface DateFilterDropdownProps {
  onApply: (dates: { from?: Date; to?: Date }) => void;
  currentDates?: { from?: Date; to?: Date };
}

type QuickOption = 'all' | 'today' | 'tomorrow' | 'weekend' | 'month';

export function DateFilterDropdown({ onApply, currentDates }: DateFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>(currentDates || {});
  const [quickOption, setQuickOption] = useState<QuickOption>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleQuickSelect = (option: QuickOption) => {
    setQuickOption(option);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (option) {
      case 'all':
        setDateRange({});
        break;
      case 'today':
        setDateRange({ from: today, to: today });
        break;
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDateRange({ from: tomorrow, to: tomorrow });
        break;
      case 'weekend':
        const daysUntilSaturday = (6 - today.getDay() + 7) % 7;
        const saturday = new Date(today);
        saturday.setDate(saturday.getDate() + daysUntilSaturday);
        const sunday = new Date(saturday);
        sunday.setDate(sunday.getDate() + 1);
        setDateRange({ from: saturday, to: sunday });
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setDateRange({ from: monthStart, to: monthEnd });
        break;
    }
  };

  const handleReset = () => {
    setDateRange({});
    setQuickOption('all');
  };

  const handleApply = () => {
    onApply(dateRange);
    setIsOpen(false);
  };

  const formatDateLabel = () => {
    if (!dateRange.from) return 'All days';
    
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    };

    if (dateRange.from && dateRange.to && dateRange.from.getTime() !== dateRange.to.getTime()) {
      return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
    }
    
    return formatDate(dateRange.from);
  };

  const hasActiveFilter = dateRange.from !== undefined;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        ref={buttonRef}
        variant={hasActiveFilter ? 'default' : 'outline'}
        className={`gap-2 ${
          hasActiveFilter 
            ? 'bg-teal-500 hover:bg-teal-600 text-white' 
            : 'bg-white hover:bg-neutral-50'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon size={16} />
        <span>{formatDateLabel()}</span>
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-2xl border border-neutral-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ width: '600px' }}
        >
          <div className="p-6">
            {/* Quick Select Buttons */}
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-100">
              <Button
                variant={quickOption === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickSelect('all')}
                className={quickOption === 'all' ? 'bg-teal-500 hover:bg-teal-600' : ''}
              >
                All days
              </Button>
              <Button
                variant={quickOption === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickSelect('today')}
                className={quickOption === 'today' ? 'bg-teal-500 hover:bg-teal-600' : ''}
              >
                Today
              </Button>
              <Button
                variant={quickOption === 'tomorrow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickSelect('tomorrow')}
                className={quickOption === 'tomorrow' ? 'bg-teal-500 hover:bg-teal-600' : ''}
              >
                Tomorrow
              </Button>
              <Button
                variant={quickOption === 'weekend' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickSelect('weekend')}
                className={quickOption === 'weekend' ? 'bg-teal-500 hover:bg-teal-600' : ''}
              >
                This weekend
              </Button>
              <Button
                variant={quickOption === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickSelect('month')}
                className={quickOption === 'month' ? 'bg-teal-500 hover:bg-teal-600' : ''}
              >
                This month
              </Button>
            </div>

            {/* Calendar */}
            <div className="mb-4">
              <Calendar
                mode="range"
                selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                onSelect={(range) => {
                  if (range) {
                    setDateRange({
                      from: range.from || new Date(),
                      to: range.to || new Date()
                    });
                    setQuickOption('all');
                  }
                }}
                numberOfMonths={2}
                className="flex justify-center"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-teal-500 text-teal-600 hover:bg-teal-50"
              >
                Reset
              </Button>
              <Button
                onClick={handleApply}
                className="bg-teal-500 hover:bg-teal-600 text-white"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
