import { useState, useEffect } from 'react';
import type { Exercise } from '../types/exercise';
import { addExercise, getAllExercises, deleteExercise, updateExercise } from '../services/db';

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exerciseName, setExerciseName] = useState('');
  const [timerMinutes, setTimerMinutes] = useState('');
  const [timerSeconds, setTimerSeconds] = useState('');

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    try {
      const allExercises = await getAllExercises();
      setExercises(allExercises);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    }
  }

  function resetForm() {
    setExerciseName('');
    setTimerMinutes('');
    setTimerSeconds('');
    setShowAddForm(false);
    setEditingExercise(null);
  }

  function startEdit(exercise: Exercise) {
    setEditingExercise(exercise);
    setExerciseName(exercise.name);
    if (exercise.timerDuration) {
      const mins = Math.floor(exercise.timerDuration / 60);
      const secs = exercise.timerDuration % 60;
      setTimerMinutes(mins > 0 ? mins.toString() : '');
      setTimerSeconds(secs > 0 ? secs.toString() : '');
    } else {
      setTimerMinutes('');
      setTimerSeconds('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!exerciseName.trim()) {
      alert('Please enter an exercise name');
      return;
    }

    let timerDuration: number | undefined;
    if (timerMinutes || timerSeconds) {
      const mins = parseInt(timerMinutes) || 0;
      const secs = parseInt(timerSeconds) || 0;
      timerDuration = mins * 60 + secs;
      if (timerDuration <= 0) {
        alert('Timer duration must be greater than 0');
        return;
      }
    }

    try {
      if (editingExercise) {
        await updateExercise(editingExercise.id, {
          name: exerciseName.trim(),
          timerDuration,
        });
      } else {
        await addExercise({
          name: exerciseName.trim(),
          timerDuration,
        });
      }
      resetForm();
      loadExercises();
    } catch (error) {
      console.error(`Failed to ${editingExercise ? 'update' : 'add'} exercise:`, error);
      alert(`Failed to ${editingExercise ? 'update' : 'add'} exercise`);
    }
  }

  async function handleDeleteExercise(id: string) {
    if (confirm('Are you sure you want to delete this exercise?')) {
      try {
        await deleteExercise(id);
        loadExercises();
      } catch (error) {
        console.error('Failed to delete exercise:', error);
        alert('Failed to delete exercise');
      }
    }
  }

  function formatTimer(seconds?: number): string {
    if (!seconds) return 'No timer';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
    return `${secs}s`;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Exercises</h2>
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
          + Add
        </button>
      </div>

      {(showAddForm || editingExercise) && (
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
          onClick={resetForm}
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
            <h3 style={{ marginTop: 0 }}>{editingExercise ? 'Edit Exercise' : 'Add Exercise'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Exercise Name *
                </label>
                <input
                  type="text"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  placeholder="e.g., Push-ups"
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
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Timer (Optional)
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(e.target.value)}
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
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(e.target.value)}
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
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  Leave empty if no timer needed
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={resetForm}
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
                  {editingExercise ? 'Save Changes' : 'Add Exercise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {exercises.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '40px 0' }}>
          No exercises yet. Click "Add" to create your first exercise.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              style={{
                padding: 16,
                border: '1px solid #ddd',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{exercise.name}</div>
                <div style={{ fontSize: 14, color: '#666' }}>
                  Timer: {formatTimer(exercise.timerDuration)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => startEdit(exercise)}
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
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteExercise(exercise.id)}
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
          ))}
        </div>
      )}
    </div>
  );
}