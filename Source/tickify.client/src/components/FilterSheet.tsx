import { Filter as FilterIcon, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import type { Filter, Category } from '../types';
import { categories, cities } from '../mockData';
import { useState } from 'react';

interface FilterSheetProps {
  filters: Filter;
  onApply: (filters: Filter) => void;
  children?: React.ReactNode;
}

export function FilterSheet({ filters, onApply, children }: FilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<Filter>(filters);
  const [priceRange, setPriceRange] = useState([0, 5000000]);

  const handleApply = () => {
    onApply({
      ...localFilters,
      minPrice: priceRange[0],
      maxPrice: priceRange[1]
    });
  };

  const handleReset = () => {
    const resetFilters: Filter = {};
    setLocalFilters(resetFilters);
    setPriceRange([0, 5000000]);
    onApply(resetFilters);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <FilterIcon size={16} className="mr-2" />
            Filters
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter Events</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <Label className="mb-2 block">City</Label>
            <Select
              value={localFilters.city || ''}
              onValueChange={(value) => setLocalFilters({ ...localFilters, city: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Category</Label>
            <Select
              value={localFilters.category || ''}
              onValueChange={(value) => setLocalFilters({ ...localFilters, category: value as Category })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Date</Label>
            <Select
              value={localFilters.date || ''}
              onValueChange={(value) => setLocalFilters({ ...localFilters, date: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any date</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-4 block">
              Price Range: {(priceRange[0] / 1000).toFixed(0)}K - {(priceRange[1] / 1000).toFixed(0)}K VND
            </Label>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              min={0}
              max={5000000}
              step={100000}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Reset
            </Button>
            <Button onClick={handleApply} className="flex-1 bg-orange-500 hover:bg-orange-600">
              Apply
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
