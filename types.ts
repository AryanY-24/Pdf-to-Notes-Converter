
// User Authentication Types
export interface User {
  email: string;
  name: string;
}

export enum AuthView {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
}

// Application Logic Types
export interface ProcessingOptions {
  extractIntroduction: boolean;
  extractSummary: boolean;
  extractConclusion: boolean;
  customKeywords: string;
  summarizationLevel: 'brief' | 'detailed';
}

export interface NoteResult {
  title: string;
  sections: {
    heading: string;
    content: string;
  }[];
  keywordsFound: string[];
  rawText?: string;
}

export interface SavedNote extends NoteResult {
  id: string;
  createdAt: number;
  readingTimeMinutes: number;
}

export interface AppSettings {
  autoSave: boolean;
  theme: 'light' | 'dark'; // Placeholder for future
}

// PDF.js Types (Global augmentation)
declare global {
  interface Window {
    pdfjsLib: any;
  }
}
