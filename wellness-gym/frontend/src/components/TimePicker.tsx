import type { TimeSlot } from '@/types';
import styles from '@/styles/components.module.css';

interface TimePickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
}

export function TimePicker({ slots, selectedSlot, onSlotSelect }: TimePickerProps) {
  if (slots.length === 0) {
    return (
      <p className={styles.footerText}>
        No times available for this date. Try another day.
      </p>
    );
  }

  return (
    <div 
      className={styles.timeGrid} 
      role="listbox" 
      aria-label="Select a time slot"
    >
      {slots.map((slot) => {
        const isSelected = selectedSlot?.id === slot.id;
        
        return (
          <button
            key={slot.id}
            className={`${styles.timeSlot} ${isSelected ? styles.timeSlotSelected : ''} ${!slot.available ? styles.timeSlotDisabled : ''}`}
            onClick={() => slot.available && onSlotSelect(slot)}
            disabled={!slot.available}
            role="option"
            aria-selected={isSelected}
            aria-disabled={!slot.available}
          >
            {slot.startTime}
          </button>
        );
      })}
    </div>
  );
}
