import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from './ui/button';
import { DateRangePicker } from 'react-date-range';
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { Badge } from './ui/badge';
import { useTranslation } from 'react-i18next';

interface DateFilterDropdownProps {
  onApply: (dates: { from?: Date; to?: Date }) => void;
  currentDates?: { from?: Date; to?: Date };
}

type QuickOption = 'all' | 'today' | 'tomorrow' | 'weekend' | 'month';

export function DateFilterDropdown({ onApply, currentDates }: DateFilterDropdownProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>(currentDates || {});
  const [selectionRange, setSelectionRange] = useState([
    {
      startDate: currentDates?.from || new Date(),
      endDate: currentDates?.to || new Date(),
      key: 'selection'
    }
  ]);
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

    let newRange: { from?: Date; to?: Date } = {};

    switch (option) {
      case 'all':
        newRange = { from: undefined, to: undefined };
        setSelectionRange([{
          startDate: new Date(),
          endDate: new Date(),
          key: 'selection'
        }]);
        break;
      case 'today':
        newRange = { from: today, to: today };
        setSelectionRange([{
          startDate: today,
          endDate: today,
          key: 'selection'
        }]);
        break;
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        newRange = { from: tomorrow, to: tomorrow };
        setSelectionRange([{
          startDate: tomorrow,
          endDate: tomorrow,
          key: 'selection'
        }]);
        break;
      case 'weekend':
        const saturday = startOfWeek(addDays(today, 7), { weekStartsOn: 6 });
        const sunday = endOfWeek(saturday, { weekStartsOn: 6 });
        newRange = { from: saturday, to: sunday };
        setSelectionRange([{
          startDate: saturday,
          endDate: sunday,
          key: 'selection'
        }]);
        break;
      case 'month':
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        newRange = { from: monthStart, to: monthEnd };
        setSelectionRange([{
          startDate: monthStart,
          endDate: monthEnd,
          key: 'selection'
        }]);
        break;
    }
    
    setDateRange(newRange);
  };

  const handleReset = () => {
    setDateRange({ from: undefined, to: undefined });
    setSelectionRange([{
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }]);
    setQuickOption('all');
  };

  const handleApply = () => {
    onApply(dateRange);
    setIsOpen(false);
  };

  const formatDateLabel = () => {
    if (!dateRange.from) return t('dateFilter.allDays', 'All days');
    
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
          style={{ minWidth: '700px' }}
        >
          <div className="flex">
            {/* Sidebar with Quick Options */}
            <div className="w-48 border-r border-neutral-200 py-4 pl-4 pr-2">
              <div className="space-y-1">
                <button
                  onClick={() => handleQuickSelect('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    quickOption === 'all' 
                      ? 'bg-teal-50 text-teal-700 font-medium' 
                      : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  {t('dateFilter.allDays', 'All days')}
                </button>
                <button
                  onClick={() => handleQuickSelect('today')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    quickOption === 'today' 
                      ? 'bg-teal-50 text-teal-700 font-medium' 
                      : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  {t('dateFilter.today', 'Today')}
                </button>
                <button
                  onClick={() => handleQuickSelect('tomorrow')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    quickOption === 'tomorrow' 
                      ? 'bg-teal-50 text-teal-700 font-medium' 
                      : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  {t('dateFilter.tomorrow', 'Tomorrow')}
                </button>
                <button
                  onClick={() => handleQuickSelect('weekend')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    quickOption === 'weekend' 
                      ? 'bg-teal-50 text-teal-700 font-medium' 
                      : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  {t('dateFilter.thisWeekend', 'This weekend')}
                </button>
                <button
                  onClick={() => handleQuickSelect('month')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    quickOption === 'month' 
                      ? 'bg-teal-50 text-teal-700 font-medium' 
                      : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  {t('dateFilter.thisMonth', 'This month')}
                </button>
              </div>
            </div>

            {/* Calendar Section */}
            <div className="flex-1 py-4 pr-4 pl-2">
              <style>{`
                .rdrDefinedRangesWrapper {
                  display: none !important;
                }
                .rdrDateRangePickerWrapper {
                  display: flex;
                  flex-direction: column;
                }
              `}</style>
              <DateRangePicker
                ranges={selectionRange}
                onChange={(item: any) => {
                  setSelectionRange([item.selection]);
                  setDateRange({
                    from: item.selection.startDate,
                    to: item.selection.endDate
                  });
                  setQuickOption('all');
                }}
                months={2}
                direction="horizontal"
                showDateDisplay={false}
                rangeColors={['#14b8a6']}
                color="#14b8a6"
              />

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-neutral-100">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-teal-500 text-teal-600 hover:bg-teal-50"
                >
                  {t('dateFilter.reset', 'Reset')}
                </Button>
                <Button
                  onClick={handleApply}
                  className="bg-teal-500 hover:bg-teal-600 text-white"
                >
                  {t('dateFilter.apply', 'Apply')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
