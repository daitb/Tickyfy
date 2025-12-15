import { useState, useRef, useEffect } from 'react';
import { Filter as FilterIcon, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import type { Category } from '../types';
import { useTranslation } from 'react-i18next';

interface CategoryFilterDropdownProps {
  onApply: (filters: {
    city?: string;
    isFree?: boolean;
    categories?: Category[];
  }) => void;
  currentFilters?: {
    city?: string;
    isFree?: boolean;
    categories?: Category[];
  };
}

const categoryOptions: Category[] = ['Music', 'Theater', 'Sports', 'Conference', 'Arts', 'Food & Drink'];

export function CategoryFilterDropdown({ onApply, currentFilters = {} }: CategoryFilterDropdownProps) {
  const { t } = useTranslation();
  
  const getCities = () => [
    t('categoryFilter.nationwide', 'Nationwide'),
    'Ho Chi Minh',
    'Hanoi',
    'Da Lat',
    t('categoryFilter.other', 'Other')
  ];
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(currentFilters.city || t('categoryFilter.nationwide', 'Nationwide'));
  const [isFree, setIsFree] = useState(currentFilters.isFree || false);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(currentFilters.categories || []);
  
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

  const handleCategoryToggle = (category: Category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleReset = () => {
    setSelectedCity(t('categoryFilter.nationwide', 'Nationwide'));
    setIsFree(false);
    setSelectedCategories([]);
  };

  const handleApply = () => {
    const nationwide = t('categoryFilter.nationwide', 'Nationwide');
    onApply({
      city: selectedCity === nationwide ? undefined : selectedCity,
      isFree: isFree || undefined,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    });
    setIsOpen(false);
  };

  const hasActiveFilter = 
    (selectedCity !== t('categoryFilter.nationwide', 'Nationwide')) || 
    isFree || 
    selectedCategories.length > 0;

  const getActiveFilterCount = () => {
    let count = 0;
    const nationwide = t('categoryFilter.nationwide', 'Nationwide');
    if (selectedCity !== nationwide) count++;
    if (isFree) count++;
    count += selectedCategories.length;
    return count;
  };

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
        <FilterIcon size={16} />
        <span>{t('categoryFilter.filter', 'Filter')}</span>
        {hasActiveFilter && (
          <Badge className="ml-1 bg-white text-teal-600 hover:bg-white text-xs px-1.5 py-0">
            {getActiveFilterCount()}
          </Badge>
        )}
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-2xl border border-neutral-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ width: '400px' }}
        >
          <div className="p-6 space-y-6">
            {/* Location Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="text-teal-500" size={18} />
                <h4 className="text-neutral-900">{t('categoryFilter.location', 'Location')}</h4>
              </div>
              <RadioGroup value={selectedCity} onValueChange={setSelectedCity}>
                <div className="space-y-2">
                  {getCities().map((city) => (
                    <div key={city} className="flex items-center space-x-2">
                      <RadioGroupItem value={city} id={`city-${city}`} />
                      <Label 
                        htmlFor={`city-${city}`}
                        className="cursor-pointer text-sm"
                      >
                        {city}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Price Section */}
            <div className="pt-4 border-t border-neutral-100">
              <h4 className="text-neutral-900 mb-3">{t('categoryFilter.price', 'Price')}</h4>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="free-events" 
                  checked={isFree}
                  onCheckedChange={(checked) => setIsFree(checked as boolean)}
                />
                <Label 
                  htmlFor="free-events"
                  className="cursor-pointer text-sm"
                >
                  {t('categoryFilter.freeEventsOnly', 'Free events only')}
                </Label>
              </div>
            </div>

            {/* Category Section */}
            <div className="pt-4 border-t border-neutral-100">
              <h4 className="text-neutral-900 mb-3">{t('categoryFilter.categories', 'Categories')}</h4>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((category) => {
                  const isSelected = selectedCategories.includes(category);
                  return (
                    <Badge
                      key={category}
                      variant={isSelected ? 'default' : 'secondary'}
                      className={`cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-teal-500 hover:bg-teal-600 text-white' 
                          : 'bg-neutral-100 hover:bg-neutral-200'
                      }`}
                      onClick={() => handleCategoryToggle(category)}
                    >
                      {category}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-teal-500 text-teal-600 hover:bg-teal-50"
              >
                {t('categoryFilter.reset', 'Reset')}
              </Button>
              <Button
                onClick={handleApply}
                className="bg-teal-500 hover:bg-teal-600 text-white"
              >
                {t('categoryFilter.apply', 'Apply')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
