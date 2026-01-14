import { useState, useEffect } from 'react';
import type { Workout } from '../types/workout';
import type { Exercise } from '../types/exercise';
import { addWorkout, getAllWorkouts, updateWorkout, deleteWorkout, getAllExercises } from '../services/db';

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [breakEnabled, setBreakEnabled] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState('');
  const [breakSeconds, setBreakSeconds] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [editingBreakSettings, setEditingBreakSettings] = useState<Workout | null>(null);

  useEffect(() => {
    loadWorkouts();
    loadExercises();
  }, []);

  async function loadWorkouts() {
    try {
      const allWorkouts = await getAllWorkouts();
      setWorkouts(allWorkouts);
    } catch (error) {
      console.error('Failed to load workouts:', error);
    }
  }

  async function loadExercises() {
    try {
      const allExercises = await getAllExercises();
      setExercises(allExercises);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    }
  }

  async function handleAddWorkout(e: React.FormEvent) {
    e.preventDefault();
    
    if (!workoutName.trim()) {
      alert('Please enter a workout name');
      return;
    }

    let breakDuration: number | undefined;
    if (breakEnabled) {
      const mins = parseInt(breakMinutes) || 0;
      const secs = parseInt(breakSeconds) || 0;
      breakDuration = mins * 60 + secs;
      if (breakDuration <= 0) {
        alert('Break duration must be greater than 0');
        return;
      }
    }

    try {
      console.log('Adding workout:', workoutName.trim());
      const result = await addWorkout({
        name: workoutName.trim(),
        exerciseIds: [],
        breakEnabled,
        breakDuration,
      });
      console.log('Workout added successfully:', result);
      setWorkoutName('');
      setBreakEnabled(false);
      setBreakMinutes('');
      setBreakSeconds('');
      setShowAddForm(false);
      await loadWorkouts();
      console.log('Workouts reloaded');
      
      // Automatically open exercise search for the newly created workout
      setSelectedWorkout(result);
      setShowExerciseSearch(true);
    } catch (error) {
      console.error('Failed to add workout:', error);
      alert(`Failed to add workout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function handleUpdateBreakSettings(workout: Workout) {
    let breakDuration: number | undefined;
    if (breakEnabled) {
      const mins = parseInt(breakMinutes) || 0;
      const secs = parseInt(breakSeconds) || 0;
      breakDuration = mins * 60 + secs;
      if (breakDuration <= 0) {
        alert('Break duration must be greater than 0');
        return;
      }
    }

    try {
      await updateWorkout(workout.id, {
        breakEnabled,
        breakDuration,
      });
      setEditingBreakSettings(null);
      setBreakEnabled(false);
      setBreakMinutes('');
      setBreakSeconds('');
      loadWorkouts();
    } catch (error) {
      console.error('Failed to update break settings:', error);
      alert('Failed to update break settings');
    }
  }

  function startEditBreakSettings(workout: Workout) {
    setEditingBreakSettings(workout);
    setBreakEnabled(workout.breakEnabled || false);
    if (workout.breakDuration) {
      const mins = Math.floor(workout.breakDuration / 60);
      const secs = workout.breakDuration % 60;
      setBreakMinutes(mins > 0 ? mins.toString() : '');
      setBreakSeconds(secs > 0 ? secs.toString() : '');
    } else {
      setBreakMinutes('');
      setBreakSeconds('');
    }
  }

  async function handleAddExerciseToWorkout(exerciseId: string) {
    if (!selectedWorkout) return;

    if (selectedWorkout.exerciseIds.includes(exerciseId)) {
      alert('Exercise already added to this workout');
      return;
    }

    try {
      await updateWorkout(selectedWorkout.id, {
        exerciseIds: [...selectedWorkout.exerciseIds, exerciseId],
      });
      setSearchQuery('');
      setShowExerciseSearch(false);
      loadWorkouts();
      // Update selected workout to reflect changes
      const updated = await getAllWorkouts();
      const updatedWorkout = updated.find(w => w.id === selectedWorkout.id);
      if (updatedWorkout) setSelectedWorkout(updatedWorkout);
    } catch (error) {
      console.error('Failed to add exercise to workout:', error);
      alert('Failed to add exercise to workout');
    }
  }

  async function handleRemoveExerciseFromWorkout(exerciseId: string) {
    if (!selectedWorkout) return;

    try {
      await updateWorkout(selectedWorkout.id, {
        exerciseIds: selectedWorkout.exerciseIds.filter(id => id !== exerciseId),
      });
      loadWorkouts();
      // Update selected workout to reflect changes
      const updated = await getAllWorkouts();
      const updatedWorkout = updated.find(w => w.id === selectedWorkout.id);
      if (updatedWorkout) setSelectedWorkout(updatedWorkout);
    } catch (error) {
      console.error('Failed to remove exercise from workout:', error);
      alert('Failed to remove exercise from workout');
    }
  }

  async function handleDeleteWorkout(id: string) {
    if (confirm('Are you sure you want to delete this workout?')) {
      try {
        await deleteWorkout(id);
        if (selectedWorkout?.id === id) {
          setSelectedWorkout(null);
        }
        loadWorkouts();
      } catch (error) {
        console.error('Failed to delete workout:', error);
        alert('Failed to delete workout');
      }
    }
  }

  function getExerciseById(id: string): Exercise | undefined {
    return exercises.find(ex => ex.id === id);
  }

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Workouts</h2>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '8px 16px',
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Create Workout
        </button>
      </div>

      {showAddForm && (
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
            zIndex: 1000,
          }}
          onClick={() => {
            setShowAddForm(false);
            setWorkoutName('');
            setBreakEnabled(false);
            setBreakMinutes('');
            setBreakSeconds('');
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 12,
              maxWidth: 400,
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Create Workout</h3>
            <form onSubmit={handleAddWorkout}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Workout Name *
                </label>
                <input
                  type="text"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder="e.g., Push, Pull, Legs"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    fontSize: 16,
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={breakEnabled}
                    onChange={(e) => setBreakEnabled(e.target.checked)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 600 }}>Enable breaks between exercises</span>
                </label>
                {breakEnabled && (
                  <div style={{ marginTop: 12, marginLeft: 26 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                      Break Duration
                    </label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="number"
                        value={breakMinutes}
                        onChange={(e) => setBreakMinutes(e.target.value)}
                        placeholder="Min"
                        min="0"
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          fontSize: 16,
                        }}
                      />
                      <span>:</span>
                      <input
                        type="number"
                        value={breakSeconds}
                        onChange={(e) => setBreakSeconds(e.target.value)}
                        placeholder="Sec"
                        min="0"
                        max="59"
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          fontSize: 16,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setWorkoutName('');
                    setBreakEnabled(false);
                    setBreakMinutes('');
                    setBreakSeconds('');
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
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: '#111',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {workouts.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '40px 0' }}>
          No workouts yet. Click "Create Workout" to create your first workout.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {workouts.map((workout) => (
            <div
              key={workout.id}
              style={{
                padding: 16,
                border: '1px solid #ddd',
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>{workout.name}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      setSelectedWorkout(workout);
                      setShowExerciseSearch(true);
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
                    + Add Exercise
                  </button>
                  <button
                    onClick={() => handleDeleteWorkout(workout.id)}
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
                    Delete
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 12, padding: 12, background: '#f9f9f9', borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Break Settings</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {workout.breakEnabled && workout.breakDuration
                        ? `Break: ${Math.floor(workout.breakDuration / 60)}m ${workout.breakDuration % 60}s between exercises`
                        : 'No breaks between exercises'}
                    </div>
                  </div>
                  <button
                    onClick={() => startEditBreakSettings(workout)}
                    style={{
                      padding: '6px 12px',
                      background: '#111',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Edit Breaks
                  </button>
                </div>
              </div>

              {workout.exerciseIds.length === 0 ? (
                <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
                  No exercises added yet. Click "Add Exercise" to add exercises.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {workout.exerciseIds.map((exerciseId) => {
                    const exercise = getExerciseById(exerciseId);
                    if (!exercise) return null;
                    return (
                      <div
                        key={exerciseId}
                        style={{
                          padding: 12,
                          background: '#f9f9f9',
                          borderRadius: 6,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{exercise.name}</div>
                          {exercise.timerDuration && (
                            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                              Timer: {Math.floor(exercise.timerDuration / 60)}m {exercise.timerDuration % 60}s
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveExerciseFromWorkout(exerciseId)}
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
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showExerciseSearch && selectedWorkout && (
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
            setShowExerciseSearch(false);
            setSearchQuery('');
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
            <h3 style={{ marginTop: 0 }}>Add Exercise to {selectedWorkout.name}</h3>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises..."
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

            {filteredExercises.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>
                {searchQuery ? 'No exercises found' : 'No exercises available. Create exercises first.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '400px', overflow: 'auto' }}>
                {filteredExercises.map((exercise) => {
                  const isAdded = selectedWorkout.exerciseIds.includes(exercise.id);
                  return (
                    <div
                      key={exercise.id}
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
                      <div>
                        <div style={{ fontWeight: 600 }}>{exercise.name}</div>
                        {exercise.timerDuration && (
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                            Timer: {Math.floor(exercise.timerDuration / 60)}m {exercise.timerDuration % 60}s
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddExerciseToWorkout(exercise.id)}
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
                  setShowExerciseSearch(false);
                  setSearchQuery('');
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

      {editingBreakSettings && (
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
            zIndex: 1002,
          }}
          onClick={() => {
            setEditingBreakSettings(null);
            setBreakEnabled(false);
            setBreakMinutes('');
            setBreakSeconds('');
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 12,
              maxWidth: 400,
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Edit Break Settings</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateBreakSettings(editingBreakSettings);
            }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={breakEnabled}
                    onChange={(e) => setBreakEnabled(e.target.checked)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 600 }}>Enable breaks between exercises</span>
                </label>
                {breakEnabled && (
                  <div style={{ marginTop: 12, marginLeft: 26 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                      Break Duration
                    </label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="number"
                        value={breakMinutes}
                        onChange={(e) => setBreakMinutes(e.target.value)}
                        placeholder="Min"
                        min="0"
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          fontSize: 16,
                        }}
                      />
                      <span>:</span>
                      <input
                        type="number"
                        value={breakSeconds}
                        onChange={(e) => setBreakSeconds(e.target.value)}
                        placeholder="Sec"
                        min="0"
                        max="59"
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          fontSize: 16,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingBreakSettings(null);
                    setBreakEnabled(false);
                    setBreakMinutes('');
                    setBreakSeconds('');
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
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: '#111',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}