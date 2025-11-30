
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { User, ProcessingOptions, NoteResult, SavedNote } from '../types';
import Button from './Button';
import Library from './Library';
import SettingsView from './SettingsView';
import { storageService } from '../services/storageService';
import { 
  Upload, FileText, Settings, Download, Loader2, CheckCircle2, 
  LogOut, X, BarChart3, Home, Library as LibraryIcon, 
  Volume2, StopCircle, Clock, Copy, Check, Save, Sliders, Info
} from 'lucide-react';
import { extractTextFromPDF } from '../services/pdfService';
import { generateNotes } from '../services/geminiService';
import { exportToPDF, exportToWord, exportToText, exportToJSON } from '../utils/exportUtils';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type ViewState = 'home' | 'library' | 'settings';

// Helper component for highlighting text with differentiation and pronunciation guides
const HighlightedContent: React.FC<{ 
  text: string; 
  userKeywords: string[]; 
  aiKeywords: string[];
  showGuides: boolean;
}> = ({ text, userKeywords, aiKeywords, showGuides }) => {
  const allKeywords = [...userKeywords, ...aiKeywords].filter(k => k && k.length > 0);

  if (!allKeywords.length) {
    return <>{text}</>;
  }

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Sort by length descending to ensure longer phrases are matched first
  const sortedKeywords = Array.from(new Set(allKeywords)).sort((a, b) => b.length - a.length);

  // Improved regex with word boundaries (\b)
  const pattern = new RegExp(`\\b(${sortedKeywords.map(escapeRegExp).join('|')})\\b`, 'gi');
  
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = i % 2 === 1;
        
        if (isMatch) {
          const lowerPart = part.toLowerCase();
          const isUserMatch = userKeywords.some(k => k.toLowerCase() === lowerPart);
          const isAiMatch = aiKeywords.some(k => k.toLowerCase() === lowerPart);
          const isAcronym = /^[A-Z0-9]{2,}$/.test(part);

          let classes = "font-medium px-0.5 rounded transition-colors duration-200 border-b ";
          let title = "";

          if (isUserMatch) {
            classes += "bg-yellow-200 text-yellow-900 border-yellow-300";
            title = "User Keyword";
          } else if (isAiMatch) {
            classes += "bg-blue-100 text-blue-900 border-blue-200";
            title = "AI Identified Topic";
          } else {
            classes += "bg-gray-200 text-gray-800 border-gray-300";
          }

          // Visual Guide for Acronyms
          if (showGuides && isAcronym) {
            return (
              <span key={i} className={`${classes} border-dashed border-b-2 border-gray-500 cursor-help relative group/tooltip`} title={title}>
                {part}
                <span className="invisible group-hover/tooltip:visible opacity-0 group-hover/tooltip:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10 pointer-events-none">
                  Pronounce: {part.split('').join('-')}
                </span>
              </span>
            );
          }

          return (
            <span key={i} className={classes} title={title}>
              {part}
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
};

// Professional SVG Bar Chart Component
const SimpleBarChart = ({ data }: { data: { keyword: string; count: number }[] }) => {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data.map(d => d.count), 1);
  const barHeight = 32;
  const gap = 12;
  const marginTop = 30;
  const marginBottom = 30;
  const marginLeft = 150; // Space for labels
  const marginRight = 50; // Space for count labels
  const width = 800; // Internal SVG coordinate width
  const height = data.length * (barHeight + gap) + marginTop + marginBottom;
  const chartWidth = width - marginLeft - marginRight;

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto font-sans text-gray-600" style={{ minWidth: '500px' }}>
        <g transform={`translate(${marginLeft}, ${marginTop})`}>
          {/* Grid lines and bottom axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <g key={tick} transform={`translate(${tick * chartWidth}, 0)`}>
              <line y1={-10} y2={height - marginTop - marginBottom} stroke="#f3f4f6" strokeWidth="2" />
              <text 
                y={height - marginTop - marginBottom + 20} 
                textAnchor="middle" 
                fontSize="12" 
                fill="#9ca3af"
              >
                {Math.round(tick * max)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {data.map((d, i) => {
            const barWidth = (d.count / max) * chartWidth;
            const y = i * (barHeight + gap);
            return (
              <g key={i} transform={`translate(0, ${y})`} className="group cursor-default">
                {/* Background track for hover effect */}
                <rect 
                  width={chartWidth} 
                  height={barHeight} 
                  fill="transparent" 
                />
                
                {/* Label */}
                <text 
                  x="-16" 
                  y={barHeight / 2} 
                  dy="0.32em" 
                  textAnchor="end" 
                  fontSize="13" 
                  fontWeight="600"
                  fill="#4b5563"
                  className="group-hover:fill-blue-600 transition-colors"
                >
                  {d.keyword.length > 22 ? d.keyword.substring(0, 20) + '...' : d.keyword}
                </text>
                
                {/* Bar */}
                <rect 
                  width={barWidth} 
                  height={barHeight} 
                  fill="#3b82f6" 
                  rx="4"
                  className="transition-all duration-500 ease-out group-hover:fill-blue-700 shadow-sm opacity-90 group-hover:opacity-100"
                />
                
                {/* Value Label */}
                <text 
                  x={barWidth + 10} 
                  y={barHeight / 2} 
                  dy="0.32em" 
                  fontSize="13" 
                  fontWeight="bold"
                  fill="#3b82f6"
                >
                  {d.count}
                </text>
                
                {/* Tooltip via Title */}
                <title>{d.keyword}: {d.count} occurrences</title>
              </g>
            );
          })}
          
          {/* Y Axis Line */}
          <line x1="0" y1="0" x2="0" y2={height - marginTop - marginBottom} stroke="#e5e7eb" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [result, setResult] = useState<NoteResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Extra Features State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedSectionIndex, setCopiedSectionIndex] = useState<number | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Speech Settings
  const [showSpeechSettings, setShowSpeechSettings] = useState(false);
  const [speechSettings, setSpeechSettings] = useState({
    rate: 1.0,
    spellAcronyms: false,
    showVisualGuides: false,
  });

  const [options, setOptions] = useState<ProcessingOptions>({
    extractIntroduction: true,
    extractSummary: true,
    extractConclusion: true,
    customKeywords: '',
    summarizationLevel: 'detailed'
  });

  const userKeywords = useMemo(() => {
    return options.customKeywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
  }, [options.customKeywords]);

  const keywordStats = useMemo(() => {
    if (!result) return [];
    const fullText = result.sections.map(s => `${s.heading} ${s.content}`).join(' ').toLowerCase();
    const allKeywords = Array.from(new Set([...result.keywordsFound, ...userKeywords]));

    const stats = allKeywords.map(keyword => {
      if (!keyword) return null;
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      const matches = fullText.match(regex);
      return { keyword, count: matches ? matches.length : 0 };
    }).filter((item): item is { keyword: string; count: number } => item !== null && item.count > 0);

    return stats.sort((a, b) => b.count - a.count);
  }, [result, userKeywords]);

  const maxKeywordCount = useMemo(() => {
    return Math.max(...keywordStats.map(s => s.count), 0);
  }, [keywordStats]);

  const readingTime = useMemo(() => {
    if (!result) return 0;
    const wordCount = result.sections.reduce((acc, section) => {
      return acc + section.content.split(/\s+/).length;
    }, 0);
    return Math.ceil(wordCount / 200); // Average reading speed 200 wpm
  }, [result]);

  useEffect(() => {
    // Cleanup speech on unmount
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setResult(null);
        setIsSaved(false);
      } else {
        alert("Please upload a PDF file.");
      }
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setResult(null);
    setIsSaved(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcess = async () => {
    if (!file) return;

    setLoading(true);
    setIsSaved(false);
    try {
      setLoadingStep('Extracting text from PDF...');
      const text = await extractTextFromPDF(file);
      
      setLoadingStep('Analyzing with AI & Generating Notes...');
      const noteResult = await generateNotes(text, options);
      
      setResult(noteResult);

      // Auto-save logic
      const settings = storageService.getSettings();
      if (settings.autoSave) {
        handleSaveNote(noteResult);
      }

    } catch (error: any) {
      alert(error.message || "An error occurred during processing.");
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleSaveNote = (noteToSave: NoteResult = result!) => {
    if (!noteToSave || isSaved) return;
    storageService.saveNote({
      ...noteToSave,
      readingTimeMinutes: readingTime
    });
    setIsSaved(true);
  };

  const handleLoadNote = (note: SavedNote) => {
    setResult(note);
    setCurrentView('home');
    setIsSaved(true); // Since it's from library, it's saved
  };

  // --- Extra Features Functions ---

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!result) return;

    let fullText = result.sections.map(s => `${s.heading}. ${s.content}`).join('.\n\n');

    // Enhanced Pronunciation: Spell out acronyms if enabled
    if (speechSettings.spellAcronyms) {
       // Identify and replace acronyms:
       // Match words with 2-6 uppercase letters, optionally followed by lowercase 's' (for plurals like APIs)
       // We limit to 6 chars to avoid spelling out full capitalized headers like "INTRODUCTION"
       const acronymRegex = /\b([A-Z]{2,6})(s?)\b/g;
       
       fullText = fullText.replace(acronymRegex, (match, acronym, suffix) => {
         // acronym: "OSI" -> "O S I"
         // acronym: "API", suffix: "s" -> "A P I s"
         return acronym.split('').join(' ') + (suffix ? ' ' + suffix : '');
       });
    }

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.rate = speechSettings.rate;
    utterance.onend = () => setIsSpeaking(false);
    
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedSectionIndex(index);
    setTimeout(() => setCopiedSectionIndex(null), 2000);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-black font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20 transition-all duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3 justify-center md:justify-start">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm shrink-0">
            <FileText size={20} />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight hidden md:block">PDF Notes</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setCurrentView('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'home' 
                ? 'bg-blue-50 text-blue-700 font-medium' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Home size={20} />
            <span className="hidden md:block">Generator</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('library')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'library' 
                ? 'bg-blue-50 text-blue-700 font-medium' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LibraryIcon size={20} />
            <span className="hidden md:block">Library</span>
          </button>

          <button 
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'settings' 
                ? 'bg-blue-50 text-blue-700 font-medium' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Settings size={20} />
            <span className="hidden md:block">Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-2 mb-2 hidden md:flex">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
               <p className="text-xs text-gray-500 truncate">{user.email}</p>
             </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden md:block">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-20 md:ml-64 p-6 md:p-8 transition-all duration-300 max-w-[1600px] mx-auto w-full">
        
        {/* VIEW: LIBRARY */}
        {currentView === 'library' && (
          <Library onLoadNote={handleLoadNote} />
        )}

        {/* VIEW: SETTINGS */}
        {currentView === 'settings' && (
          <SettingsView user={user} onLogout={onLogout} />
        )}

        {/* VIEW: HOME / GENERATOR */}
        {currentView === 'home' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-full">
            
            {/* Input Column */}
            <div className="xl:col-span-4 space-y-6 h-fit">
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
                  <Upload size={18} className="text-blue-600" /> Source Document
                </h2>
                <div 
                  className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-all ${file ? 'bg-blue-50 border-blue-200' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    accept=".pdf" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                  {file ? (
                    <div className="flex flex-col items-center text-black">
                      <CheckCircle2 size={32} className="mb-2 text-green-600" />
                      <span className="font-bold truncate max-w-full text-gray-900">{file.name}</span>
                      <span className="text-sm font-medium text-gray-500 mb-3">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <button 
                        onClick={handleClearFile}
                        className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all z-10"
                      >
                        <X size={14} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <Upload size={32} className="mb-2 text-gray-400" />
                      <span className="font-medium text-gray-900">Click to upload PDF</span>
                      <span className="text-sm">or drag and drop</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
                  <Settings size={18} className="text-blue-600" /> Configuration
                </h2>
                
                <div className="space-y-5 text-black">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-3 uppercase tracking-wider">Sections</label>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={options.extractIntroduction}
                          onChange={e => setOptions({...options, extractIntroduction: e.target.checked})}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700 group-hover:text-gray-900">Introduction</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={options.extractSummary}
                          onChange={e => setOptions({...options, extractSummary: e.target.checked})}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700 group-hover:text-gray-900">Abstract / Summary</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={options.extractConclusion}
                          onChange={e => setOptions({...options, extractConclusion: e.target.checked})}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700 group-hover:text-gray-900">Conclusion</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <label className="text-xs font-bold text-gray-500 block mb-3 uppercase tracking-wider">Detail Level</label>
                    <div className="flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                      <button
                        onClick={() => setOptions({...options, summarizationLevel: 'brief'})}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                          options.summarizationLevel === 'brief' 
                            ? 'bg-white text-blue-700 shadow-sm border border-gray-200' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Brief
                      </button>
                      <button
                        onClick={() => setOptions({...options, summarizationLevel: 'detailed'})}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                          options.summarizationLevel === 'detailed' 
                            ? 'bg-white text-blue-700 shadow-sm border border-gray-200' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Detailed
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <label className="text-xs font-bold text-gray-500 block mb-2 uppercase tracking-wider">Custom Topics</label>
                    <input 
                      type="text" 
                      value={options.customKeywords}
                      onChange={e => setOptions({...options, customKeywords: e.target.value})}
                      placeholder="e.g. OSI Model, Protocol"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      fullWidth 
                      variant="primary" 
                      onClick={handleProcess} 
                      disabled={!file || loading}
                      className="shadow-sm"
                    >
                      {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                      {loading ? 'Processing...' : 'Generate Notes'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Column */}
            <div className="xl:col-span-8 h-full">
              {loading ? (
                <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                   <div className="relative mb-6">
                     <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                     <Loader2 size={48} className="relative z-10 animate-spin text-blue-600" />
                   </div>
                   <p className="text-xl font-bold text-gray-900 mb-2">{loadingStep}</p>
                   <p className="text-sm text-gray-500 max-w-md">Analyzing structure and extracting key insights...</p>
                </div>
              ) : result ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[calc(100vh-80px)]">
                  {/* Result Header */}
                  <div className="bg-white px-8 py-6 border-b border-gray-200 flex flex-col gap-4 shrink-0 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{result.title}</h2>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Clock size={14} /> {readingTime} min read</span>
                          <span className="flex items-center gap-1">
                             <FileText size={14} /> {result.sections.reduce((acc, s) => acc + s.content.split(/\s+/).length, 0)} words
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 relative">
                         <button 
                           onClick={() => handleSaveNote()}
                           disabled={isSaved}
                           className={`p-2 rounded-lg border transition-all ${
                             isSaved 
                               ? 'bg-green-50 text-green-600 border-green-200 cursor-default' 
                               : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-blue-600'
                           }`}
                           title={isSaved ? "Saved to Library" : "Save to Library"}
                         >
                           {isSaved ? <Check size={20} /> : <Save size={20} />}
                         </button>
                         
                         <div className="flex bg-gray-100 rounded-lg p-0.5">
                            <button 
                              onClick={toggleSpeech}
                              className={`p-1.5 rounded-md transition-all ${
                                isSpeaking 
                                  ? 'bg-blue-600 text-white shadow-sm' 
                                  : 'text-gray-600 hover:text-blue-600'
                              }`}
                              title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
                            >
                              {isSpeaking ? <StopCircle size={20} /> : <Volume2 size={20} />}
                            </button>
                            <button
                              onClick={() => setShowSpeechSettings(!showSpeechSettings)}
                              className={`p-1.5 rounded-md transition-all border-l border-gray-200 ml-0.5 ${
                                showSpeechSettings ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-900'
                              }`}
                              title="Speech Settings"
                            >
                              <Sliders size={16} />
                            </button>
                         </div>

                         {/* Speech Settings Popover */}
                         {showSpeechSettings && (
                           <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                             <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                               <Volume2 size={14} /> Voice & Reading Settings
                             </h4>
                             
                             <div className="space-y-4">
                               <div>
                                 <label className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                                   <span>Reading Speed</span>
                                   <span>{speechSettings.rate}x</span>
                                 </label>
                                 <input 
                                    type="range" 
                                    min="0.5" 
                                    max="2" 
                                    step="0.25"
                                    value={speechSettings.rate}
                                    onChange={(e) => setSpeechSettings({...speechSettings, rate: parseFloat(e.target.value)})}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                 />
                               </div>

                               <div className="border-t border-gray-100 pt-3 space-y-3">
                                 <label className="flex items-start gap-3 cursor-pointer group">
                                   <div className="relative flex items-center">
                                      <input 
                                        type="checkbox"
                                        checked={speechSettings.spellAcronyms}
                                        onChange={(e) => setSpeechSettings({...speechSettings, spellAcronyms: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                                      />
                                   </div>
                                   <div>
                                     <span className="text-sm font-medium text-gray-900 block group-hover:text-blue-700">Enhanced Pronunciation</span>
                                     <span className="text-xs text-gray-500 block leading-tight mt-0.5">Spell out acronyms when reading (e.g. "O.S.I")</span>
                                   </div>
                                 </label>

                                 <label className="flex items-start gap-3 cursor-pointer group">
                                   <div className="relative flex items-center">
                                      <input 
                                        type="checkbox"
                                        checked={speechSettings.showVisualGuides}
                                        onChange={(e) => setSpeechSettings({...speechSettings, showVisualGuides: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                                      />
                                   </div>
                                   <div>
                                     <span className="text-sm font-medium text-gray-900 block group-hover:text-blue-700">Visual Guides</span>
                                     <span className="text-xs text-gray-500 block leading-tight mt-0.5">Show tooltips for complex terms/acronyms</span>
                                   </div>
                                 </label>
                               </div>
                             </div>
                           </div>
                         )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {result.keywordsFound.map((k, i) => (
                        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          #{k}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1">
                      <Button variant="outline" size="sm" onClick={() => exportToPDF(result)} className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100">
                        <Download size={14} /> PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => exportToWord(result)} className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100">
                        <Download size={14} /> Word
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => exportToText(result)} className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100">
                        <Download size={14} /> Text
                      </Button>
                       <Button variant="outline" size="sm" onClick={() => exportToJSON(result)} className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100">
                        <Download size={14} /> JSON
                      </Button>
                    </div>
                  </div>

                  {/* Result Content Scroll Area */}
                  <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar bg-white">
                    
                    {/* Analytics Chart */}
                    {keywordStats.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <BarChart3 size={16} /> Keyword Frequency Analysis
                        </h3>
                        <SimpleBarChart data={keywordStats.slice(0, 10)} />
                      </div>
                    )}

                    {/* Note Sections */}
                    {result.sections.map((section, idx) => {
                      const isKeywordSection = userKeywords.some(k => 
                        section.heading.toLowerCase().includes(k.toLowerCase())
                      );
                      const isCopied = copiedSectionIndex === idx;

                      return (
                        <div 
                          key={idx} 
                          className={`group relative p-6 rounded-xl border transition-all duration-300 ${
                            isKeywordSection 
                              ? 'bg-yellow-50/50 border-yellow-200' 
                              : 'bg-white border-transparent hover:border-gray-100 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h3 className={`text-xl font-bold flex items-center gap-2 ${
                              isKeywordSection ? 'text-yellow-900' : 'text-gray-900'
                            }`}>
                              {section.heading}
                              {isKeywordSection && (
                                <span className="text-[10px] bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full uppercase tracking-wide font-bold">
                                  Topic
                                </span>
                              )}
                            </h3>
                            <button 
                              onClick={() => copyToClipboard(section.content, idx)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Copy section"
                            >
                              {isCopied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                            </button>
                          </div>
                          
                          <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                            <HighlightedContent 
                              text={section.content} 
                              userKeywords={userKeywords} 
                              aiKeywords={result.keywordsFound}
                              showGuides={speechSettings.showVisualGuides}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                  <div className="bg-white p-6 rounded-full shadow-sm mb-6">
                    <FileText size={48} className="text-blue-200" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to convert</h3>
                  <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                    Upload a document to generate structured, intelligent notes. Access your saved notes in the Library at any time.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
