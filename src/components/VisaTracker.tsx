import React, { useState, useEffect } from 'react';
import { 
  Compass, Calendar, MapPin, CheckCircle2, AlertCircle, Sparkles, Clock, 
  ArrowRight, FileText, Check, Loader2, Activity, Globe, ShieldCheck, 
  DollarSign, Landmark, Heart, ClipboardCheck, Info, RefreshCw
} from 'lucide-react';
import { StudentProfile, DocumentRecord, ApplicationRecord, VisaApplicationRecord, VisaStatus, VisaStep } from '../types';
import { UNIVERSITY_PROGRAMS } from '../data/eu_data';

interface VisaTrackerProps {
  profile: StudentProfile;
  documents: DocumentRecord[];
  applications: ApplicationRecord[];
  userEmail: string | null;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  triggerToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const EU_COUNTRIES = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 
  'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 
  'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 
  'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'
];

interface CountryVisaConfig {
  visaType: string;
  blockedAccountRequired: boolean;
  blockedAccountMinAmount: number;
  healthInsuranceType: string;
  checklist: {
    id: string;
    label: string;
    description: string;
    docTypeMatcher?: 'Passport' | 'Transcript' | 'CV' | 'Statement of Purpose';
  }[];
}

const COUNTRY_VISA_CONFIGS: Record<string, CountryVisaConfig> = {
  Germany: {
    visaType: 'Schengen National Visa Type D (Study)',
    blockedAccountRequired: true,
    blockedAccountMinAmount: 11904,
    healthInsuranceType: 'German Public (TK/AOK) or Schengen-compliant travel cover (Mawista)',
    checklist: [
      { id: 'ger-adm', label: 'Official University Admission Letter', description: 'Admission/offer letter from a German higher education institution.' },
      { id: 'ger-ba', label: 'German Blocked Bank Account Proof', description: 'Official funding confirmation of at least €11,904 (Fintiba, Expatrio, or Deutsche Bank).' },
      { id: 'ger-passport', label: 'Valid Passport & Photos', description: 'Original passport (valid for at least 6 months) and 2 recent biometric photos.', docTypeMatcher: 'Passport' },
      { id: 'ger-academic', label: 'Prior Academic Transcripts & Degrees', description: 'Apostilled or certified copies of secondary school and/or university degrees.', docTypeMatcher: 'Transcript' },
      { id: 'ger-lang', label: 'Language Proficiency Proof', description: 'TOEFL/IELTS for English programs, or TestDaF/Goethe-Zertifikat for German.' },
      { id: 'ger-ins', label: 'Travel & Student Health Insurance', description: 'Incoming travel health insurance before transitioning to student public health care.' }
    ]
  },
  France: {
    visaType: 'Long-Stay Visa (VLS-TS Student)',
    blockedAccountRequired: false,
    blockedAccountMinAmount: 0,
    healthInsuranceType: 'French National Student Social Security (Ameli.fr) + Private Travel Cover',
    checklist: [
      { id: 'fra-adm', label: 'Etudes en France (EEF) Acceptance Letter', description: 'Official confirmation letter downloaded from the Campus France Etudes en France platform.' },
      { id: 'fra-funds', label: 'Proof of Financial Resources', description: 'Bank statements or scholarship awards showing at least €615/month for the academic year.' },
      { id: 'fra-housing', label: 'Proof of Accommodation', description: 'Rental contract, hotel booking for the first 3 months, or host certificate (Attestation d\'hébergement).' },
      { id: 'fra-passport', label: 'Valid Passport Copy', description: 'Passport issued less than 10 years ago and valid for at least 3 months beyond visa expiry.', docTypeMatcher: 'Passport' },
      { id: 'fra-cv', label: 'Academic CV & Portfolio', description: 'Required for Campus France interview and visa assessment.', docTypeMatcher: 'CV' }
    ]
  },
  Austria: {
    visaType: 'Residence Permit Student (Aufenthaltsbewilligung Studierende)',
    blockedAccountRequired: false,
    blockedAccountMinAmount: 0,
    healthInsuranceType: 'Austrian National Health Insurance (ÖGK) or equivalent private coverage',
    checklist: [
      { id: 'aut-adm', label: 'Austrian University Admission Letter', description: 'Confirmation of admission from your chosen institution (e.g., University of Vienna).' },
      { id: 'aut-funds', label: 'Proof of Sufficient Financial Means', description: 'Under age 24: €650/month; Age 24+: €1,100/month. Secured via saving books or bank accounts.' },
      { id: 'aut-housing', label: 'Austrian Accommodation Proof', description: 'OeAD student housing agreement or a registered local rental contract (Mietvertrag).' },
      { id: 'aut-clear', label: 'Certified Police Clearance Certificate', description: 'Criminal background check from your home country, apostilled and translated.' },
      { id: 'aut-passport', label: 'Valid Passport & Travel Documents', description: 'Valid national passport.', docTypeMatcher: 'Passport' }
    ]
  },
  Sweden: {
    visaType: 'Residence Permit for Higher Education',
    blockedAccountRequired: false,
    blockedAccountMinAmount: 0,
    healthInsuranceType: 'Comprehensive Health Insurance if studies < 1 year; Swedish personal number coverage if > 1 year',
    checklist: [
      { id: 'swe-adm', label: 'Decision of Selection Results (Admission)', description: 'Notification of selection results from University Admissions Sweden (Antagning).' },
      { id: 'swe-funds', label: 'Proof of Financial Support', description: 'Proof of bank deposits showing at least SEK 10,314 per month for your study duration.' },
      { id: 'swe-passport', label: 'Copy of Passport Page with Details', description: 'Full page copy showing personal data, photo, signature, and validity dates.', docTypeMatcher: 'Passport' },
      { id: 'swe-cv', label: 'Academic Curriculum Vitae', description: 'Detailed academic background and references.', docTypeMatcher: 'CV' }
    ]
  },
  Spain: {
    visaType: 'Long-Term Student Visa (Visado de Estudios - Type D)',
    blockedAccountRequired: false,
    blockedAccountMinAmount: 0,
    healthInsuranceType: 'Public or private insurance with an entity authorized to operate in Spain',
    checklist: [
      { id: 'esp-adm', label: 'University Acceptance Letter (Carta de Aceptación)', description: 'Official letter from a Spanish university indicating full-time study registry.' },
      { id: 'esp-funds', label: 'Proof of Economic Means', description: 'Bank certificates showing at least €700/month (100% of IPREM index).' },
      { id: 'esp-ins', label: 'Spanish Authorized Health Insurance', description: 'Private medical insurance with full coverage, no co-payments, and zero deductibles.' },
      { id: 'esp-med', label: 'Official Medical Certificate', description: 'Doctor\'s note stating you do not suffer from any of the diseases quarantineable under International Health Regs.' },
      { id: 'esp-clear', label: 'Criminal Record Certificate', description: 'Background check legalized with Apostille of the Hague, translated into Spanish.', docTypeMatcher: 'Transcript' }
    ]
  },
  Standard: {
    visaType: 'National D Study Visa & Student Residence Permit',
    blockedAccountRequired: false,
    blockedAccountMinAmount: 0,
    healthInsuranceType: 'Schengen-compliant student health insurance policy with minimum €30,000 cover',
    checklist: [
      { id: 'std-adm', label: 'Official Admission or Offer Letter', description: 'Signed admission letter from the host European institution.' },
      { id: 'std-funds', label: 'Proof of Financial Sufficiency', description: 'Scholarship certificate, parental sponsorship affidavit, or personal bank statement.' },
      { id: 'std-passport', label: 'Valid Passport copy', description: 'Certified scan of passport identity and visa stamp pages.', docTypeMatcher: 'Passport' },
      { id: 'std-cv', label: 'Prior CV/Resumé', description: 'Details of prior educational and work history.', docTypeMatcher: 'CV' }
    ]
  }
};

const DEFAULT_STEPS: VisaStep[] = [
  { id: 'step-adm', label: 'Secure University Admission', description: 'Hold an active acceptance/admission offer letter from your university.', status: 'pending' },
  { id: 'step-fin', label: 'Prepare Proof of Financial Means', description: 'Setup blocked accounts, gather scholarship certificates, or compile bank records.', status: 'pending' },
  { id: 'step-ins', label: 'Arrange Student Health Insurance', description: 'Obtain local public health coverage or compliant international travel policy.', status: 'pending' },
  { id: 'step-book', label: 'Book Embassy Appointment', description: 'Schedule appointment at your local consulate or embassy.', status: 'pending' },
  { id: 'step-interview', label: 'Embassy Interview & Biometrics', description: 'Submit original files, passport, and fingerprints in person.', status: 'pending' },
  { id: 'step-decision', label: 'Visa Issuance & Passport Return', description: 'Consular processing and receipt of study visa stamp.', status: 'pending' }
];

export default function VisaTracker({
  profile,
  documents,
  applications,
  userEmail,
  apiFetch,
  triggerToast
}: VisaTrackerProps) {
  const [visas, setVisas] = useState<VisaApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'editing' | 'saving' | 'saved' | 'error'>('idle');

  // Form states for creating/editing a tracker
  const [selectedCountry, setSelectedCountry] = useState('Germany');
  const [visaType, setVisaType] = useState(COUNTRY_VISA_CONFIGS.Germany.visaType);
  const [status, setStatus] = useState<VisaStatus>('Not Started');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentLocation, setAppointmentLocation] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [blockedAccountStatus, setBlockedAccountStatus] = useState<'Not Required' | 'Required - Pending' | 'Blocked Account Funded'>('Required - Pending');
  const [healthInsuranceStatus, setHealthInsuranceStatus] = useState<'Pending' | 'Secured'>('Pending');
  
  // Local logs
  const [logs, setLogs] = useState<string[]>([]);

  // Selected active tracker to display
  const [activeTracker, setActiveTracker] = useState<VisaApplicationRecord | null>(null);

  // Autosave when form values change and they are different from existing activeTracker
  useEffect(() => {
    if (loading) return;

    const isDifferent = activeTracker 
      ? (
          selectedCountry !== activeTracker.country ||
          visaType !== activeTracker.visaType ||
          status !== activeTracker.status ||
          appointmentDate !== (activeTracker.appointmentDate || '') ||
          appointmentLocation !== (activeTracker.appointmentLocation || '') ||
          trackingNumber !== (activeTracker.trackingNumber || '') ||
          blockedAccountStatus !== activeTracker.blockedAccountStatus ||
          healthInsuranceStatus !== activeTracker.healthInsuranceStatus
        )
      : (
          // If no active tracker, check if user has input any real data
          appointmentDate !== '' ||
          appointmentLocation !== '' ||
          trackingNumber !== '' ||
          status !== 'Not Started' ||
          healthInsuranceStatus !== 'Pending' ||
          (blockedAccountStatus !== 'Required - Pending' && blockedAccountStatus !== 'Not Required')
        );

    if (!isDifferent) return;

    setAutosaveStatus('editing');

    const timer = setTimeout(async () => {
      setAutosaveStatus('saving');
      try {
        await handleSaveTracker(undefined, true); // true for silent mode
        setAutosaveStatus('saved');
        const resetTimer = setTimeout(() => {
          setAutosaveStatus('idle');
        }, 2000);
        return () => clearTimeout(resetTimer);
      } catch (err) {
        setAutosaveStatus('error');
      }
    }, 1200); // 1.2s debounce

    return () => clearTimeout(timer);
  }, [
    activeTracker,
    selectedCountry,
    visaType,
    status,
    appointmentDate,
    appointmentLocation,
    trackingNumber,
    blockedAccountStatus,
    healthInsuranceStatus,
    loading
  ]);

  // Fetch trackers on mount or email change
  const fetchVisas = async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/visas');
      if (res.ok) {
        const data = await res.json();
        setVisas(data);
        if (data.length > 0) {
          // Default to the first tracker or preserve active country
          setActiveTracker(data[0]);
        } else {
          // If no tracker, suggest based on student's submitted applications
          const acceptedOrSubmitted = applications.find(a => a.status === 'Accepted' || a.status === 'Submitted');
          if (acceptedOrSubmitted) {
            const program = UNIVERSITY_PROGRAMS.find(p => p.id === acceptedOrSubmitted.programId);
            if (program && EU_COUNTRIES.includes(program.country)) {
              setSelectedCountry(program.country);
              updateConfigForCountry(program.country);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching visas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisas();
  }, [userEmail]);

  // Sync state whenever active tracker changes
  useEffect(() => {
    if (activeTracker) {
      setSelectedCountry(activeTracker.country);
      setVisaType(activeTracker.visaType);
      setStatus(activeTracker.status);
      setAppointmentDate(activeTracker.appointmentDate || '');
      setAppointmentLocation(activeTracker.appointmentLocation || '');
      setTrackingNumber(activeTracker.trackingNumber || '');
      setBlockedAccountStatus(activeTracker.blockedAccountStatus);
      setHealthInsuranceStatus(activeTracker.healthInsuranceStatus);
      setLogs(activeTracker.logs || []);
    } else {
      updateConfigForCountry(selectedCountry);
    }
  }, [activeTracker]);

  const updateConfigForCountry = (country: string) => {
    const config = COUNTRY_VISA_CONFIGS[country] || COUNTRY_VISA_CONFIGS.Standard;
    setVisaType(config.visaType);
    setBlockedAccountStatus(config.blockedAccountRequired ? 'Required - Pending' : 'Not Required');
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    updateConfigForCountry(country);
  };

  // Build automatic document vault matcher
  const getDocumentMatch = (matcher?: string) => {
    if (!matcher) return null;
    const match = documents.find(d => d.docType === matcher && d.status === 'completed');
    return match || null;
  };

  // Helper to check if university acceptance letter exists in pipeline
  const getAdmissionLetterMatch = () => {
    const submittedOrAccepted = applications.filter(a => a.status === 'Submitted' || a.status === 'Accepted');
    if (submittedOrAccepted.length > 0) {
      // Find the first matching program
      const app = submittedOrAccepted[0];
      const program = UNIVERSITY_PROGRAMS.find(p => p.id === app.programId);
      return {
        universityName: program?.universityName || 'Partner EU Institution',
        programName: program?.name || 'Academic Degree',
        appNum: app.applicationNumber,
        status: app.status
      };
    }
    return null;
  };

  // Create or Update Visa Tracker
  const handleSaveTracker = async (e?: React.FormEvent, silent = false) => {
    if (e) e.preventDefault();
    if (!userEmail) return;

    setSaving(true);
    
    // Auto-calculate completed steps based on fields
    const admissionMatch = getAdmissionLetterMatch();
    const config = COUNTRY_VISA_CONFIGS[selectedCountry] || COUNTRY_VISA_CONFIGS.Standard;
    
    const stepsToSave = activeTracker ? [...activeTracker.steps] : JSON.parse(JSON.stringify(DEFAULT_STEPS));
    
    // Auto populate step states
    // Step 1: Admission
    if (admissionMatch) {
      const stepIdx = stepsToSave.findIndex((s: VisaStep) => s.id === 'step-adm');
      if (stepIdx !== -1) {
        stepsToSave[stepIdx].status = 'completed';
        stepsToSave[stepIdx].details = `Linked with active ${admissionMatch.status} application to ${admissionMatch.universityName} (${admissionMatch.appNum}).`;
      }
    }

    // Step 2: Finances
    const isBAComplete = !config.blockedAccountRequired || blockedAccountStatus === 'Blocked Account Funded';
    if (isBAComplete) {
      const stepIdx = stepsToSave.findIndex((s: VisaStep) => s.id === 'step-fin');
      if (stepIdx !== -1) {
        stepsToSave[stepIdx].status = 'completed';
        stepsToSave[stepIdx].details = config.blockedAccountRequired 
          ? `Verified: German Blocked Account loaded with €${config.blockedAccountMinAmount}.`
          : 'Verified: Sufficient monthly resources or scholarship certificate attached.';
      }
    } else {
      const stepIdx = stepsToSave.findIndex((s: VisaStep) => s.id === 'step-fin');
      if (stepIdx !== -1) {
        stepsToSave[stepIdx].status = 'pending';
      }
    }

    // Step 3: Insurance
    if (healthInsuranceStatus === 'Secured') {
      const stepIdx = stepsToSave.findIndex((s: VisaStep) => s.id === 'step-ins');
      if (stepIdx !== -1) {
        stepsToSave[stepIdx].status = 'completed';
        stepsToSave[stepIdx].details = `Insurer verified: ${config.healthInsuranceType.split(' or ')[0]}`;
      }
    } else {
      const stepIdx = stepsToSave.findIndex((s: VisaStep) => s.id === 'step-ins');
      if (stepIdx !== -1) {
        stepsToSave[stepIdx].status = 'pending';
      }
    }

    // Step 4: Appointment booked
    if (appointmentDate) {
      const stepIdx = stepsToSave.findIndex((s: VisaStep) => s.id === 'step-book');
      if (stepIdx !== -1) {
        stepsToSave[stepIdx].status = 'completed';
        stepsToSave[stepIdx].details = `Scheduled at ${appointmentLocation || 'Main Consulate'} for ${appointmentDate}.`;
      }
    }

    // Step 5: Submitted or Approved implies interview done
    if (status === 'Submitted' || status === 'Approved') {
      const stepIdx = stepsToSave.findIndex((s: VisaStep) => s.id === 'step-interview');
      if (stepIdx !== -1) {
        stepsToSave[stepIdx].status = 'completed';
        stepsToSave[stepIdx].details = `Biometrics captured. Application submitted under Ref: ${trackingNumber || 'Consulate-A8'}.`;
      }
    }

    // Step 6: Approved
    if (status === 'Approved') {
      const stepIdx = stepsToSave.findIndex((s: VisaStep) => s.id === 'step-decision');
      if (stepIdx !== -1) {
        stepsToSave[stepIdx].status = 'completed';
        stepsToSave[stepIdx].details = 'Visa Granted! Passport delivered back to applicant.';
      }
    } else if (status === 'Rejected') {
      const stepIdx = stepsToSave.findIndex((s: VisaStep) => s.id === 'step-decision');
      if (stepIdx !== -1) {
        stepsToSave[stepIdx].status = 'failed';
        stepsToSave[stepIdx].details = 'Visa Application Denied. Consult official referral or draft appeal document.';
      }
    }

    // Build log statement
    const newLogs = [...logs];
    const timestamp = new Date().toLocaleTimeString();
    if (!activeTracker) {
      newLogs.push(`[${timestamp}] Initiated study visa tracker for ${selectedCountry}.`);
    } else if (activeTracker.status !== status) {
      newLogs.push(`[${timestamp}] Updated visa file state: ${activeTracker.status} -> ${status}.`);
    } else {
      newLogs.push(`[${timestamp}] Saved visa dossier and appointment credentials.`);
    }

    const payload: Partial<VisaApplicationRecord> = {
      id: activeTracker?.id,
      country: selectedCountry,
      visaType,
      status,
      appointmentDate,
      appointmentLocation,
      trackingNumber,
      blockedAccountStatus,
      healthInsuranceStatus,
      steps: stepsToSave,
      logs: newLogs
    };

    try {
      const res = await apiFetch('/api/visas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const savedRecord = await res.json();
        if (!silent) {
          triggerToast(`Visa Tracker for ${selectedCountry} synchronized successfully!`, 'success');
        }
        
        // Refresh the local tracking list
        const resList = await apiFetch('/api/visas');
        if (resList.ok) {
          const freshData = await resList.json();
          setVisas(freshData);
          const updatedActive = freshData.find((v: VisaApplicationRecord) => v.country === selectedCountry);
          setActiveTracker(updatedActive || freshData[0]);
        }
      } else {
        const err = await res.json();
        if (!silent) {
          triggerToast(err.error || 'Failed to save visa tracker.', 'error');
        }
      }
    } catch (error) {
      if (!silent) {
        triggerToast('Network error while synchronizing visa record.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateEmbassyResponse = async (statusOverride: VisaStatus) => {
    if (!activeTracker) return;
    setSaving(true);
    try {
      const timestamp = new Date().toLocaleTimeString();
      const updatedLogs = [...logs, `[${timestamp}] Official consular notification parsed: Status modified to ${statusOverride}.`];
      
      const payload = {
        ...activeTracker,
        status: statusOverride,
        logs: updatedLogs,
        trackingNumber: trackingNumber || `EUV-${Math.floor(Math.random() * 900000 + 100000)}`
      };

      const res = await apiFetch('/api/visas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        triggerToast(`Consular update received: Visa ${statusOverride}!`, statusOverride === 'Approved' ? 'success' : 'info');
        fetchVisas();
      }
    } catch (e) {
      triggerToast('Failed to mock consulate return.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const config = COUNTRY_VISA_CONFIGS[selectedCountry] || COUNTRY_VISA_CONFIGS.Standard;
  const admissionLetterMatch = getAdmissionLetterMatch();
  
  // Overall progress percentage
  const completedStepsCount = activeTracker 
    ? activeTracker.steps.filter(s => s.status === 'completed').length 
    : 0;
  const progressPercent = activeTracker ? Math.round((completedStepsCount / activeTracker.steps.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in relative z-10 text-slate-200">
      
      {/* 1. Header block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-900/30 via-slate-900/40 to-indigo-950/20 border border-white/5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-10">
          <div className="liquid-orb-3 -top-24 -left-24" />
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Compass className="h-6 w-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-sans tracking-tight">EU Student Visa Tracker</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-lg">
              Synchronize university acceptance letters with country-specific consulate requirements, blocked account triggers, and document vaults.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          {visas.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-400">Active Dossier:</span>
              <select
                value={activeTracker?.id || ''}
                onChange={(e) => {
                  const selected = visas.find(v => v.id === e.target.value);
                  if (selected) setActiveTracker(selected);
                }}
                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                {visas.map(v => (
                  <option key={v.id} value={v.id}>{v.country} - {v.status}</option>
                ))}
              </select>
            </div>
          )}
          <button 
            onClick={fetchVisas}
            title="Refresh Consular Data"
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors cursor-pointer text-slate-300 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-white/5">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-400">Syncing official embassy checklists...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Block - Controls and Forms */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Dossier Configurator Card */}
            <div className="p-6 rounded-xl bg-slate-950/40 border border-white/5 shadow-xl space-y-5">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Globe className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Dossier Settings</h2>
              </div>

              <form onSubmit={handleSaveTracker} className="space-y-4">
                {/* Select country */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Country</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    disabled={saving || !!activeTracker}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium disabled:opacity-60"
                  >
                    {EU_COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                {/* Visa type label */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Visa Type</label>
                  <input
                    type="text"
                    value={visaType}
                    onChange={(e) => setVisaType(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                    placeholder="Visa type name"
                    required
                  />
                </div>

                {/* Application State */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Current Visa Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VisaStatus)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="Preparing Documents">Preparing Documents</option>
                    <option value="Appointment Scheduled">Appointment Scheduled</option>
                    <option value="Submitted">Submitted (Under Processing)</option>
                    <option value="Approved">Approved ✅</option>
                    <option value="Rejected">Rejected ❌</option>
                  </select>
                </div>

                {/* Blocked Account requirement helper (mostly Germany specific but good in general) */}
                {config.blockedAccountRequired && (
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                      <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider">Blocked Bank Account</span>
                    </div>
                    <p className="text-[10px] text-indigo-200/80 leading-normal">
                      German consulates strictly require confirmation of €{config.blockedAccountMinAmount} in a blocked account.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setBlockedAccountStatus('Required - Pending')}
                        className={`py-1 text-[9px] font-bold uppercase rounded ${
                          blockedAccountStatus === 'Required - Pending' 
                            ? 'bg-amber-600/30 text-amber-300 border border-amber-500/30' 
                            : 'bg-white/5 text-slate-400 border border-transparent'
                        }`}
                      >
                        Pending Funding
                      </button>
                      <button
                        type="button"
                        onClick={() => setBlockedAccountStatus('Blocked Account Funded')}
                        className={`py-1 text-[9px] font-bold uppercase rounded ${
                          blockedAccountStatus === 'Blocked Account Funded' 
                            ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-white/5 text-slate-400 border border-transparent'
                        }`}
                      >
                        Funded €{config.blockedAccountMinAmount}
                      </button>
                    </div>
                  </div>
                )}

                {/* Health Insurance State */}
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-extrabold text-blue-300 uppercase tracking-wider">Travel Health Insurance</span>
                  </div>
                  <p className="text-[10px] text-blue-200/80 leading-normal truncate">
                    {config.healthInsuranceType}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setHealthInsuranceStatus('Pending')}
                      className={`py-1 text-[9px] font-bold uppercase rounded ${
                        healthInsuranceStatus === 'Pending' 
                          ? 'bg-amber-600/30 text-amber-300 border border-amber-500/30' 
                          : 'bg-white/5 text-slate-400 border border-transparent'
                      }`}
                    >
                      Pending Secure
                    </button>
                    <button
                      type="button"
                      onClick={() => setHealthInsuranceStatus('Secured')}
                      className={`py-1 text-[9px] font-bold uppercase rounded ${
                        healthInsuranceStatus === 'Secured' 
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-white/5 text-slate-400 border border-transparent'
                      }`}
                    >
                      Secured Cover
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  {autosaveStatus === 'editing' && (
                    <div className="text-[10px] text-slate-400 font-mono text-center animate-pulse">
                      Unsaved changes (saving in a moment)...
                    </div>
                  )}
                  {autosaveStatus === 'saving' && (
                    <div className="text-[10px] text-blue-400 font-mono text-center animate-pulse flex items-center justify-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Synchronizing visa dossier...
                    </div>
                  )}
                  {autosaveStatus === 'saved' && (
                    <div className="text-[10px] text-emerald-400 font-mono text-center flex items-center justify-center gap-1 animate-fade-in">
                      <Check className="h-3.5 w-3.5 text-emerald-400" /> Dossier autosaved in cloud
                    </div>
                  )}
                  {autosaveStatus === 'error' && (
                    <div className="text-[10px] text-red-400 font-mono text-center">
                      Dossier autosave failed
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving Dossier...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>{activeTracker ? 'Update Active Dossier' : 'Initialize Visa File'}</span>
                      </>
                    )}
                  </button>
                </div>

                {activeTracker && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this visa tracker?')) {
                        try {
                          await apiFetch(`/api/visas/${activeTracker.id}`, { method: 'DELETE' });
                          triggerToast('Visa record removed.', 'info');
                          setActiveTracker(null);
                          fetchVisas();
                        } catch (err) {
                          triggerToast('Error removing record.', 'error');
                        }
                      }
                    }}
                    className="w-full py-1.5 bg-red-950/20 hover:bg-red-500/20 text-red-400 font-bold text-[10px] uppercase tracking-wider rounded border border-red-500/20 transition-colors"
                  >
                    Delete Visa Tracker
                  </button>
                )}
              </form>
            </div>

            {/* Consular Action Sandbox */}
            {activeTracker && (
              <div className="p-5 rounded-xl bg-slate-900/30 border border-white/5 space-y-3.5 text-xs">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold uppercase tracking-wider text-[10px]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Consulate Simulator Panel</span>
                </div>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Consular processing can take 4-12 weeks. Use these quick actions to simulate official embassy updates for your visa.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSimulateEmbassyResponse('Approved')}
                    disabled={saving}
                    className="p-2 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Simulate Approval
                  </button>
                  <button
                    onClick={() => handleSimulateEmbassyResponse('Rejected')}
                    disabled={saving}
                    className="p-2 rounded bg-red-600/20 hover:bg-red-600/30 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Simulate Rejection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right/Middle Block - Active Status Checklists & Stepper */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Appointment & Consular Office Details */}
            <div className="p-6 rounded-xl bg-slate-950/40 border border-white/5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Embassy Appointment Booking</h2>
                </div>
                {activeTracker && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    status === 'Submitted' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {status}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Interview Date</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Consulate Location</label>
                  <input
                    type="text"
                    value={appointmentLocation}
                    onChange={(e) => setAppointmentLocation(e.target.value)}
                    placeholder="Embassy or VFS Global Office"
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Visa Reference / Tracking ID</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="E.g., GER-VFS-882194"
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {appointmentDate && (
                <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/10 flex items-center gap-3">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
                    <Info className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] text-slate-300 leading-normal">
                    Appointment is logged. Prepare all original documents in a physical black binder. Ensure 2 sets of paper copies of all files listed in the checklist below!
                  </p>
                </div>
              )}
            </div>

            {/* Step-by-Step Visa Pathway Progress */}
            {activeTracker && (
              <div className="p-6 rounded-xl bg-slate-950/40 border border-white/5 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Embassy Progress Steps</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400">{progressPercent}%</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 uppercase font-bold">Complete</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Vertical Stepper */}
                <div className="space-y-4 pt-2">
                  {activeTracker.steps.map((step, idx) => {
                    const isDone = step.status === 'completed';
                    const isFailed = step.status === 'failed';
                    return (
                      <div key={step.id} className="flex gap-4 items-start relative">
                        {/* Connecting Line */}
                        {idx < activeTracker.steps.length - 1 && (
                          <div className={`absolute left-3.5 top-8 w-[1.5px] h-12 ${
                            isDone ? 'bg-emerald-500/40' : 'bg-slate-800'
                          }`} />
                        )}

                        {/* Node status circle */}
                        <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-bold z-10 transition-colors ${
                          isDone 
                            ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/40 shadow-md shadow-emerald-500/5' 
                            : isFailed
                            ? 'bg-red-950/30 text-red-400 border-red-500/40'
                            : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}>
                          {isDone ? <Check className="h-4 w-4" /> : idx + 1}
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5 space-y-1">
                          <p className={`text-xs font-bold leading-none ${isDone ? 'text-white' : 'text-slate-400'}`}>
                            {step.label}
                          </p>
                          <p className="text-[10px] text-slate-500 leading-normal">{step.description}</p>
                          {step.details && (
                            <div className="p-2 rounded bg-white/5 border border-white/5 text-[9px] text-indigo-300 font-mono flex items-start gap-1.5">
                              <span className="text-indigo-400">▹</span>
                              <span>{step.details}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Document Vault Auto-Linking Checklist */}
            <div className="p-6 rounded-xl bg-slate-950/40 border border-white/5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-indigo-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                    {selectedCountry} Consulate Document Checklist
                  </h2>
                </div>
                <span className="text-[9px] text-indigo-300 font-mono uppercase bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                  Vault Auto-Match Active
                </span>
              </div>

              <div className="space-y-3.5">
                {/* Official University Admission Letter check */}
                <div className="p-4 rounded-lg bg-slate-900/40 border border-white/5 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Admission & Enrollment Certificate</span>
                        {admissionLetterMatch ? (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-mono px-1.5 rounded uppercase font-bold">Auto-Linked</span>
                        ) : (
                          <span className="text-[9px] bg-slate-800 text-slate-400 font-mono px-1.5 rounded uppercase font-bold">Required</span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Official letter confirming study acceptance. Instantly linked from your Portal Submissions pipeline.
                      </p>
                    </div>
                    {admissionLetterMatch ? (
                      <div className="p-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 shrink-0">
                        <Check className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="p-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 shrink-0">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  {admissionLetterMatch ? (
                    <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-emerald-200/90 leading-relaxed font-mono flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Found {admissionLetterMatch.status} App for {admissionLetterMatch.universityName} ({admissionLetterMatch.programName})
                      </span>
                    </div>
                  ) : (
                    <div className="p-2 rounded bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-200/90 leading-relaxed font-sans">
                      No automated portal submissions have reached "Submitted" or "Accepted" state yet. Please complete a program application submission first.
                    </div>
                  )}
                </div>

                {/* Country-Specific Checklist items with Vault mapping */}
                {config.checklist.map(item => {
                  const match = getDocumentMatch(item.docTypeMatcher);
                  return (
                    <div key={item.id} className="p-4 rounded-lg bg-slate-900/40 border border-white/5 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{item.label}</span>
                            {item.docTypeMatcher && (
                              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-mono px-1.5 rounded uppercase">
                                {item.docTypeMatcher} Matcher
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 leading-relaxed">{item.description}</p>
                        </div>
                        {match ? (
                          <div className="p-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 shrink-0">
                            <Check className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="p-1 bg-slate-800 border border-white/5 rounded-full text-slate-500 shrink-0">
                            <Clock className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      {match ? (
                        <div className="p-2.5 rounded bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-emerald-200/90 leading-relaxed font-mono flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">Vault Match: {match.name} (Uploaded {new Date(match.uploadedAt).toLocaleDateString()})</span>
                          <span className="text-emerald-500 ml-auto font-bold uppercase text-[8px] tracking-wider">Linked</span>
                        </div>
                      ) : item.docTypeMatcher ? (
                        <div className="p-2.5 rounded bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-200/90 leading-normal flex items-start gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            No loaded dossier file matches your <strong>{item.docTypeMatcher}</strong> category. Please upload it in the <strong>Document Vault</strong> for instant alignment.
                          </span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dossier Log Console */}
            {activeTracker && (
              <div className="p-6 rounded-xl bg-slate-950/40 border border-white/5 shadow-xl space-y-3">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Dossier Activity History</h2>
                </div>

                <div className="bg-slate-950 border border-white/5 rounded-lg p-4 font-mono text-[10px] text-slate-300 space-y-2 max-h-48 overflow-y-auto">
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex gap-2 leading-relaxed">
                      <span className="text-blue-500 shrink-0">❯</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
