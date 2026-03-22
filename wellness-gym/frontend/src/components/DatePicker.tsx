import { useMemo } from 'react';
import styles from '@/styles/components.module.css';

interface DatePickerProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  availableDates?: string[];
}

export function DatePicker({ 
  selectedDate, 
  onDateSelect, 
  availableDates 
}: DatePickerProps) {
  const dates = useMemo(() => {
    const result: Array<{
      date: string;
      day: string;
      num: number;
      month: string;
    }> = [];
    
    const today = new Date();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      result.push({
        date: date.toISOString().split('T')[0],
        day: daysOfWeek[date.getDay()],
        num: date.getDate(),
        month: months[date.getMonth()],
      });
    }
    
    return result;
  }, []);

  const isAvailable = (dateStr: string): boolean => {
    if (!availableDates || availableDates.length === 0) return true;
    return availableDates.includes(dateStr);
  };

  return (
    <div className={styles.datePicker} role="listbox" aria-label="Select a date">
      {dates.map((date) => {
        const available = isAvailable(date.date);
        const isSelected = selectedDate === date.date;
        
        return (
          <button
            key={date.date}
            className={`${styles.dateOption} ${isSelected ? styles.dateOptionSelected : ''}`}
            onClick={() => available && onDateSelect(date.date)}
            disabled={!available}
            role="option"
            aria-selected={isSelected}
            aria-disabled={!available}
          >
            <span className={styles.dateDay}>{date.day}</span>
            <span className={styles.dateNum}>{date.num}</span>
            <span className={styles.dateMonth}>{date.month}</span>
          </button>
        );
      })}
    </div>
  );
}
