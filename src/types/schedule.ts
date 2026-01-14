export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type Schedule = {
  id: string;
  day: DayOfWeek;
  workoutIds: string[]; // Array of workout IDs for this day
  createdAt: number;
};
