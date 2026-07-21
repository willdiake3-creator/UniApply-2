import React, { useState } from 'react';
import { 
  Award, Search, Filter, Globe, BookOpen, Clock, Check, X, 
  Sparkles, AlertTriangle, GraduationCap, DollarSign, ArrowRight, Loader2, Import, RefreshCw, ExternalLink
} from 'lucide-react';
import { Scholarship, StudentProfile, DocumentRecord, UniversityProgram, getScholarshipWebsiteUrl } from '../types';

interface ScholarshipsViewProps {
  profile: StudentProfile;
  documents: DocumentRecord[];
  onDraftApplication: (programId: string, scholarshipId?: string) => Promise<void>;
  onChangeTab: (tab: string) => void;
  scholarships: Scholarship[];
  onSearchExternal: (query: string) => Promise<{ programs: UniversityProgram[]; scholarships: Scholarship[] }>;
  onImportScholarship: (scholarship: Scholarship) => Promise<void>;
  onAutoUpdate?: () => Promise<void>;
  isAutoUpdating?: boolean;
}

export default function ScholarshipsView({
  profile,
  documents,
  onDraftApplication,
  onChangeTab,
  scholarships,
  onSearchExternal,
  onImportScholarship,
  onAutoUpdate,
  isAutoUpdating = false
}: ScholarshipsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAwardType, setSelectedAwardType] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  // AI External Search state
  const [externalQuery, setExternalQuery] = useState('');
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [externalResults, setExternalResults] = useState<Scholarship[] | null>(null);

  // Group countries into regions for filtering
  const getRegion = (country: string) => {
    const naCountries = ['United States', 'Canada', 'Mexico'];
    const asiaCountries = ['Japan', 'Singapore', 'China', 'India', 'South Korea'];
    if (naCountries.includes(country)) return 'North America';
    if (asiaCountries.includes(country)) return 'Asia';
    return 'Europe';
  };

  // Filter scholarships from current database
  const filteredScholarships = scholarships.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.country.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAwardType = selectedAwardType ? s.awardType === selectedAwardType : true;
    
    const matchesRegion = selectedRegion ? getRegion(s.country) === selectedRegion : true;

    return matchesSearch && matchesAwardType && matchesRegion;
  });

  // Check matching eligibility
  const checkEligibility = (s: Scholarship) => {
    const meetsGpa = !profile.gpa || s.minGpa <= profile.gpa;
    const meetsDegree = profile.highestDegree 
      ? s.eligibleDegreeLevels.some(dl => profile.highestDegree.toLowerCase().includes(dl.toLowerCase()) || dl.toLowerCase() === 'all')
      : true;

    const hasRequiredDocs = s.requiredDocuments.every(reqDoc => 
      documents.some(d => d.docType === reqDoc && d.status === 'completed')
    );

    return {
      eligible: meetsGpa && meetsDegree,
      gpaMatch: meetsGpa,
      degreeMatch: meetsDegree,
      docsMatch: hasRequiredDocs,
      missingDocs: s.requiredDocuments.filter(reqDoc => 
        !documents.some(d => d.docType === reqDoc && d.status === 'completed')
      )
    };
  };

  // Search Live Web for Scholarships
  const handleLiveScholarshipSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalQuery.trim()) return;
    setIsSearchingExternal(true);
    setExternalResults(null);
    try {
      const results = await onSearchExternal(externalQuery);
      setExternalResults(results.scholarships || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingExternal(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10 text-slate-200">
      
      {/* Header Banner */}
      <div className="glass-card-dark rounded-xl border border-white/10 p-6 text-white relative overflow-hidden shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-indigo-500/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-300 border border-indigo-500/20">
            <Award className="h-3.5 w-3.5 text-indigo-400" />
            Global Scholarship Finder
          </span>
          <h1 className="text-2xl font-light tracking-tight">
            Explore Funding Opportunities
          </h1>
          <p className="text-slate-200 text-xs md:text-sm leading-relaxed">
            Find and link fully funded scholarships across Europe, North America, and Asia. View dynamic eligibility statuses matched in real-time with your academic records or find external grants on the web.
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

      {/* Live AI Web Scholarship Search Form */}
      <div className="glass-card-dark border border-emerald-500/20 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-600 rounded text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-300">
              AI Scholarship Finder (Live Web Crawler)
            </h2>
            <p className="text-[11px] text-slate-300">
              Search the web for special grants, region-specific fellowships, or dynamic funding. Synthesize real criteria and import directly into your match system!
            </p>
          </div>
        </div>

        <form onSubmit={handleLiveScholarshipSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Type search query (e.g. 'Scholarships for STEM females in Canada' or 'Fully funded Masters in France')..."
            value={externalQuery}
            onChange={(e) => setExternalQuery(e.target.value)}
            className="flex-1 px-3.5 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white/5 text-white placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={isSearchingExternal}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isSearchingExternal ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Crawling...
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                Find Scholarships
              </>
            )}
          </button>
        </form>

        {/* Live Search Results */}
        {externalResults && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4 animate-fade-in backdrop-blur-md text-white">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 font-mono">
                🌟 Matched AI Discoveries (Importable)
              </span>
              <button 
                onClick={() => setExternalResults(null)}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1 bg-transparent border-0 cursor-pointer"
              >
                <X className="h-3 w-3" /> Close
              </button>
            </div>

            {externalResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {externalResults.map((extSch, sidx) => {
                  const isAlreadyImported = scholarships.some(s => s.id === extSch.id || s.name === extSch.name);
                  return (
                    <div key={sidx} className="border border-white/5 rounded-lg p-3.5 bg-white/5 hover:bg-white/10 transition-all shadow-md space-y-3">
                      <div>
                        <span className="inline-block bg-indigo-500/15 text-indigo-300 text-[9px] font-bold uppercase px-2 py-0.5 rounded border border-indigo-500/25 mb-1.5">
                          {extSch.awardType}
                        </span>
                        <h4 className="font-bold text-xs text-white leading-tight">{extSch.name}</h4>
                        <p className="text-[10px] text-slate-300 font-bold font-mono mt-0.5">Value: {extSch.awardAmount.toLocaleString()} {extSch.currency} • Eligible Country: {extSch.country}</p>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{extSch.description}</p>
                      
                      <div className="flex gap-2 pt-1.5">
                        <a
                          href={getScholarshipWebsiteUrl(extSch)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-emerald-300 border border-white/10 text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1 shrink-0"
                          title="Visit official portal"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Portal
                        </a>
                        {isAlreadyImported ? (
                          <div className="flex-1 text-center py-1.5 bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[10px] font-bold uppercase rounded flex items-center justify-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Imported
                          </div>
                        ) : (
                          <button
                            onClick={async () => {
                              await onImportScholarship(extSch);
                              setExternalResults(prev => {
                                if (!prev) return prev;
                                return [...prev];
                              });
                            }}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Import className="h-3.5 w-3.5" /> Import to My Database
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No matching scholarships crawled. Try refining your keywords.</p>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar for active platform database */}
      <div className="glass-card-dark rounded-xl border border-white/5 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search active platform database by keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Award Type Filter */}
          <select
            value={selectedAwardType}
            onChange={(e) => setSelectedAwardType(e.target.value)}
            className="border border-white/10 rounded-lg text-xs px-3 py-2 bg-[#131b2e] text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">All Award Types</option>
            <option value="Full Ride">Full Ride</option>
            <option value="Full Tuition">Full Tuition</option>
            <option value="Partial Tuition">Partial Tuition</option>
            <option value="Stipend">Monthly Stipend</option>
          </select>

          {/* Region Filter */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="border border-white/10 rounded-lg text-xs px-3 py-2 bg-[#131b2e] text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">All Regions</option>
            <option value="Europe">Europe</option>
            <option value="North America">North America</option>
            <option value="Asia">Asia</option>
          </select>
        </div>
      </div>

      {/* active database listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredScholarships.map(scholarship => {
          const elig = checkEligibility(scholarship);
          
          return (
            <div 
              key={scholarship.id}
              className={`glass-card-dark rounded-xl border p-5 shadow-xl space-y-4 flex flex-col justify-between transition-shadow hover:shadow-2xl ${
                elig.eligible ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5'
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded bg-indigo-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-300 border border-indigo-500/25">
                      <Award className="h-3 w-3" />
                      {scholarship.awardType}
                    </span>
                    <h3 className="font-bold text-white text-xs mt-1.5 uppercase tracking-wide leading-tight line-clamp-1">
                      {scholarship.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-400 font-mono block">
                      {scholarship.awardAmount === 0 ? 'Full Support' : `${scholarship.awardAmount.toLocaleString()} ${scholarship.currency}`}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono font-medium">Value</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-slate-300 font-medium">
                  <div className="flex items-center gap-1 font-mono">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    <span>Region: {scholarship.country}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Deadline: {scholarship.applicationDeadline}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {scholarship.description}
                </p>
              </div>

              {/* Eligibility HUD */}
              <div className="border-t border-white/5 pt-3 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400">Eligibility Standing</span>
                  {elig.eligible ? (
                    <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                      <Check className="h-3.5 w-3.5" />
                      Eligible to Apply
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Ineligible
                    </span>
                  )}
                </div>

                {/* Subcheck list */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300 font-semibold bg-[#0e1726]/80 p-2 rounded border border-white/5">
                  <div className="flex items-center gap-1">
                    {elig.gpaMatch ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <X className="h-3 w-3 text-red-400" />
                    )}
                    GPA ({scholarship.minGpa}+): {profile.gpa || '0.00'}
                  </div>
                  <div className="flex items-center gap-1">
                    {elig.degreeMatch ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <X className="h-3 w-3 text-red-400" />
                    )}
                    Degree Matching
                  </div>
                </div>

                {/* Document readiness */}
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Document Link Status</span>
                  <span>{elig.docsMatch ? 'Checklist Complete' : 'Missing Documents'}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {scholarship.requiredDocuments.map(reqDoc => {
                    const hasDoc = documents.some(d => d.docType === reqDoc && d.status === 'completed');
                    return (
                      <span 
                        key={reqDoc} 
                        className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide border ${
                          hasDoc 
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-300 border-red-500/20'
                        }`}
                      >
                        {hasDoc ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                        {reqDoc}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/5 flex gap-2">
                <a
                  href={getScholarshipWebsiteUrl(scholarship)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all shrink-0"
                  title="Visit official scholarship portal"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Official Portal
                </a>
                <button
                  onClick={() => onChangeTab('programs')}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-1 transition-colors border border-white/10 cursor-pointer"
                >
                  Match Programs
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
