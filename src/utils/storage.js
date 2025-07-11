const STORAGE_KEY = 'tasktracker_tasks';

export const loadTasksFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading tasks from storage:', error);
    return [];
  }
};

export const saveTasksToStorage = (tasks) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks to storage:', error);
  }
};

export const clearStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};