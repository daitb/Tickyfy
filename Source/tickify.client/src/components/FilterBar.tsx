import { DateFilterDropdown } from './DateFilterDropdown';
import { CategoryFilterDropdown } from './CategoryFilterDropdown';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';
import type { Category } from '../types';

export interface FilterBarState {
  dateRange?: { from?: Date; to?: Date };
  city?: string;
  isFree?: boolean;
  categories?: Category[];
}

interface FilterBarProps {
  filters: FilterBarState;
  onFiltersChange: (filters: FilterBarState) => void;
  resultCount: number;
}

export function FilterBar({ filters, onFiltersChange, resultCount }: FilterBarProps) {
  const handleDateChange = (dates: { from?: Date; to?: Date }) => {
    onFiltersChange({
      ...filters,
      dateRange: dates.from ? dates : undefined,
    });
  };

  const handleCategoryFiltersChange = (categoryFilters: {
    city?: string;
    isFree?: boolean;
    categories?: Category[];
  }) => {
    onFiltersChange({
      ...filters,
      ...categoryFilters,
    });
  };

  const removeFilter = (filterType: 'date' | 'city' | 'free' | Category) => {
    const newFilters = { ...filters };
    
    if (filterType === 'date') {
      delete newFilters.dateRange;
    } else if (filterType === 'city') {
      delete newFilters.city;
    } else if (filterType === 'free') {
      delete newFilters.isFree;
    } else {
      // Remove category
      newFilters.categories = newFilters.categories?.filter(c => c !== filterType);
      if (newFilters.categories?.length === 0) {
        delete newFilters.categories;
      }
    }
    
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const formatDateLabel = (dateRange: { from?: Date; to?: Date }) => {
    if (!dateRange.from) return '';
    
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric'
      }).format(date);
    };

    if (dateRange.from && dateRange.to && dateRange.from.getTime() !== dateRange.to.getTime()) {
      return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
    }
    
    return formatDate(dateRange.from);
  };

  const hasActiveFilters = 
    filters.dateRange || 
    filters.city || 
    filters.isFree || 
    (filters.categories && filters.categories.length > 0);

  return (
    <div className="bg-background border-b border-border sticky top-20 z-30">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Filter Controls */}
        <div className="flex items-center gap-3 mb-3">
          <DateFilterDropdown 
            onApply={handleDateChange}
            currentDates={filters.dateRange}
          />
          
          <CategoryFilterDropdown
            onApply={handleCategoryFiltersChange}
            currentFilters={{
              city: filters.city,
              isFree: filters.isFree,
              categories: filters.categories,
            }}
          />

          <div className="h-6 w-px bg-neutral-200" />

          <span className="text-sm text-neutral-600">
            {resultCount} event{resultCount !== 1 ? 's' : ''} found
          </span>

          {hasActiveFilters && (
            <>
              <div className="h-6 w-px bg-neutral-200" />
              <button
                onClick={clearAllFilters}
                className="text-sm text-teal-600 hover:text-teal-700 transition-colors"
              >
                Clear all
              </button>
            </>
          )}
        </div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            {filters.dateRange && (
              <Badge 
                variant="secondary"
                className="bg-teal-50 text-teal-700 border border-teal-200 gap-2 pr-1 hover:bg-teal-100 transition-colors"
              >
                <span>{formatDateLabel(filters.dateRange)}</span>
                <button
                  onClick={() => removeFilter('date')}
                  className="hover:bg-teal-200 rounded-full p-0.5 transition-colors"
                >
                  <X size={14} />
                </button>
              </Badge>
            )}

            {filters.city && (
              <Badge 
                variant="secondary"
                className="bg-teal-50 text-teal-700 border border-teal-200 gap-2 pr-1 hover:bg-teal-100 transition-colors"
              >
                <span>{filters.city}</span>
                <button
                  onClick={() => removeFilter('city')}
                  className="hover:bg-teal-200 rounded-full p-0.5 transition-colors"
                >
                  <X size={14} />
                </button>
              </Badge>
            )}

            {filters.isFree && (
              <Badge 
                variant="secondary"
                className="bg-teal-50 text-teal-700 border border-teal-200 gap-2 pr-1 hover:bg-teal-100 transition-colors"
              >
                <span>Free</span>
                <button
                  onClick={() => removeFilter('free')}
                  className="hover:bg-teal-200 rounded-full p-0.5 transition-colors"
                >
                  <X size={14} />
                </button>
              </Badge>
            )}

            {filters.categories?.map((category) => (
              <Badge 
                key={category}
                variant="secondary"
                className="bg-teal-50 text-teal-700 border border-teal-200 gap-2 pr-1 hover:bg-teal-100 transition-colors"
              >
                <span>{category}</span>
                <button
                  onClick={() => removeFilter(category)}
                  className="hover:bg-teal-200 rounded-full p-0.5 transition-colors"
                >
                  <X size={14} />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
