import React, { useState } from 'react';
import { 
  Search, MapPin, Award, BookOpen, Clock, Coins, Check, X, Sparkles, 
  ChevronDown, HelpCircle, GraduationCap, AlertCircle, BookmarkPlus,
  Scale, ArrowRight, Loader2, Import, RefreshCw, ExternalLink
} from 'lucide-react';
import { UniversityProgram, Scholarship, StudentProfile, DocumentRecord, getProgramWebsiteUrl } from '../types';
import { EU_COUNTRIES } from '../data/eu_data';

interface ProgramsProps {
  profile: StudentProfile;
  documents: DocumentRecord[];
  onDraftApplication: (programId: string, scholarshipId?: string) => void;
  draftedProgramIds: string[];
  programs: UniversityProgram[];
  onSearchExternal: (query: string) => Promise<{ programs: UniversityProgram[]; scholarships: Scholarship[] }>;
  onImportProgram: (program: UniversityProgram) => Promise<void>;
  onAutoUpdate?: () => Promise<void>;
  isAutoUpdating?: boolean;
}

export default function Programs({
  profile,
  documents,
  onDraftApplication,
  draftedProgramIds,
  programs,
  onSearchExternal,
  onImportProgram,
  onAutoUpdate,
  isAutoUpdating = false
}: ProgramsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedDegree, setSelectedDegree] = useState('');
  const [selectedScholarshipsForApp, setSelectedScholarshipsForApp] = useState<{ [key: string]: string }>({});

  // External Search State
  const [externalQuery, setExternalQuery] = useState('');
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [externalResults, setExternalResults] = useState<{ programs: UniversityProgram[]; scholarships: Scholarship[] } | null>(null);

  // Comparison State
  const [compareList, setCompareList] = useState<UniversityProgram[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Filter local/imported programs
  const filteredPrograms = programs.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.universityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCountry = !selectedCountry || p.country.toLowerCase() === selectedCountry.toLowerCase();
    const matchesDegree = !selectedDegree || p.degreeLevel.toLowerCase() === selectedDegree.toLowerCase();

    return matchesSearch && matchesCountry && matchesDegree;
  });

  const getMatchedDocsCount = (program: UniversityProgram) => {
    return program.requiredDocuments.filter(type => 
      documents.some(d => d.docType === type && d.status === 'completed')
    ).length;
  };

  // Toggle program comparison
  const handleToggleCompare = (program: UniversityProgram) => {
    if (compareList.some(p => p.id === program.id)) {
      setCompareList(prev => prev.filter(p => p.id !== program.id));
    } else {
      if (compareList.length >= 3) {
        alert("You can compare up to 3 programs at once.");
        return;
      }
      setCompareList(prev => [...prev, program]);
    }
  };

  // Run External Web Search (using Google search grounding)
  const handleRunExternalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalQuery.trim()) return;
    setIsSearchingExternal(true);
    setExternalResults(null);
    try {
      const results = await onSearchExternal(externalQuery);
      setExternalResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingExternal(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10 text-slate-200">
      
      {/* 1. Header Banner & Dynamic Tool Toggle */}
      <div className="glass-card-dark rounded-xl p-6 text-white relative overflow-hidden shadow-xl border border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-indigo-500/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-300 border border-indigo-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            Next-Gen Admissions Engine
          </span>
          <h1 className="text-2xl font-light tracking-tight">
            Explore and Search Any University Program
          </h1>
          <p className="text-slate-200 text-xs md:text-sm leading-relaxed">
            Select standard catalog listings below, compare key metrics side-by-side, or use the <strong>AI-Powered Web Finder</strong> to search the global web and import real-time programs directly into your application portal!
          </p>
        </div>

        {/* Auto-Update Trigger Button */}
        {onAutoUpdate && (
          <div className="relative z-10 shrink-0">
            <button
              disabled={isAutoUpdating}
              onClick={onAutoUpdate}
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-white border transition-all duration-200 shadow-lg cursor-pointer ${
                isAutoUpdating
                  ? 'bg-indigo-600/25 border-indigo-500/30 text-indigo-300'
                  : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 hover:scale-102 active:scale-98'
              }`}
            >
              {isAutoUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Auto-Update Database
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 font-mono mt-1.5 text-center">
              Extends Catalog with Gemini AI
            </p>
          </div>
        )}

        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* 2. AI-Powered Web Finder Section */}
      <div className="glass-card-dark border border-white/5 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-sans uppercase tracking-wide">
              Global AI Web Finder (Live Google Search Grounding)
            </h2>
            <p className="text-[11px] text-slate-300">
              Can't find your target university or degree? Type any search prompt (e.g., "MSc Robotics at NUS Singapore") to query the live web, synthesize facts, and import programs instantly.
            </p>
          </div>
        </div>

        <form onSubmit={handleRunExternalSearch} className="flex gap-2 max-w-3xl">
          <input
            type="text"
            placeholder="Search any university, major, or country (e.g. 'Masters in Data Science in Germany or UK')..."
            value={externalQuery}
            onChange={(e) => setExternalQuery(e.target.value)}
            className="flex-1 px-3.5 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white/5 text-white placeholder-slate-400 shadow-inner"
          />
          <button
            type="submit"
            disabled={isSearchingExternal}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {isSearchingExternal ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Finding...
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                Search Live Web
              </>
            )}
          </button>
        </form>

        {/* External AI Search Results */}
        {externalResults && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4 animate-fade-in backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <CheckCircle2Icon className="h-4 w-4 text-emerald-400" />
                Live Grounded Search Results (Synthesized with Gemini AI)
              </span>
              <button 
                onClick={() => setExternalResults(null)}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1 font-mono bg-transparent border-0 cursor-pointer"
              >
                <X className="h-3 w-3" /> Dismiss
              </button>
            </div>

            {externalResults.programs && externalResults.programs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {externalResults.programs.map((extProg, idx) => {
                  const isImported = programs.some(p => p.id === extProg.id || p.name === extProg.name);
                  return (
                    <div key={idx} className="border border-white/5 rounded-lg p-3.5 bg-white/5 hover:bg-white/10 transition-all shadow-md space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block font-mono">{extProg.degreeLevel}</span>
                          <h4 className="font-bold text-white text-xs leading-tight">{extProg.name}</h4>
                          <p className="text-[11px] text-slate-400 font-medium font-mono mt-0.5">{extProg.universityName} • {extProg.city}, {extProg.country}</p>
                        </div>
                        <span className="text-xl">{extProg.logo || '🎓'}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{extProg.description}</p>
                      
                      <div className="grid grid-cols-3 gap-2 bg-[#0e1726]/80 p-2 rounded-md border border-white/5 text-[9px] text-slate-300 font-bold uppercase tracking-tight">
                        <div>🕒 {extProg.durationMonths} Mos</div>
                        <div>💰 {extProg.tuitionFee === 0 ? 'Free' : `${extProg.tuitionFee.toLocaleString()} ${extProg.currency}`}</div>
                        <div className="truncate">🎯 Min GPA {extProg.minGpa}</div>
                      </div>

                      <div className="flex gap-2 pt-1.5">
                        <a
                          href={getProgramWebsiteUrl(extProg)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-300 border border-white/10 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 shrink-0"
                          title="Visit official portal"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Portal
                        </a>
                        {isImported ? (
                          <div className="flex-1 text-center py-1.5 bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1">
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            Imported
                          </div>
                        ) : (
                          <button
                            onClick={async () => {
                              await onImportProgram(extProg);
                              setExternalResults(prev => {
                                if (!prev) return prev;
                                return { ...prev };
                              });
                            }}
                            className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Import className="h-3.5 w-3.5" />
                            Import Program
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No matching external programs found. Try refining your keywords.</p>
            )}
          </div>
        )}
      </div>

      {/* 3. Catalog Filters */}
      <div className="glass-card-dark rounded-xl border border-white/5 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
            Filter System Catalog ({filteredPrograms.length} Programs Available)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-400"
            />
          </div>

          {/* Country Selection */}
          <div className="relative">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full pl-3 pr-8 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#131b2e] text-white appearance-none cursor-pointer"
            >
              <option value="">All Countries ({EU_COUNTRIES.length})</option>
              {EU_COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Degree Level */}
          <div className="relative">
            <select
              value={selectedDegree}
              onChange={(e) => setSelectedDegree(e.target.value)}
              className="w-full pl-3 pr-8 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#131b2e] text-white appearance-none cursor-pointer"
            >
              <option value="">All Degrees</option>
              <option value="Bachelor">Bachelor</option>
              <option value="Master">Master</option>
              <option value="PhD">PhD</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCountry('');
              setSelectedDegree('');
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-white/10 cursor-pointer transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* 4. Program Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.length === 0 ? (
          <div className="col-span-full py-16 text-center space-y-2 rounded-xl border border-white/5 bg-white/5">
            <HelpCircle className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">No programs matched your filters.</p>
            <p className="text-xs text-slate-400">Try broadening your search keywords or search using the AI live web finder above.</p>
          </div>
        ) : (
          filteredPrograms.map(program => {
            const isGpaEligible = !program.minGpa || (profile.gpa >= program.minGpa);
            const totalDocsRequired = program.requiredDocuments.length;
            const matchedDocs = getMatchedDocsCount(program);
            const isAlreadyDrafted = draftedProgramIds.includes(program.id);
            const isComparing = compareList.some(p => p.id === program.id);

            const selectedScholarshipId = selectedScholarshipsForApp[program.id] || '';

            return (
              <div 
                key={program.id} 
                className={`rounded-xl border glass-card-dark p-5 shadow-xl transition-all duration-150 flex flex-col justify-between space-y-4 ${
                  isAlreadyDrafted ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-white/5'
                }`}
              >
                {/* 1. University & Title Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl h-10 w-10 flex items-center justify-center bg-white/5 rounded-lg border border-white/5 shrink-0">
                        {program.logo || '🎓'}
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                          {program.degreeLevel} Degree
                        </span>
                        <h3 className="font-bold text-white text-xs uppercase tracking-wide leading-tight line-clamp-1">
                          {program.name}
                        </h3>
                      </div>
                    </div>
                    {isAlreadyDrafted && (
                      <span className="rounded bg-blue-500/15 px-2.5 py-0.5 text-[9px] font-bold text-blue-300 uppercase tracking-wider border border-blue-500/35">
                        Drafted
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 font-medium font-mono">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{program.universityName} • {program.city}, {program.country}</span>
                    </div>
                    <a
                      href={getProgramWebsiteUrl(program)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30 transition-all shrink-0 ml-2"
                      title="Direct Official University Portal"
                    >
                      <span>Website</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {program.description}
                  </p>
                </div>

                {/* 2. Key Specs block */}
                <div className="grid grid-cols-2 gap-2 bg-white/5 p-3 rounded-lg border border-white/5 text-[11px] text-slate-300 font-bold uppercase tracking-tight">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{program.durationMonths} Mos</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <Coins className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{program.tuitionFee === 0 ? 'Free' : `${program.tuitionFee.toLocaleString()} ${program.currency}`}</span>
                  </div>
                </div>

                {/* 3. Automatic Eligibility matching section */}
                <div className="border-t border-white/5 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <span>GPA Match (Min {program.minGpa})</span>
                    {isGpaEligible ? (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <Check className="h-3 w-3" />
                        Matched ({profile.gpa || '0.00'})
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <AlertCircle className="h-3 w-3" />
                        GPA Low ({profile.gpa || '0.00'})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Required Files</span>
                    <span className={`${matchedDocs === totalDocsRequired ? 'text-emerald-400 font-extrabold' : 'text-slate-300 font-medium'}`}>
                      {matchedDocs} / {totalDocsRequired} Linked
                    </span>
                  </div>

                  {/* Document bubbles */}
                  <div className="flex flex-wrap gap-1">
                    {program.requiredDocuments.map(docType => {
                      const isUploaded = documents.some(d => d.docType === docType && d.status === 'completed');
                      return (
                        <span 
                          key={docType} 
                          className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide border ${
                            isUploaded 
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-300 border-red-500/20'
                          }`}
                        >
                          {isUploaded ? <Check className="h-2 w-2" /> : <X className="h-2 w-2" />}
                          {docType}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Trigger / Compare Button Controls */}
                <div className="border-t border-white/5 pt-3 flex gap-2">
                  <button
                    onClick={() => handleToggleCompare(program)}
                    className={`px-3 py-2 text-xs font-bold uppercase tracking-wide rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isComparing 
                        ? 'bg-white text-slate-900 hover:bg-slate-100 border-white' 
                        : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <Scale className="h-3.5 w-3.5" />
                    {isComparing ? 'Comparing' : 'Compare'}
                  </button>

                  {isAlreadyDrafted ? (
                    <button
                      disabled
                      className="flex-1 py-2 bg-white/5 text-slate-500 text-xs font-bold uppercase tracking-widest rounded-lg cursor-not-allowed border border-white/5 flex items-center justify-center gap-1.5"
                    >
                      <Check className="h-4 w-4" />
                      In Pipeline
                    </button>
                  ) : (
                    <button
                      onClick={() => onDraftApplication(program.id, selectedScholarshipId || undefined)}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/20"
                    >
                      <BookmarkPlus className="h-4 w-4" />
                      Draft App
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Floating Comparison Tray Sticky Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950/90 backdrop-blur-md text-white border border-white/10 rounded-full px-6 py-3.5 shadow-2xl flex items-center gap-6 animate-slide-up">
          <div className="flex items-center gap-2">
            <Scale className="h-4.5 w-4.5 text-indigo-400" />
            <span className="text-xs font-bold tracking-wide uppercase">
              Comparison Queue ({compareList.length}/3 selected)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {compareList.map(p => (
              <span key={p.id} className="text-xs font-semibold bg-white/5 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1">
                <span className="truncate max-w-[100px]">{p.universityName}</span>
                <X 
                  className="h-3 w-3 text-slate-400 hover:text-white cursor-pointer shrink-0" 
                  onClick={() => handleToggleCompare(p)} 
                />
              </span>
            ))}
          </div>

          <button
            onClick={() => setShowCompareModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer border-0"
          >
            Compare Now
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* 6. Side-by-Side Comparison Overlay Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-card-dark text-white rounded-2xl max-w-4xl w-full border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-950/80 text-white px-6 py-4 flex justify-between items-center border-b border-white/5">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-indigo-400" />
                <h3 className="font-light text-base uppercase tracking-wider">Side-by-Side University Comparison</h3>
              </div>
              <button 
                onClick={() => setShowCompareModal(false)}
                className="text-slate-400 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Table Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#131b2e]/50">
                    <th className="p-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-1/4">Key Parameters</th>
                    {compareList.map(p => (
                      <th key={p.id} className="p-3 w-1/4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{p.logo || '🎓'}</span>
                          <div>
                            <h4 className="font-bold text-white text-xs leading-snug">{p.name}</h4>
                            <p className="text-[10px] text-slate-400 font-mono">{p.universityName}</p>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-200">
                  <tr>
                    <td className="p-3 font-bold text-slate-400 uppercase tracking-wide text-[10px]">Degree Level</td>
                    {compareList.map(p => (
                      <td key={p.id} className="p-3 font-semibold text-white">{p.degreeLevel}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-400 uppercase tracking-wide text-[10px]">Country & City</td>
                    {compareList.map(p => (
                      <td key={p.id} className="p-3 font-semibold font-mono text-slate-300">{p.city}, {p.country}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-400 uppercase tracking-wide text-[10px]">Tuition Fee</td>
                    {compareList.map(p => (
                      <td key={p.id} className="p-3 font-bold text-indigo-400">
                        {p.tuitionFee === 0 ? 'Free (Fully Funded)' : `${p.tuitionFee.toLocaleString()} ${p.currency}`}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-400 uppercase tracking-wide text-[10px]">Duration</td>
                    {compareList.map(p => (
                      <td key={p.id} className="p-3 font-semibold font-mono text-slate-300">{p.durationMonths} Months</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-400 uppercase tracking-wide text-[10px]">Min GPA Target</td>
                    {compareList.map(p => (
                      <td key={p.id} className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold font-mono text-white">{p.minGpa}</span>
                          {profile.gpa >= p.minGpa ? (
                            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">Matched</span>
                          ) : (
                            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">GPA Low</span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-400 uppercase tracking-wide text-[10px]">Required Checklist</td>
                    {compareList.map(p => (
                      <td key={p.id} className="p-3 space-y-1">
                        {p.requiredDocuments.map(doc => {
                          const hasDoc = documents.some(d => d.docType === doc && d.status === 'completed');
                          return (
                            <div key={doc} className="flex items-center gap-1">
                              {hasDoc ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <X className="h-3 w-3 text-red-400" />
                              )}
                              <span className="text-[10px] text-slate-300 font-semibold">{doc}</span>
                            </div>
                          );
                        })}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-400 uppercase tracking-wide text-[10px]">Profile Matching</td>
                    {compareList.map(p => {
                      const matched = getMatchedDocsCount(p);
                      const total = p.requiredDocuments.length;
                      const pct = Math.round((matched / total) * 100);
                      return (
                        <td key={p.id} className="p-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold block text-white">{pct}% Readiness</span>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-400 uppercase tracking-wide text-[10px]">Official Portal</td>
                    {compareList.map(p => (
                      <td key={p.id} className="p-3">
                        <a
                          href={getProgramWebsiteUrl(p)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-md"
                        >
                          <span>Visit University</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#131b2e]/40 border-t border-white/5 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer border border-white/10"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Inline helper for search notification CheckCircle icon
function CheckCircle2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
