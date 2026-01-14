export type Workout = {
  id: string;
  name: string;
  exerciseIds: string[]; // Array of exercise IDs
  breakEnabled: boolean; // Whether breaks are enabled between exercises
  breakDuration?: number; // Break duration in seconds
  createdAt: number;
};
