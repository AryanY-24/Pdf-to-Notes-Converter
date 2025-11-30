
import React, { useState, useEffect } from 'react';
import { SavedNote } from '../types';
import { storageService } from '../services/storageService';
import Button from './Button';
import { Trash2, Eye, Calendar, Clock, Search, FileText } from 'lucide-react';

interface LibraryProps {
  onLoadNote: (note: SavedNote) => void;
}

const Library: React.FC<LibraryProps> = ({ onLoadNote }) => {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    setNotes(storageService.getNotes());
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      storageService.deleteNote(id);
      loadNotes();
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.keywordsFound.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Library</h2>
          <p className="text-gray-500">Manage your saved notes and summaries.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="inline-block p-4 bg-white rounded-full shadow-sm mb-4">
            <FileText size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No notes found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try a different search term.' : 'Generate and save some notes to see them here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div 
              key={note.id} 
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight" title={note.title}>
                    {note.title}
                  </h3>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {note.keywordsFound.slice(0, 3).map((k, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
                      #{k}
                    </span>
                  ))}
                  {note.keywordsFound.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">
                      +{note.keywordsFound.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(note.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {note.readingTimeMinutes} min read
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center">
                <button 
                  onClick={() => onLoadNote(note)}
                  className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Eye size={16} /> View Note
                </button>
                <button 
                  onClick={(e) => handleDelete(note.id, e)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                  title="Delete Note"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
