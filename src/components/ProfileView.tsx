import React, { useState } from 'react';
import { 
  User, Check, Globe, GraduationCap, Phone, Sparkles, BookOpen, AlertCircle, 
  MapPin, Clipboard, FileText, CheckCircle2, RefreshCw, ChevronDown
} from 'lucide-react';
import { StudentProfile, DocumentRecord } from '../types';

const PREDEFINED_DEGREES = [
  "High School Diploma",
  "College Freshman (1st Year) - Transfer seeker",
  "College Sophomore (2nd Year) - Transfer seeker",
  "College Junior (3rd Year) - Transfer seeker",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD"
];

interface ProfileViewProps {
  profile: StudentProfile;
  documents: DocumentRecord[];
  onUpdateProfile: (p: StudentProfile, silent?: boolean) => Promise<void>;
  onChangeTab: (tab: string) => void;
}

export default function ProfileView({
  profile,
  documents,
  onUpdateProfile,
  onChangeTab
}: ProfileViewProps) {
  const [editedProfile, setEditedProfile] = useState<StudentProfile>({ ...profile });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'editing' | 'saving' | 'saved' | 'error'>('idle');
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'initials' | 'lorelei' | 'avataaars' | 'bottts' | 'adventurer'>('initials');
  const [avatarVibe, setAvatarVibe] = useState<string | null>(null);

  const handleGenerateAvatar = async () => {
    setGeneratingAvatar(true);
    setAvatarError(null);
    setAvatarVibe(null);
    try {
      const res = await fetch('/api/profile/generate-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': profile.email
        },
        body: JSON.stringify({ style: selectedStyle })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate profile avatar.');
      }
      const data = await res.json();
      if (data.avatarUrl) {
        const updated = { ...editedProfile, avatarUrl: data.avatarUrl };
        setEditedProfile(updated);
        await onUpdateProfile(updated);
        if (data.fallback) {
          setAvatarVibe('fallback');
        } else {
          setAvatarVibe('imagen');
        }
      }
    } catch (err: any) {
      console.error(err);
      setAvatarError(err.message || 'Error generating academic portrait.');
    } finally {
      setGeneratingAvatar(false);
    }
  };

  // Sync edits if parent profile changes (e.g. from document extraction auto-fill)
  React.useEffect(() => {
    // Only overwrite editedProfile if it's identical to parent profile or if parent profile just got loaded/updated from server
    const isDifferent = JSON.stringify(editedProfile) !== JSON.stringify(profile);
    if (!isDifferent) return;
    
    // If they aren't actively being saved, we can safely sync them
    if (autosaveStatus === 'idle' || autosaveStatus === 'saved') {
      setEditedProfile({ ...profile });
    }
  }, [profile]);

  // Automatic silent autosave when edits happen
  React.useEffect(() => {
    const isDifferent = JSON.stringify(editedProfile) !== JSON.stringify(profile);
    if (!isDifferent) return;

    setAutosaveStatus('editing');

    const timer = setTimeout(async () => {
      setAutosaveStatus('saving');
      try {
        await onUpdateProfile(editedProfile, true); // true for silent mode
        setAutosaveStatus('saved');
        const resetTimer = setTimeout(() => {
          setAutosaveStatus('idle');
        }, 2000);
        return () => clearTimeout(resetTimer);
      } catch (err) {
        setAutosaveStatus('error');
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [editedProfile, profile, onUpdateProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await onUpdateProfile(editedProfile);
      setSuccess(true);
      setAutosaveStatus('saved');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Find verification documents
  const cvDoc = documents.find(d => d.docType === 'CV' && d.status === 'completed');
  const transcriptDoc = documents.find(d => d.docType === 'Transcript' && d.status === 'completed');
  const passportDoc = documents.find(d => d.docType === 'Passport' && d.status === 'completed');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in relative z-10 text-slate-200">
      
      {/* Left Column: Academic Credentials Overview (verified by Gemini) */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Imagen Academic Avatar Card */}
        <div className="glass-card-dark rounded-xl border border-white/5 p-5 shadow-xl space-y-4 relative overflow-hidden group">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-blue-400 fill-blue-500/10 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans">
                Academic Portrait Studio
              </h2>
            </div>
            {editedProfile.avatarUrl && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border font-mono ${
                avatarVibe === 'fallback' || editedProfile.avatarUrl.includes('dicebear.com')
                  ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              }`}>
                {avatarVibe === 'fallback' || editedProfile.avatarUrl.includes('dicebear.com') ? 'Personalized Vector' : 'Imagen Photorealistic'}
              </span>
            )}
          </div>

          <div className="flex flex-col items-center text-center space-y-4 py-2">
            <div className="relative">
              {editedProfile.avatarUrl ? (
                <img 
                  src={editedProfile.avatarUrl} 
                  alt="Academic Avatar" 
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-500/30 shadow-lg shadow-blue-500/10"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-500 text-3xl font-extrabold uppercase font-sans">
                  {editedProfile.firstName?.[0] || editedProfile.lastName?.[0] || 'U'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1.5 border border-slate-900 shadow-md">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white tracking-wide">
                Professional Student Persona
              </h3>
              <p className="text-[10px] text-slate-400 leading-normal max-w-xs">
                AI designs a tailor-made portrait using your background. If your Gemini model quota is limited, a high-fidelity vector representation is crafted!
              </p>
            </div>

            {/* Custom Style Selector Vibe */}
            <div className="w-full space-y-1.5 text-left bg-slate-950/40 p-2.5 rounded-lg border border-white/5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Select Vibe/Style
              </label>
              <div className="relative">
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer appearance-none pr-8 font-sans font-medium"
                >
                  <option value="initials">🔠 Gradient Initials (Corporate)</option>
                  <option value="lorelei">🎨 Artistic Sketches (Creative)</option>
                  <option value="avataaars">🧑‍🎓 Flat Illustrated (Academic)</option>
                  <option value="bottts">🤖 Sci-Fi Android (Tech/STEM)</option>
                  <option value="adventurer">🏕️ Academic Adventurer (Global Explorer)</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="button"
              disabled={generatingAvatar}
              onClick={handleGenerateAvatar}
              className={`w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-widest rounded border border-blue-500/30 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                generatingAvatar ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {generatingAvatar ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Orchestrating Vibe...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-blue-200 fill-white/10" />
                  {editedProfile.avatarUrl ? 'Design New Portrait' : 'Paint My Portrait'}
                </>
              )}
            </button>
            
            {avatarError && (
              <p className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg leading-normal w-full text-left font-mono">
                {avatarError}
              </p>
            )}
          </div>
        </div>

        {/* Verification Status Card */}
        <div className="glass-card-dark rounded-xl border border-white/5 p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-1.5 border-b border-white/5 pb-3">
            <GraduationCap className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans">
              AI Verification HUD
            </h2>
          </div>

          <p className="text-xs text-slate-300 leading-normal">
            Your profile details are cross-referenced with your uploaded credentials in the secure Document Vault.
          </p>

          <div className="space-y-3 pt-1 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-[#0e1726]/80">
              <span className="font-bold text-white">GPA Verification</span>
              {transcriptDoc ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/20 font-mono">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Verified: {transcriptDoc.extractedData?.gpa || profile.gpa}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/20">
                  <AlertCircle className="h-3 w-3 text-amber-400" />
                  Upload Transcript
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-[#0e1726]/80">
              <span className="font-bold text-white">Identity / Nationality</span>
              {passportDoc ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/20 font-mono">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Verified: {passportDoc.extractedData?.nationality || profile.nationality}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/20">
                  <AlertCircle className="h-3 w-3 text-amber-400" />
                  Upload Passport
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-[#0e1726]/80">
              <span className="font-bold text-white">CV & Career Sync</span>
              {cvDoc ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/20 font-mono">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Synced
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/20">
                  <AlertCircle className="h-3 w-3 text-amber-400" />
                  Upload CV
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => onChangeTab('documents')}
            className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest rounded border border-white/10 transition-colors cursor-pointer"
          >
            Manage Credentials
          </button>
        </div>

        {/* Rapid AI Advice Box */}
        <div className="glass-card-dark border border-white/10 rounded-xl p-5 text-white space-y-3 shadow-xl">
          <div className="flex items-center gap-1.5 text-indigo-400">
            <Sparkles className="h-4.5 w-4.5 animate-pulse fill-indigo-500/20" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Admissions Blueprint</h3>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Your GPA of <strong>{profile.gpa || '0.00'}</strong> converts to roughly <strong>{(profile.gpa * 2.5).toFixed(1)}/10</strong> in many Asian and European percentage scales. Use our <strong>Document Tailor</strong> in the Vault to optimize standard CV formats.
          </p>
        </div>
      </div>

      {/* Right Column: Full Student profile form editor */}
      <div className="lg:col-span-2 rounded-xl border border-white/5 bg-[#0f172a]/60 backdrop-blur-md p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-1.5">
            <User className="h-5 w-5 text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans">
              Edit Application Profile
            </h2>
          </div>
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/15 px-2 py-0.5 text-[9px] font-bold text-blue-300 uppercase tracking-wider border border-blue-500/25">
            <Sparkles className="h-3.5 w-3.5 text-blue-400 fill-blue-500/10 animate-pulse" />
            Gemini Auto-filled
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1 font-mono">
                First Name
              </label>
              <input
                type="text"
                required
                value={editedProfile.firstName}
                onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1 font-mono">
                Last Name
              </label>
              <input
                type="text"
                required
                value={editedProfile.lastName}
                onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1 font-mono">
                Email
              </label>
              <input
                type="email"
                required
                value={editedProfile.email}
                onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                className="w-full px-3 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1 font-mono">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={editedProfile.phone}
                  onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1 font-mono">
                Nationality
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Germany, Austria, France..."
                  value={editedProfile.nationality}
                  onChange={(e) => setEditedProfile({ ...editedProfile, nationality: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1 font-mono">
                Country of Residence
              </label>
              <input
                type="text"
                required
                value={editedProfile.countryOfResidence}
                onChange={(e) => setEditedProfile({ ...editedProfile, countryOfResidence: e.target.value })}
                className="w-full px-3 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1 font-mono">
                Highest Degree / College Status
              </label>
              <div className="relative">
                <select
                  value={PREDEFINED_DEGREES.includes(editedProfile.highestDegree) || editedProfile.highestDegree === '' ? editedProfile.highestDegree : 'Other'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Other') {
                      setEditedProfile({ ...editedProfile, highestDegree: 'Other Degree' });
                    } else {
                      setEditedProfile({ ...editedProfile, highestDegree: val });
                    }
                  }}
                  className="w-full pl-3 pr-8 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#131b2e] text-white appearance-none cursor-pointer"
                >
                  <option value="">Select highest level / college year...</option>
                  <optgroup label="Standard Degrees">
                    <option value="High School Diploma">High School Diploma</option>
                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                    <option value="Master's Degree">Master's Degree</option>
                    <option value="PhD">PhD</option>
                  </optgroup>
                  <optgroup label="College Transfers (In Progress)">
                    <option value="College Freshman (1st Year) - Transfer seeker">College Freshman (1st Year)</option>
                    <option value="College Sophomore (2nd Year) - Transfer seeker">College Sophomore (2nd Year)</option>
                    <option value="College Junior (3rd Year) - Transfer seeker">College Junior (3rd Year)</option>
                  </optgroup>
                  <option value="Other">Other (Specify custom...)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {!(PREDEFINED_DEGREES.includes(editedProfile.highestDegree) || editedProfile.highestDegree === '') && (
                <div className="mt-2 animate-fade-in">
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Specify your custom degree or college status..."
                      value={editedProfile.highestDegree}
                      onChange={(e) => setEditedProfile({ ...editedProfile, highestDegree: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1 font-mono">
                  GPA
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editedProfile.gpa}
                  onChange={(e) => setEditedProfile({ ...editedProfile, gpa: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-400 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1 font-mono">
                  GPA Scale
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editedProfile.gpaScale}
                  onChange={(e) => setEditedProfile({ ...editedProfile, gpaScale: parseFloat(e.target.value) || 4.0 })}
                  className="w-full px-3 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1 font-mono">
                Major Interest
              </label>
              <input
                type="text"
                required
                placeholder="Computer Science, Business..."
                value={editedProfile.majorInterest}
                onChange={(e) => setEditedProfile({ ...editedProfile, majorInterest: e.target.value })}
                className="w-full px-3 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1 font-mono">
                Languages (comma separated)
              </label>
              <input
                type="text"
                placeholder="English, French, German"
                value={editedProfile.languages.join(', ')}
                onChange={(e) => setEditedProfile({ 
                  ...editedProfile, 
                  languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                })}
                className="w-full px-3 py-2 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-400 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5 gap-3 items-center">
            {autosaveStatus === 'editing' && (
              <span className="text-slate-400 text-xs font-mono animate-pulse">
                Unsaved changes...
              </span>
            )}
            {autosaveStatus === 'saving' && (
              <span className="text-blue-400 text-xs font-mono animate-pulse flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" /> Autosaving...
              </span>
            )}
            {autosaveStatus === 'saved' && (
              <span className="text-emerald-400 text-xs font-mono flex items-center gap-1 animate-fade-in">
                <Check className="h-3.5 w-3.5 text-emerald-400" /> Progress autosaved
              </span>
            )}
            {autosaveStatus === 'error' && (
              <span className="text-red-400 text-xs font-mono">
                Autosave failed
              </span>
            )}
            {success && (
              <span className="text-emerald-400 text-xs font-bold animate-fade-in flex items-center gap-1 font-mono">
                <Check className="h-4 w-4" /> Sync complete
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:bg-white/10 disabled:text-slate-500 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Synchronizing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Student Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
