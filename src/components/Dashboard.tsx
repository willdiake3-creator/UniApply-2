import React, { useState } from 'react';
import { 
  Briefcase, CheckCircle2, Clock, Sparkles, AlertCircle, FileText, 
  MapPin, Loader2, ArrowRight, Eye, RefreshCw, Send, Check, Calendar,
  AlertTriangle, CheckCircle, Award, Activity
} from 'lucide-react';
import { ApplicationRecord, StudentProfile, DocumentRecord, UniversityProgram, Scholarship } from '../types';

// Helper to determine the admissions email address of a university
function getUniversityAdmissionsEmail(universityName: string): string {
  if (!universityName) return 'admissions@uniapply.eu';
  const name = universityName.toLowerCase().trim();
  
  if (name.includes('vienna')) return 'admissions@univie.ac.at';
  if (name.includes('leuven')) return 'admissions@kuleuven.be';
  if (name.includes('sofia university') || name === 'sofia') return 'admissions@uni-sofia.bg';
  if (name.includes('zagreb')) return 'admissions@unizg.hr';
  if (name.includes('cyprus')) return 'admissions@ucy.ac.cy';
  if (name.includes('charles university')) return 'admissions@cuni.cz';
  if (name.includes('technical university of denmark') || name.includes('dtu')) return 'admissions@dtu.dk';
  if (name.includes('tartu')) return 'admissions@ut.ee';
  if (name.includes('aalto')) return 'admissions@aalto.fi';
  if (name.includes('sorbonne')) return 'admissions@sorbonne-universite.fr';
  if (name.includes('munich') || name.includes('tum')) return 'admissions@tum.de';
  if (name.includes('athens')) return 'admissions@uoa.gr';
  if (name.includes('eötvös') || name.includes('elte')) return 'admissions@elte.hu';
  if (name.includes('trinity college')) return 'admissions@tcd.ie';
  if (name.includes('bologna')) return 'admissions@unibo.it';
  if (name.includes('riga')) return 'admissions@rtu.lv';
  if (name.includes('vilnius')) return 'admissions@vu.lt';
  if (name.includes('luxembourg')) return 'admissions@uni.lu';
  if (name.includes('malta')) return 'admissions@um.edu.mt';
  if (name.includes('delft') || name.includes('tu delft')) return 'admissions@tudelft.nl';
  if (name.includes('warsaw')) return 'admissions@uw.edu.pl';
  if (name.includes('lisbon')) return 'admissions@ulisboa.pt';
  if (name.includes('babeș') || name.includes('cluj')) return 'admissions@ubbcluj.ro';
  if (name.includes('comenius')) return 'admissions@uniba.sk';
  if (name.includes('ljubljana')) return 'admissions@uni-lj.si';
  if (name.includes('barcelona')) return 'admissions@uab.cat';
  if (name.includes('kth')) return 'admissions@kth.se';
  if (name.includes('massachusetts') || name.includes('mit')) return 'admissions@mit.edu';
  if (name.includes('harvard')) return 'admissions@harvard.edu';
  if (name.includes('stanford')) return 'admissions@stanford.edu';
  if (name.includes('toronto')) return 'admissions@utoronto.ca';
  if (name.includes('singapore') || name.includes('nus')) return 'admissions@nus.edu.sg';
  if (name.includes('kyoto')) return 'admissions@kyoto-u.ac.jp';
  if (name.includes('tsinghua')) return 'admissions@tsinghua.edu.cn';
  if (name.includes('bombay') || name.includes('iitb')) return 'admissions@iitb.ac.in';
  if (name.includes('seoul') || name.includes('snu')) return 'admissions@snu.ac.kr';
  if (name.includes('king\'s college') || name.includes('kcl')) return 'admissions@kcl.ac.uk';
  if (name.includes('johns hopkins') || name.includes('jhu')) return 'admissions@jhu.edu';
  if (name.includes('mexico') || name.includes('unam')) return 'admissions@unam.mx';
  if (name.includes('shevchenko') || name.includes('kyiv')) return 'admissions@knu.ua';
  if (name.includes('belgrade')) return 'admissions@bg.ac.rs';
  if (name.includes('sechenov')) return 'admissions@sechenov.ru';
  if (name.includes('petersburg')) return 'admissions@spbu.ru';
  if (name.includes('belarusian')) return 'admissions@bsu.by';
  if (name.includes('semmelweis')) return 'admissions@semmelweis.hu';

  // Dynamic Algorithmic Fallback for custom or generated universities
  let domain = name
    .replace(/^the\s+/, '')
    .replace(/^university\s+of\s+/, '')
    .replace(/\s+university$/, '')
    .replace(/[^a-z0-9-]/g, '')
    .trim();

  if (!domain) {
    domain = 'uniapply';
  }

  return `admissions@${domain}.edu`;
}

interface DashboardProps {
  profile: StudentProfile;
  documents: DocumentRecord[];
  applications: ApplicationRecord[];
  gmailConnected: boolean;
  onAutomate: (appId: string) => void;
  onRefreshApplications: () => void;
  onChangeTab: (tab: string) => void;
  programs: UniversityProgram[];
  scholarships: Scholarship[];
  onSyncCalendar: (programName: string, universityName: string, deadlineDate: string) => Promise<boolean>;
  onAutoMatchFiles: () => void;
}

export default function Dashboard({
  profile,
  documents,
  applications,
  gmailConnected,
  onAutomate,
  onRefreshApplications,
  onChangeTab,
  programs = [],
  scholarships = [],
  onSyncCalendar,
  onAutoMatchFiles
}: DashboardProps) {
  const [selectedLogsApp, setSelectedLogsApp] = useState<ApplicationRecord | null>(null);
  
  // Track synced states locally for instant HUD feedback
  const [syncedApps, setSyncedApps] = useState<{ [appId: string]: boolean }>({});
  const [syncingAppId, setSyncingAppId] = useState<string | null>(null);

  // Helper to calculate automation progress percentage
  const getAutomationProgress = (app: ApplicationRecord) => {
    if (app.status === 'Submitted') return 100;
    if (app.status === 'Draft') return 0;
    if (!app.automationSteps || app.automationSteps.length === 0) return 0;
    const completedCount = app.automationSteps.filter(s => s.status === 'completed').length;
    return Math.round((completedCount / app.automationSteps.length) * 100);
  };

  // Check which document types are uploaded
  const hasCV = documents.some(d => d.docType === 'CV' && d.status === 'completed');
  const hasTranscript = documents.some(d => d.docType === 'Transcript' && d.status === 'completed');
  const hasPassport = documents.some(d => d.docType === 'Passport' && d.status === 'completed');

  const completenessPercent = [hasCV, hasTranscript, hasPassport].filter(Boolean).length * 33.33;

  // Filter out running automated apps
  const activeAutomations = applications.filter(a => a.status === 'Automating');

  // Stats calculation
  const totalDrafted = applications.length;
  const totalSubmitted = applications.filter(a => a.status === 'Submitted').length;
  const totalGmailSent = applications.filter(a => a.gmailSent).length;

  const stats = [
    { label: 'Active Pipeline', value: totalDrafted, icon: Briefcase, color: 'bg-blue-50 text-blue-600', sub: 'Drafts and submissions' },
    { label: 'Portal Submissions', value: totalSubmitted, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600', sub: 'Completed robotic portals' },
    { label: 'Official Emails Sent', value: totalGmailSent, icon: Send, color: 'bg-indigo-50 text-indigo-600', sub: 'Official inbox logs verified' }
  ];

  // Helper to calculate days until deadline
  const getDaysRemaining = (deadlineStr?: string) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Google Calendar Sync handler
  const handleSyncToCalendar = async (appId: string, programName: string, universityName: string, deadlineDate: string) => {
    setSyncingAppId(appId);
    try {
      const success = await onSyncCalendar(programName, universityName, deadlineDate);
      if (success) {
        setSyncedApps(prev => ({ ...prev, [appId]: true }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingAppId(null);
    }
  };

  // Auto-match matching scholarships (e.g., matching student nationality or major)
  const recommendedScholarships = scholarships
    .filter(s => {
      const matchesGpa = !profile.gpa || s.minGpa <= profile.gpa;
      const matchesDegree = !profile.highestDegree || s.eligibleDegreeLevels.some(dl => 
        profile.highestDegree.toLowerCase().includes(dl.toLowerCase()) || dl.toLowerCase() === 'all'
      );
      return matchesGpa && matchesDegree;
    })
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in relative z-10 text-slate-200">
      
      {/* 1. Header Banner */}
      <div className="glass-card-dark rounded-xl p-6 text-white relative overflow-hidden shadow-xl border border-white/10">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-blue-500/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-400 border border-blue-500/20">
            <Activity className="h-3.5 w-3.5 text-blue-400" />
            Admissions Dashboard
          </span>
          <h1 className="text-2xl font-light tracking-tight">
            Hi, {profile.firstName || 'Future Student'}
          </h1>
          <p className="text-slate-200 text-xs md:text-sm leading-relaxed">
            Welcome to your centralized admissions hub. Track deadlines, synchronize application timelines to Google Calendar, and complete your checklist to activate "One-Apply" automation.
          </p>
        </div>
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-card-dark rounded-xl p-5 shadow-lg border border-white/5 text-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{stat.label}</span>
                <div className={`p-1.5 rounded-sm ${stat.color} bg-white/5`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-light text-white tracking-tight">{stat.value}</span>
                <p className="text-[10px] text-slate-400 font-mono mt-1">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Live Active One-Apply Automation Trackers */}
      {activeAutomations.length > 0 && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 backdrop-blur-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4.5 w-4.5 text-blue-400 animate-spin" />
              <h2 className="text-sm font-bold text-blue-300 uppercase tracking-wider font-sans">
                Active "One-Apply" Robotics Submission in Progress
              </h2>
            </div>
            <button 
              onClick={onRefreshApplications}
              className="flex items-center gap-1 text-[11px] text-blue-300 hover:text-white font-bold uppercase tracking-wider cursor-pointer bg-transparent border-0"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh status
            </button>
          </div>

          {activeAutomations.map(app => {
            const program = programs.find(p => p.id === app.programId);
            const progress = getAutomationProgress(app);

            return (
              <div key={app.id} className="glass-card-dark rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                  <div>
                    <h3 className="font-semibold text-white text-xs uppercase tracking-wide">
                      Target: {program?.name} at {program?.universityName} ({program?.country})
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Application No: {app.applicationNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 animate-pulse uppercase tracking-wider">
                      Automating
                    </span>
                    <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-500/10">
                      {progress}%
                    </span>
                  </div>
                </div>

                {/* Live Horizontal Progress Bar */}
                <div className="space-y-1 bg-slate-950/20 p-2.5 rounded-lg border border-white/5">
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Progress pipeline */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {app.automationSteps.map((step, idx) => {
                    const isActive = step.status === 'active';
                    const isCompleted = step.status === 'completed';

                    return (
                      <div 
                        key={idx} 
                        className={`rounded-lg p-2.5 border text-xs text-left ${
                          isActive 
                            ? 'border-blue-500/50 bg-blue-500/10 text-blue-200 font-medium' 
                            : isCompleted 
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' 
                              : 'border-white/5 bg-white/5 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {isCompleted ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400 bg-emerald-500/20 rounded-full p-0.5" />
                          ) : isActive ? (
                            <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border border-slate-500 flex items-center justify-center text-[8px] font-bold">
                              {idx + 1}
                            </div>
                          )}
                          <span className="font-bold uppercase tracking-tight text-[10px] truncate">{step.label}</span>
                        </div>
                        {step.details && (
                          <p className="text-[9px] text-slate-400 mt-1 leading-normal truncate">{step.details}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Interactive Timeline & SmartDeadlines */}
      {applications.length > 0 && (
        <div className="glass-card-dark rounded-xl p-5 shadow-lg border border-white/5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                Smart Deadlines & Application Timeline
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Chronological Sorting</span>
          </div>

          <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
            {applications.map((app) => {
              const program = programs.find(p => p.id === app.programId);
              if (!program) return null;

              const daysRemaining = getDaysRemaining(program.applicationDeadline);
              const isUrgent = daysRemaining !== null && daysRemaining <= 30;
              const isOverdue = daysRemaining !== null && daysRemaining < 0;

              // Check readiness
              const requiredDocs = program.requiredDocuments || [];
              const missingDocs = requiredDocs.filter(d => !app.linkedDocuments[d]);
              const readinessPercent = Math.round(((requiredDocs.length - missingDocs.length) / requiredDocs.length) * 100);

              const isSynced = syncedApps[app.id];

              return (
                <div key={app.id} className="flex gap-4 relative animate-fade-in">
                  {/* Timeline dot */}
                  <div className={`h-9 w-9 rounded-full border-2 flex items-center justify-center z-10 shrink-0 ${
                    app.status === 'Submitted' 
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/25' 
                      : app.status === 'Automating'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-blue-500/25 animate-pulse'
                        : isUrgent 
                          ? 'bg-amber-500 border-amber-500 text-white shadow-amber-500/25' 
                          : 'bg-slate-800 border-white/10 text-slate-300'
                  }`}>
                    {app.status === 'Submitted' ? (
                      <Check className="h-4.5 w-4.5" />
                    ) : app.status === 'Automating' ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>

                  {/* Content card */}
                  <div className="flex-1 glass-card-dark rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                    <div className="space-y-3 flex-1">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-white text-xs uppercase tracking-wide">{program.name}</h4>
                          <span className="font-semibold text-[10px] text-slate-400 font-mono">• {program.universityName}</span>
                          
                          {/* Smart deadline status */}
                          {daysRemaining !== null && app.status !== 'Automating' && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider font-mono ${
                              isOverdue 
                                ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                                : isUrgent 
                                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                                  : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                            }`}>
                              {isOverdue ? 'Overdue' : `${daysRemaining} Days Left`}
                            </span>
                          )}
                          {app.status === 'Automating' && (
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 animate-pulse">
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              Automating ({getAutomationProgress(app)}%)
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Deadline: {program.applicationDeadline} • {program.city}, {program.country}</p>
                      </div>

                      {/* Live Automation Progress Bar */}
                      {app.status === 'Automating' && (
                        <div className="space-y-1.5 bg-blue-950/20 border border-blue-500/10 p-3 rounded-lg">
                          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-blue-300 font-sans">
                            <span className="flex items-center gap-1.5">
                              <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                              Robotic Handshake Progress
                            </span>
                            <span className="font-mono">{getAutomationProgress(app)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-500 ease-out"
                              style={{ width: `${getAutomationProgress(app)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Milestone progression bar */}
                      <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        <div className="space-y-1">
                          <div className="h-1 bg-emerald-500 rounded" />
                          <span className="text-emerald-400">1. Drafted</span>
                        </div>
                        <div className="space-y-1">
                          <div className={`h-1 rounded ${missingDocs.length === 0 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                          <span className={missingDocs.length === 0 ? 'text-emerald-400' : ''}>2. Matched</span>
                        </div>
                        <div className="space-y-1">
                          <div className={`h-1 rounded ${hasCV || hasTranscript ? 'bg-emerald-500' : 'bg-white/10'}`} />
                          <span className={hasCV || hasTranscript ? 'text-emerald-400' : ''}>3. Tailored</span>
                        </div>
                        <div className="space-y-1">
                          <div className={`h-1 rounded ${app.status === 'Submitted' ? 'bg-emerald-500' : 'bg-white/10'}`} />
                          <span className={app.status === 'Submitted' ? 'text-emerald-400' : ''}>4. Dispatched</span>
                        </div>
                      </div>

                      {/* smart alert feedback */}
                      <div className="bg-[#0e1726]/85 backdrop-blur-md p-3 rounded border border-white/5 flex items-start gap-2 text-[11px] leading-relaxed">
                        {missingDocs.length > 0 ? (
                          <div className="flex flex-col gap-2 w-full">
                            <span className="text-slate-300 font-medium">
                              ⚠️ <strong className="text-amber-300">Action Required:</strong> Missing {missingDocs.join(', ')}. Link files below to enable "One-Apply" automation.
                            </span>
                            <button
                              onClick={onAutoMatchFiles}
                              className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 rounded uppercase tracking-wider transition-all self-start cursor-pointer border border-blue-500/20"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                              Auto-Match Vault Files
                            </button>
                          </div>
                        ) : app.status === 'Draft' ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="text-slate-300 font-medium">
                              ✅ <strong className="text-emerald-300">Ready to Submit:</strong> Checklist complete! Click "One-Apply" below to execute robotic admissions handshake.
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="text-slate-300 font-medium">
                              🚀 <strong className="text-emerald-300">Dispatched:</strong> Portal automated and real-time verification logged on {app.gmailSent ? 'Gmail' : 'API Log'}.
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-end">
                      {isSynced ? (
                        <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-500/20 flex items-center gap-1 font-mono justify-center">
                          <Check className="h-3 w-3" /> Synced to Calendar
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSyncToCalendar(app.id, program.name, program.universityName, program.applicationDeadline)}
                          disabled={syncingAppId === app.id}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1 font-mono justify-center shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {syncingAppId === app.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Calendar className="h-3 w-3 text-slate-300" />
                          )}
                          Add to Calendar
                        </button>
                      )}

                      {app.status === 'Draft' ? (
                        <button
                          onClick={() => onAutomate(app.id)}
                          disabled={missingDocs.length > 0}
                          className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded text-center transition-all ${
                            missingDocs.length > 0 
                              ? 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer'
                          }`}
                        >
                          Execute One-Apply
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedLogsApp(app)}
                          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider rounded text-center cursor-pointer flex items-center justify-center gap-1 border border-white/5"
                        >
                          <Eye className="h-3 w-3" /> View Log
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Main Grid: Profile Completeness & Submissions Central */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Completeness card */}
        <div className="glass-card-dark rounded-xl p-5 shadow-lg border border-white/5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans">
            Core Documents & Profile
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Required Files Uploaded</span>
              <span>{Math.round(completenessPercent)}%</span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 w-full bg-white/10 rounded overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${completenessPercent}%` }}
              />
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {[
              { type: 'Transcript', status: hasTranscript, desc: 'Academic Grade Records' },
              { type: 'CV', status: hasCV, desc: 'Curriculum Vitae / Resume' },
              { type: 'Passport', status: hasPassport, desc: 'Government Identification' }
            ].map(file => (
              <div key={file.type} className="flex items-center justify-between py-3">
                <div className="flex items-start gap-2">
                  <FileText className={`h-4 w-4 mt-0.5 ${file.status ? 'text-blue-400' : 'text-slate-500'}`} />
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-tight">{file.type}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{file.desc}</p>
                  </div>
                </div>
                {file.status ? (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                    <Check className="h-3 w-3 text-emerald-400" />
                    Verified
                  </span>
                ) : (
                  <button 
                    onClick={() => onChangeTab('documents')}
                    className="text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 cursor-pointer bg-transparent border-0 font-sans"
                  >
                    Upload File
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Central Dashboard: Submissions Track */}
        <div className="lg:col-span-2 glass-card-dark rounded-xl p-5 shadow-lg border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans">
              Centralized Application Dashboard
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={onAutoMatchFiles}
                className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer border border-indigo-500/20 shadow-md shadow-indigo-600/15"
                title="Automatically match verified files from Document Vault to your drafts"
              >
                <Sparkles className="h-3 w-3 text-indigo-200 animate-pulse" />
                Auto-Match Files
              </button>
              <button 
                onClick={onRefreshApplications}
                className="text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 bg-transparent border-0 cursor-pointer font-sans"
              >
                Refresh Table
              </button>
            </div>
          </div>

          {applications.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Briefcase className="h-8 w-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">No applications drafted or submitted yet.</p>
              <button 
                onClick={() => onChangeTab('programs')}
                className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-400 hover:underline cursor-pointer bg-transparent border-0 font-sans"
              >
                Browse Programs <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="pb-3 font-semibold">Program</th>
                    <th className="pb-3 font-semibold">Documents Linked</th>
                    <th className="pb-3 font-semibold">Automated Email</th>
                    <th className="pb-3 font-semibold">Portal Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {applications.map(app => {
                    const program = programs.find(p => p.id === app.programId);
                    const docsCount = Object.keys(app.linkedDocuments).length;

                    // Compute missing files
                    const required = program?.requiredDocuments || [];
                    const missing = required.filter(type => !app.linkedDocuments[type]);

                    return (
                      <tr key={app.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4">
                          <div className="flex items-start gap-2">
                            <span className="text-xl mt-0.5">{program?.logo || '🎓'}</span>
                            <div>
                              <span className="font-bold text-white">{program?.name}</span>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{program?.universityName} • {program?.country}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-300">
                              {docsCount} / {required.length} Matched
                            </span>
                            {missing.length > 0 && (
                              <div className="space-y-0.5">
                                <p className="text-[9px] text-red-400 font-bold uppercase tracking-tight">
                                  Missing: {missing.join(', ')}
                                </p>
                                <button
                                  onClick={onAutoMatchFiles}
                                  className="flex items-center gap-0.5 text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wide bg-transparent border-0 p-0 cursor-pointer"
                                  title="Scan vault and auto-match files"
                                >
                                  <Sparkles className="h-2.5 w-2.5 animate-pulse text-blue-400" /> Auto-Match
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          {app.gmailSent ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                              <Check className="h-3 w-3 text-emerald-400" />
                              Gmail Dispatched
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Not Triggered</span>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-1 w-28">
                            <span className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider self-start ${
                              app.status === 'Draft' 
                                ? 'bg-white/5 text-slate-300 border border-white/5' 
                                : app.status === 'Automating'
                                  ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                                  : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            }`}>
                              {app.status === 'Automating' ? (
                                <span className="flex items-center gap-1 animate-pulse">
                                  <Loader2 className="h-2.5 w-2.5 animate-spin text-blue-400" />
                                  Automating
                                </span>
                              ) : app.status}
                            </span>
                            {app.status === 'Automating' && (
                              <div className="space-y-0.5">
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-500"
                                    style={{ width: `${getAutomationProgress(app)}%` }}
                                  />
                                </div>
                                <span className="text-[8px] font-mono text-blue-400 font-bold">{getAutomationProgress(app)}% Done</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedLogsApp(app)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded border border-transparent hover:border-white/10 transition-colors cursor-pointer"
                              title="View Application Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {app.status === 'Draft' && (
                              <button
                                onClick={() => onAutomate(app.id)}
                                disabled={missing.length > 0}
                                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded transition-colors ${
                                  missing.length > 0
                                    ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-lg shadow-blue-500/20'
                                }`}
                              >
                                One-Apply
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 5. Recommended Scholarships section */}
      <div className="glass-card-dark rounded-xl p-5 shadow-lg border border-white/5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans flex items-center gap-1.5">
          <Award className="h-4 w-4 text-indigo-400" />
          Matched Scholarships Recommended For You
        </h2>
        
        {recommendedScholarships.length === 0 ? (
          <p className="text-xs text-slate-400">Update your GPA and Academic Records in the Profile panel to find eligible financial support matches.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedScholarships.map(s => (
              <div key={s.id} className="rounded border border-white/5 bg-white/5 p-4 flex flex-col justify-between hover:border-blue-500/50 hover:bg-white/10 transition-colors">
                <div>
                  <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold text-indigo-300 uppercase border border-indigo-500/20">
                    {s.awardType}
                  </span>
                  <h3 className="font-bold text-white mt-2 text-xs uppercase tracking-wide line-clamp-1">{s.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{s.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-mono">Award Amount</span>
                    <p className="text-xs font-bold text-emerald-400">
                      {s.awardAmount ? `${s.awardAmount.toLocaleString()} ${s.currency}` : 'Full Funding'}
                    </p>
                  </div>
                  <button 
                    onClick={() => onChangeTab('scholarships')}
                    className="p-1 text-blue-400 hover:text-blue-300 hover:bg-white/5 rounded transition-colors cursor-pointer bg-transparent border-0"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logs Details Modal */}
      {selectedLogsApp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-card-dark text-white rounded-xl border border-white/10 p-6 max-w-xl w-full shadow-2xl space-y-4 animate-slide-up">
            <div className="flex justify-between items-start border-b border-white/5 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                  Automated Application Log
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  {programs.find(p => p.id === selectedLogsApp.programId)?.name} • {selectedLogsApp.applicationNumber}
                </p>
              </div>
              <button 
                onClick={() => setSelectedLogsApp(null)}
                className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer bg-transparent border-0"
              >
                Close
              </button>
            </div>

            <div className="bg-slate-950 rounded p-4 font-mono text-[10px] text-emerald-400 space-y-1.5 max-h-64 overflow-y-auto">
              {selectedLogsApp.logs.map((log, index) => (
                <div key={index} className="leading-relaxed">
                  <span className="text-blue-400">uniapply-bot:</span> {log}
                </div>
              ))}
            </div>

            {selectedLogsApp.gmailSent && (() => {
              const uName = programs.find(p => p.id === selectedLogsApp.programId)?.universityName || '';
              const targetEmail = getUniversityAdmissionsEmail(uName);
              return (
                <div className="rounded border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 space-y-1.5">
                  <p className="font-bold flex items-center gap-1 uppercase tracking-wide text-[10px]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Real Gmail Confirmation Sent Successfully
                  </p>
                  <p className="text-emerald-400 leading-normal">
                    An official application summary was emailed to the chosen university admissions address <strong className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">{targetEmail}</strong> on your behalf using your linked Google account (Message ID: <span className="font-mono text-[9px] bg-emerald-500/20 px-1 py-0.5 rounded">{selectedLogsApp.gmailReceiptId || 'N/A'}</span>).
                  </p>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLogsApp(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer border border-white/10"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
