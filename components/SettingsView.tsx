
import React, { useState } from 'react';
import { User } from '../types';
import Button from './Button';
import { storageService } from '../services/storageService';
import { Trash2, Download, Save, ShieldAlert, User as UserIcon } from 'lucide-react';
import * as FileSaver from 'file-saver';

// Handle FileSaver import robustness
const saveAs = (FileSaver as any).saveAs || (FileSaver as any).default || FileSaver;

interface SettingsViewProps {
  user: User;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onLogout }) => {
  const [settings, setSettings] = useState(storageService.getSettings());

  const handleBackup = () => {
    const data = storageService.exportData();
    const blob = new Blob([data], { type: "application/json;charset=utf-8" });
    saveAs(blob, `PDF_Notes_Backup_${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleClearData = () => {
    if (window.confirm("CRITICAL WARNING: This will delete ALL your saved notes permanently. This action cannot be undone. Are you sure?")) {
      storageService.clearAllNotes();
      alert("All data has been cleared.");
      // Force reload or re-render would be ideal, but simple alert suffices for now
    }
  };

  const handleSaveSettings = () => {
    storageService.saveSettings(settings);
    alert("Settings saved successfully.");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-500">Manage your account preferences and data.</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <UserIcon size={20} className="text-blue-600" /> Account
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" 
                value={user.name} 
                readOnly 
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input 
                type="text" 
                value={user.email} 
                readOnly 
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed" 
              />
            </div>
          </div>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={onLogout} className="text-red-600 border-red-200 hover:bg-red-50">
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Save size={20} className="text-blue-600" /> Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto-save Notes</h4>
              <p className="text-sm text-gray-500">Automatically save generated notes to your library.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.autoSave}
                onChange={(e) => setSettings({...settings, autoSave: e.target.checked})}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="pt-2">
            <Button size="sm" onClick={handleSaveSettings}>Save Preferences</Button>
          </div>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ShieldAlert size={20} className="text-blue-600" /> Data Management
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Backup Data</h4>
              <p className="text-sm text-gray-500">Download a JSON file of all your saved notes.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleBackup} className="bg-white">
              <Download size={16} /> Backup
            </Button>
          </div>

          <div className="p-4 bg-red-50 rounded-md border border-red-100 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-900">Danger Zone</h4>
              <p className="text-sm text-red-600">Permanently delete all saved notes and settings.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearData} className="bg-white text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300">
              <Trash2 size={16} /> Clear All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
