
import { SavedNote, AppSettings } from '../types';

const STORAGE_KEYS = {
  NOTES: 'pdf_notes_library',
  SETTINGS: 'pdf_notes_settings',
};

export const storageService = {
  // Notes Management
  getNotes: (): SavedNote[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTES);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load notes", e);
      return [];
    }
  },

  saveNote: (note: Omit<SavedNote, 'id' | 'createdAt'>): SavedNote => {
    const notes = storageService.getNotes();
    const newNote: SavedNote = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    
    // Add to beginning of list
    const updatedNotes = [newNote, ...notes];
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updatedNotes));
    return newNote;
  },

  deleteNote: (id: string) => {
    const notes = storageService.getNotes();
    const updatedNotes = notes.filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updatedNotes));
  },

  clearAllNotes: () => {
    localStorage.removeItem(STORAGE_KEYS.NOTES);
  },

  // Settings Management
  getSettings: (): AppSettings => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? JSON.parse(stored) : { autoSave: false, theme: 'light' };
    } catch (e) {
      return { autoSave: false, theme: 'light' };
    }
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Export/Backup
  exportData: () => {
    const data = {
      notes: storageService.getNotes(),
      settings: storageService.getSettings(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }
};
