declare module 'react-date-range' {
  import * as React from 'react';

  export interface Range {
    startDate: Date;
    endDate: Date;
    key: string;
    color?: string;
    autoFocus?: boolean;
    disabled?: boolean;
    showDateDisplay?: boolean;
  }

  export interface DateRangePickerProps {
    ranges: Range[];
    onChange: (item: any) => void;
    months?: number;
    direction?: 'horizontal' | 'vertical';
    showDateDisplay?: boolean;
    rangeColors?: string[];
    color?: string;
    moveRangeOnFirstSelection?: boolean;
    retainEndDateOnFirstSelection?: boolean;
    editableDateInputs?: boolean;
    dragSelectionEnabled?: boolean;
    fixedHeight?: boolean;
    calendarFocus?: string;
    preventSnapRefocus?: boolean;
    minDate?: Date;
    maxDate?: Date;
    weekStartsOn?: number;
  }

  export const DateRangePicker: React.FC<DateRangePickerProps>;

  export interface CalendarProps {
    date?: Date;
    onChange?: (date: Date) => void;
    minDate?: Date;
    maxDate?: Date;
    showMonthAndYearPickers?: boolean;
    showMonthArrow?: boolean;
    showDateDisplay?: boolean;
    color?: string;
    weekStartsOn?: number;
  }

  export const Calendar: React.FC<CalendarProps>;
}
