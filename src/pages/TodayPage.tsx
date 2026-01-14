import { useState, useEffect } from 'react';
import type { DayOfWeek } from '../types/schedule';
import type { Workout } from '../types/workout';
import type { Exercise } from '../types/exercise';
import { getOrCreateScheduleForDay } from '../services/db';
import { getAllWorkouts, getAllExercises } from '../services/db';

function getTodayDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = new Date().getDay();
  return days[dayIndex];
}

function getDayLabel(day: DayOfWeek): string {
  const labels: Record<DayOfWeek, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };
  return labels[day];
}

export default function TodayPage() {
  const [todayDay] = useState<DayOfWeek>(getTodayDayOfWeek());
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [todayWorkoutIds, setTodayWorkoutIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [breakTimerSeconds, setBreakTimerSeconds] = useState<number | null>(null);
  const [isBreakTimerRunning, setIsBreakTimerRunning] = useState(false);

  useEffect(() => {
    loadTodayWorkouts();
  }, []);

  async function loadTodayWorkouts() {
    try {
      setLoading(true);
      const [schedule, allWorkouts, allExercises] = await Promise.all([
        getOrCreateScheduleForDay(todayDay),
        getAllWorkouts(),
        getAllExercises(),
      ]);

      setTodayWorkoutIds(schedule.workoutIds);
      setWorkouts(allWorkouts);
      setExercises(allExercises);
    } catch (error) {
      console.error('Failed to load today\'s workouts:', error);
    } finally {
      setLoading(false);
    }
  }

  function getWorkoutById(id: string): Workout | undefined {
    return workouts.find(w => w.id === id);
  }

  function getExerciseById(id: string): Exercise | undefined {
    return exercises.find(e => e.id === id);
  }

  function formatTimer(seconds?: number): string {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
    return `${secs}s`;
  }

  function formatTimerDisplay(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function startWorkout(workout: Workout) {
    setActiveWorkout(workout);
    setCurrentExerciseIndex(0);
    setTimerSeconds(null);
    setIsTimerRunning(false);
    setIsBreakActive(false);
    setBreakTimerSeconds(null);
    setIsBreakTimerRunning(false);
  }

  function getCurrentExercise(): Exercise | undefined {
    if (!activeWorkout) return undefined;
    const exerciseId = activeWorkout.exerciseIds[currentExerciseIndex];
    return getExerciseById(exerciseId);
  }

  function handleStartExercise() {
    const exercise = getCurrentExercise();
    if (!exercise) return;

    if (exercise.timerDuration) {
      // Start timer
      setTimerSeconds(exercise.timerDuration);
      setIsTimerRunning(true);
    }
  }

  function handleNextExercise() {
    if (!activeWorkout) return;

    const nextIndex = currentExerciseIndex + 1;
    if (nextIndex >= activeWorkout.exerciseIds.length) {
      // Workout complete
      setActiveWorkout(null);
      setCurrentExerciseIndex(0);
      setTimerSeconds(null);
      setIsTimerRunning(false);
      setIsBreakActive(false);
      setBreakTimerSeconds(null);
      setIsBreakTimerRunning(false);
    } else {
      // Check if breaks are enabled and we're not already in a break
      if (activeWorkout.breakEnabled && activeWorkout.breakDuration && !isBreakActive) {
        // Start break before next exercise
        setIsBreakActive(true);
        setBreakTimerSeconds(activeWorkout.breakDuration);
        setIsBreakTimerRunning(true);
      } else {
        // Move to next exercise
        setCurrentExerciseIndex(nextIndex);
        setTimerSeconds(null);
        setIsTimerRunning(false);
        setIsBreakActive(false);
        setBreakTimerSeconds(null);
        setIsBreakTimerRunning(false);
      }
    }
  }

  function handlePreviousExercise() {
    if (!activeWorkout || currentExerciseIndex === 0) return;

    const prevIndex = currentExerciseIndex - 1;
    setCurrentExerciseIndex(prevIndex);
    setTimerSeconds(null);
    setIsTimerRunning(false);
    setIsBreakActive(false);
    setBreakTimerSeconds(null);
    setIsBreakTimerRunning(false);
  }

  function handleSkipBreak() {
    if (!activeWorkout) return;
    setIsBreakActive(false);
    setBreakTimerSeconds(null);
    setIsBreakTimerRunning(false);
    const nextIndex = currentExerciseIndex + 1;
    setCurrentExerciseIndex(nextIndex);
    setTimerSeconds(null);
    setIsTimerRunning(false);
  }

  // Exercise timer effect
  useEffect(() => {
    if (!isTimerRunning || timerSeconds === null || !activeWorkout) return;

    if (timerSeconds <= 0) {
      setIsTimerRunning(false);
      // Auto-advance to next exercise (which may trigger a break)
      const nextIndex = currentExerciseIndex + 1;
      if (nextIndex >= activeWorkout.exerciseIds.length) {
        // Workout complete
        setActiveWorkout(null);
        setCurrentExerciseIndex(0);
        setTimerSeconds(null);
        setIsTimerRunning(false);
        setIsBreakActive(false);
        setBreakTimerSeconds(null);
        setIsBreakTimerRunning(false);
      } else {
        // Check if breaks are enabled
        if (activeWorkout.breakEnabled && activeWorkout.breakDuration) {
          // Start break before next exercise
          setIsBreakActive(true);
          setBreakTimerSeconds(activeWorkout.breakDuration);
          setIsBreakTimerRunning(true);
        } else {
          // Move to next exercise
          setCurrentExerciseIndex(nextIndex);
          setTimerSeconds(null);
          setIsTimerRunning(false);
        }
      }
      return;
    }

    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev === null || prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, activeWorkout, currentExerciseIndex]);

  // Break timer effect
  useEffect(() => {
    if (!isBreakTimerRunning || breakTimerSeconds === null || !activeWorkout) return;

    if (breakTimerSeconds <= 0) {
      setIsBreakTimerRunning(false);
      setIsBreakActive(false);
      // Auto-advance to next exercise after break
      const nextIndex = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIndex);
      setTimerSeconds(null);
      setIsTimerRunning(false);
      setBreakTimerSeconds(null);
      return;
    }

    const interval = setInterval(() => {
      setBreakTimerSeconds(prev => {
        if (prev === null || prev <= 1) {
          setIsBreakTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreakTimerRunning, breakTimerSeconds, activeWorkout, currentExerciseIndex]);

  // Auto-start timer when exercise changes and has timer
  useEffect(() => {
    if (!activeWorkout) return;
    const exercise = getCurrentExercise();
    if (exercise?.timerDuration && timerSeconds === null && !isTimerRunning) {
      // Auto-start timer when entering exercise with timer
      setTimerSeconds(exercise.timerDuration);
      setIsTimerRunning(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExerciseIndex, activeWorkout]);

  const todayWorkouts = todayWorkoutIds
    .map(id => getWorkoutById(id))
    .filter(Boolean) as Workout[];

  if (loading) {
    return (
      <div>
        <h2 style={{ marginTop: 0 }}>Today</h2>
        <p>Loading...</p>
      </div>
    );
  }

  // Workout execution view
  if (activeWorkout) {
    const currentExercise = getCurrentExercise();
    const workoutExercises = activeWorkout.exerciseIds
      .map(id => getExerciseById(id))
      .filter(Boolean) as Exercise[];
    const progress = ((currentExerciseIndex + 1) / workoutExercises.length) * 100;

    // Break screen
    if (isBreakActive && breakTimerSeconds !== null) {
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ marginTop: 0, marginBottom: 0 }}>Break Time</h2>
            <button
              onClick={() => {
                setActiveWorkout(null);
                setCurrentExerciseIndex(0);
                setTimerSeconds(null);
                setIsTimerRunning(false);
                setIsBreakActive(false);
                setBreakTimerSeconds(null);
                setIsBreakTimerRunning(false);
              }}
              style={{
                padding: '6px 12px',
                background: '#f3f3f3',
                color: '#111',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Exit
            </button>
          </div>

          <div
            style={{
              padding: 32,
              border: '2px solid #0a0',
              borderRadius: 12,
              textAlign: 'center',
              background: '#f0fff0',
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 28, color: '#0a0' }}>
              Take a Break
            </h3>
            <div style={{ fontSize: 64, fontWeight: 700, color: '#0a0', marginBottom: 24 }}>
              {formatTimerDisplay(breakTimerSeconds)}
            </div>
            <p style={{ color: '#666', fontSize: 16, marginBottom: 24 }}>
              Next exercise starting soon...
            </p>
            <button
              onClick={handleSkipBreak}
              style={{
                padding: '12px 24px',
                background: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Skip Break
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ marginTop: 0, marginBottom: 0 }}>{activeWorkout.name}</h2>
          <button
            onClick={() => {
              setActiveWorkout(null);
              setCurrentExerciseIndex(0);
              setTimerSeconds(null);
              setIsTimerRunning(false);
              setIsBreakActive(false);
              setBreakTimerSeconds(null);
              setIsBreakTimerRunning(false);
            }}
            style={{
              padding: '6px 12px',
              background: '#f3f3f3',
              color: '#111',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Exit
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#666' }}>
              Exercise {currentExerciseIndex + 1} of {workoutExercises.length}
            </span>
            <span style={{ fontSize: 14, color: '#666' }}>
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div style={{ width: '100%', height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: '#111',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {currentExercise ? (
          <div
            style={{
              padding: 32,
              border: '2px solid #111',
              borderRadius: 12,
              textAlign: 'center',
              background: '#fff',
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 28 }}>
              {currentExercise.name}
            </h3>

            {currentExercise.timerDuration ? (
              <div style={{ marginBottom: 24 }}>
                {timerSeconds !== null && isTimerRunning ? (
                  <div style={{ fontSize: 48, fontWeight: 700, color: '#111', marginBottom: 8 }}>
                    {formatTimerDisplay(timerSeconds)}
                  </div>
                ) : timerSeconds !== null && timerSeconds === 0 ? (
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#0a0', marginBottom: 8 }}>
                    Time's up!
                  </div>
                ) : (
                  <div style={{ fontSize: 20, color: '#666', marginBottom: 8 }}>
                    Timer: {formatTimer(currentExercise.timerDuration)}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: '#666', fontSize: 16, marginBottom: 24 }}>
                No timer - click Next when ready
              </p>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {currentExerciseIndex > 0 && (
                <button
                  onClick={handlePreviousExercise}
                  style={{
                    padding: '12px 24px',
                    background: '#f3f3f3',
                    color: '#111',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ← Previous Exercise
                </button>
              )}
              {currentExercise.timerDuration && timerSeconds === null && !isTimerRunning && (
                <button
                  onClick={handleStartExercise}
                  style={{
                    padding: '12px 24px',
                    background: '#111',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Start Timer
                </button>
              )}
              <button
                onClick={handleNextExercise}
                style={{
                  padding: '12px 24px',
                  background: currentExercise.timerDuration && isTimerRunning ? '#f3f3f3' : '#111',
                  color: currentExercise.timerDuration && isTimerRunning ? '#111' : '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {currentExerciseIndex + 1 >= workoutExercises.length ? 'Finish Workout' : 'Next Exercise →'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p>Exercise not found</p>
            <button
              onClick={() => {
                setActiveWorkout(null);
                setCurrentExerciseIndex(0);
              }}
              style={{
                padding: '10px 20px',
                background: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Back to Today
            </button>
          </div>
        )}
      </div>
    );
  }

  // Today's workouts list view
  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 4 }}>Today</h2>
      <p style={{ color: '#666', fontSize: 14, marginTop: 0, marginBottom: 20 }}>
        {getDayLabel(todayDay)}'s Workouts
      </p>

      {todayWorkouts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: '#666', marginBottom: 8 }}>
            No workouts scheduled for today.
          </p>
          <p style={{ color: '#999', fontSize: 14 }}>
            Go to the Schedule page to add workouts for {getDayLabel(todayDay)}.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {todayWorkouts.map((workout) => {
            const workoutExercises = workout.exerciseIds
              .map(id => getExerciseById(id))
              .filter(Boolean) as Exercise[];

            return (
              <div
                key={workout.id}
                style={{
                  padding: 20,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  background: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ marginTop: 0, marginBottom: 0, fontSize: 20 }}>
                    {workout.name}
                  </h3>
                  <button
                    onClick={() => startWorkout(workout)}
                    style={{
                      padding: '8px 16px',
                      background: '#111',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Start Workout
                  </button>
                </div>

                {workoutExercises.length === 0 ? (
                  <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
                    No exercises in this workout.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {workoutExercises.map((exercise, index) => (
                      <div
                        key={exercise.id}
                        style={{
                          padding: 16,
                          background: '#f9f9f9',
                          borderRadius: 6,
                          border: '1px solid #eee',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                              {index + 1}. {exercise.name}
                            </div>
                            {exercise.timerDuration && (
                              <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                                ⏱️ Timer: {formatTimer(exercise.timerDuration)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}