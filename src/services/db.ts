import type { Exercise } from '../types/exercise';
import type { Workout } from '../types/workout';
import type { Schedule, DayOfWeek } from '../types/schedule';

const DB_NAME = 'GymnDB';
const DB_VERSION = 3;
const EXERCISE_STORE = 'exercises';
const WORKOUT_STORE = 'workouts';
const SCHEDULE_STORE = 'schedules';

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      db = request.result;
      console.log('IndexedDB opened successfully, version:', db.version);
      console.log('Object stores:', Array.from(db.objectStoreNames));
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      console.log('IndexedDB upgrade needed');
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(EXERCISE_STORE)) {
        console.log('Creating exercises store');
        const objectStore = database.createObjectStore(EXERCISE_STORE, {
          keyPath: 'id',
          autoIncrement: false,
        });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      
      if (!database.objectStoreNames.contains(WORKOUT_STORE)) {
        console.log('Creating workouts store');
        const objectStore = database.createObjectStore(WORKOUT_STORE, {
          keyPath: 'id',
          autoIncrement: false,
        });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      
      if (!database.objectStoreNames.contains(SCHEDULE_STORE)) {
        console.log('Creating schedules store');
        const objectStore = database.createObjectStore(SCHEDULE_STORE, {
          keyPath: 'id',
          autoIncrement: false,
        });
        objectStore.createIndex('day', 'day', { unique: false });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onblocked = () => {
      console.warn('IndexedDB upgrade blocked - close other tabs');
    };
  });
}

export async function addExercise(exercise: Omit<Exercise, 'id' | 'createdAt'>): Promise<Exercise> {
  const database = await initDB();
  const newExercise: Exercise = {
    ...exercise,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([EXERCISE_STORE], 'readwrite');
    const store = transaction.objectStore(EXERCISE_STORE);
    const request = store.add(newExercise);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(newExercise);
  });
}

export async function getAllExercises(): Promise<Exercise[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([EXERCISE_STORE], 'readonly');
    const store = transaction.objectStore(EXERCISE_STORE);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

export async function updateExercise(id: string, updates: Partial<Omit<Exercise, 'id' | 'createdAt'>>): Promise<Exercise> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([EXERCISE_STORE], 'readwrite');
    const store = transaction.objectStore(EXERCISE_STORE);
    const getRequest = store.get(id);

    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      const exercise = getRequest.result;
      if (!exercise) {
        reject(new Error('Exercise not found'));
        return;
      }

      const updatedExercise: Exercise = {
        ...exercise,
        ...updates,
      };

      const putRequest = store.put(updatedExercise);
      putRequest.onerror = () => reject(putRequest.error);
      putRequest.onsuccess = () => resolve(updatedExercise);
    };
  });
}

export async function deleteExercise(id: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([EXERCISE_STORE], 'readwrite');
    const store = transaction.objectStore(EXERCISE_STORE);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Workout functions
export async function addWorkout(workout: Omit<Workout, 'id' | 'createdAt'>): Promise<Workout> {
  const database = await initDB();
  
  // Check if workouts store exists
  if (!database.objectStoreNames.contains(WORKOUT_STORE)) {
    throw new Error('Workouts store does not exist. Please refresh the page to upgrade the database.');
  }
  
  const newWorkout: Workout = {
    ...workout,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    try {
      const transaction = database.transaction([WORKOUT_STORE], 'readwrite');
      const store = transaction.objectStore(WORKOUT_STORE);
      const request = store.add(newWorkout);

      request.onerror = () => {
        console.error('IndexedDB add error:', request.error);
        reject(request.error || new Error('Failed to add workout'));
      };
      request.onsuccess = () => {
        console.log('Workout added to IndexedDB:', newWorkout);
        resolve(newWorkout);
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      reject(error);
    }
  });
}

export async function getAllWorkouts(): Promise<Workout[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([WORKOUT_STORE], 'readonly');
    const store = transaction.objectStore(WORKOUT_STORE);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

export async function updateWorkout(id: string, updates: Partial<Omit<Workout, 'id' | 'createdAt'>>): Promise<Workout> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([WORKOUT_STORE], 'readwrite');
    const store = transaction.objectStore(WORKOUT_STORE);
    const getRequest = store.get(id);

    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      const workout = getRequest.result;
      if (!workout) {
        reject(new Error('Workout not found'));
        return;
      }

      const updatedWorkout: Workout = {
        ...workout,
        ...updates,
      };

      const putRequest = store.put(updatedWorkout);
      putRequest.onerror = () => reject(putRequest.error);
      putRequest.onsuccess = () => resolve(updatedWorkout);
    };
  });
}

export async function deleteWorkout(id: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([WORKOUT_STORE], 'readwrite');
    const store = transaction.objectStore(WORKOUT_STORE);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Schedule functions
export async function getScheduleForDay(day: DayOfWeek): Promise<Schedule | null> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SCHEDULE_STORE], 'readonly');
    const store = transaction.objectStore(SCHEDULE_STORE);
    const index = store.index('day');
    const request = index.getAll(day);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const schedules = request.result;
      resolve(schedules && schedules.length > 0 ? schedules[0] : null);
    };
  });
}

export async function getAllSchedules(): Promise<Schedule[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SCHEDULE_STORE], 'readonly');
    const store = transaction.objectStore(SCHEDULE_STORE);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

export async function getOrCreateScheduleForDay(day: DayOfWeek): Promise<Schedule> {
  const existing = await getScheduleForDay(day);
  if (existing) return existing;

  const database = await initDB();
  const newSchedule: Schedule = {
    id: crypto.randomUUID(),
    day,
    workoutIds: [],
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SCHEDULE_STORE], 'readwrite');
    const store = transaction.objectStore(SCHEDULE_STORE);
    const request = store.add(newSchedule);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(newSchedule);
  });
}

export async function updateScheduleForDay(day: DayOfWeek, workoutIds: string[]): Promise<Schedule> {
  const schedule = await getOrCreateScheduleForDay(day);
  const database = await initDB();

  const updatedSchedule: Schedule = {
    ...schedule,
    workoutIds,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SCHEDULE_STORE], 'readwrite');
    const store = transaction.objectStore(SCHEDULE_STORE);
    const request = store.put(updatedSchedule);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(updatedSchedule);
  });
}

export async function addWorkoutToDay(day: DayOfWeek, workoutId: string): Promise<Schedule> {
  const schedule = await getOrCreateScheduleForDay(day);
  
  if (schedule.workoutIds.includes(workoutId)) {
    return schedule; // Already added
  }

  return updateScheduleForDay(day, [...schedule.workoutIds, workoutId]);
}

export async function removeWorkoutFromDay(day: DayOfWeek, workoutId: string): Promise<Schedule> {
  const schedule = await getOrCreateScheduleForDay(day);
  return updateScheduleForDay(day, schedule.workoutIds.filter(id => id !== workoutId));
}
