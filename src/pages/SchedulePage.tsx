import { useState, useEffect } from 'react';
import type { DayOfWeek } from '../types/schedule';
import type { Workout } from '../types/workout';
import { getAllWorkouts } from '../services/db';
import { getScheduleForDay, addWorkoutToDay, removeWorkoutFromDay, getOrCreateScheduleForDay } from '../services/db';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function SchedulePage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [schedules, setSchedules] = useState<Record<DayOfWeek, string[]>>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [showWorkoutSelect, setShowWorkoutSelect] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [allWorkouts, allSchedules] = await Promise.all([
        getAllWorkouts(),
        Promise.all(DAYS.map(day => getOrCreateScheduleForDay(day.key))),
      ]);

      setWorkouts(allWorkouts);

      const schedulesMap: Record<DayOfWeek, string[]> = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      };

      allSchedules.forEach(schedule => {
        schedulesMap[schedule.day] = schedule.workoutIds;
      });

      setSchedules(schedulesMap);
    } catch (error) {
      console.error('Failed to load schedule data:', error);
    }
  }

  async function handleAddWorkoutToDay(workoutId: string) {
    if (!selectedDay) return;

    try {
      await addWorkoutToDay(selectedDay, workoutId);
      await loadData();
      setSearchQuery('');
      setShowWorkoutSelect(false);
    } catch (error) {
      console.error('Failed to add workout to day:', error);
      alert('Failed to add workout to day');
    }
  }

  async function handleRemoveWorkoutFromDay(day: DayOfWeek, workoutId: string) {
    try {
      await removeWorkoutFromDay(day, workoutId);
      await loadData();
    } catch (error) {
      console.error('Failed to remove workout from day:', error);
      alert('Failed to remove workout from day');
    }
  }

  function getWorkoutById(id: string): Workout | undefined {
    return workouts.find(w => w.id === id);
  }

  const filteredWorkouts = workouts.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>Schedule</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {DAYS.map(({ key, label }) => {
          const dayWorkouts = schedules[key]
            .map(id => getWorkoutById(id))
            .filter(Boolean) as Workout[];

          return (
            <div
              key={key}
              style={{
                padding: 16,
                border: '1px solid #ddd',
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, textTransform: 'capitalize' }}>{label}</h3>
                <button
                  onClick={() => {
                    setSelectedDay(key);
                    setShowWorkoutSelect(true);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#111',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  + Add Workout
                </button>
              </div>

              {dayWorkouts.length === 0 ? (
                <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
                  No workouts scheduled. Click "Add Workout" to add one.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dayWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      style={{
                        padding: 12,
                        background: '#f9f9f9',
                        borderRadius: 6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{workout.name}</div>
                      <button
                        onClick={() => handleRemoveWorkoutFromDay(key, workout.id)}
                        style={{
                          padding: '4px 8px',
                          background: '#fee',
                          color: '#c00',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showWorkoutSelect && selectedDay && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
          onClick={() => {
            setShowWorkoutSelect(false);
            setSearchQuery('');
            setSelectedDay(null);
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 12,
              maxWidth: 500,
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>
              Add Workout to {DAYS.find(d => d.key === selectedDay)?.label}
            </h3>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workouts..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 16,
                marginBottom: 16,
                boxSizing: 'border-box',
              }}
              autoFocus
            />

            {filteredWorkouts.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>
                {searchQuery ? 'No workouts found' : 'No workouts available. Create workouts first.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '400px', overflow: 'auto' }}>
                {filteredWorkouts.map((workout) => {
                  const isAdded = schedules[selectedDay].includes(workout.id);
                  return (
                    <div
                      key={workout.id}
                      style={{
                        padding: 12,
                        border: '1px solid #ddd',
                        borderRadius: 6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        opacity: isAdded ? 0.6 : 1,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{workout.name}</div>
                      <button
                        onClick={() => handleAddWorkoutToDay(workout.id)}
                        disabled={isAdded}
                        style={{
                          padding: '6px 12px',
                          background: isAdded ? '#f3f3f3' : '#111',
                          color: isAdded ? '#999' : '#fff',
                          border: 'none',
                          borderRadius: 6,
                          cursor: isAdded ? 'not-allowed' : 'pointer',
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {isAdded ? 'Added' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowWorkoutSelect(false);
                  setSearchQuery('');
                  setSelectedDay(null);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f3f3f3',
                  color: '#111',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}