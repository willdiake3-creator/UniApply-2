import React, { useState, useEffect } from 'react';
import { 
  Mail, Link as LinkIcon, AlertCircle, CheckCircle2, User, Sparkles, Send, 
  Loader2, Globe, GraduationCap, Phone, Check, RefreshCw, ChevronDown, Eye
} from 'lucide-react';
import { StudentProfile } from '../types';

const PREDEFINED_DEGREES = [
  "High School Diploma",
  "College Freshman (1st Year) - Transfer seeker",
  "College Sophomore (2nd Year) - Transfer seeker",
  "College Junior (3rd Year) - Transfer seeker",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD"
];

const DEFAULT_TEMPLATE_SUBJECT = 'Inquiry regarding admission to {programName} at {universityName}';
const DEFAULT_TEMPLATE_BODY = 'Dear Admissions Committee,\n\nMy name is {firstName} {lastName}, and I am writing to express my strong interest in the {programName} program at {universityName}.\n\nHaving completed my {highestDegree} with a GPA of {gpa}/{gpaScale}, I believe my background aligns well with the academic standards of your institution. I have uploaded my transcripts and passport records via the UniApply portal for your review.\n\nCould you please confirm the receipt of my application and let me know if there are any additional requirements or potential scholarship options available for international students?\n\nThank you for your time and consideration.\n\nWarm regards,\n{firstName} {lastName}\n{email}\n{phone}';

interface SettingsProps {
  profile: StudentProfile;
  onUpdateProfile: (p: StudentProfile, silent?: boolean) => void;
  gmailConnected: boolean;
  gmailAddress: string;
  onConnectGmail: (isBypass?: boolean) => void;
  onDisconnectGmail: () => void;
  gmailSentCount: number;
  isConnectingGmail?: boolean;
}

export default function Settings({
  profile,
  onUpdateProfile,
  gmailConnected,
  gmailAddress,
  onConnectGmail,
  onDisconnectGmail,
  gmailSentCount,
  isConnectingGmail = false
}: SettingsProps) {
  const [editedProfile, setEditedProfile] = useState<StudentProfile>({
    ...profile,
    emailTemplateSubject: profile.emailTemplateSubject || DEFAULT_TEMPLATE_SUBJECT,
    emailTemplateBody: profile.emailTemplateBody || DEFAULT_TEMPLATE_BODY
  });
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'editing' | 'saving' | 'saved' | 'error'>('idle');
  const [testEmailTo, setTestEmailTo] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    const isDifferent = JSON.stringify(editedProfile) !== JSON.stringify(profile);
    if (!isDifferent) return;

    if (autosaveStatus === 'idle' || autosaveStatus === 'saved') {
      setEditedProfile({
        ...profile,
        emailTemplateSubject: profile.emailTemplateSubject || DEFAULT_TEMPLATE_SUBJECT,
        emailTemplateBody: profile.emailTemplateBody || DEFAULT_TEMPLATE_BODY
      });
    }
  }, [profile]);

  // Automatic silent autosave when edits happen
  useEffect(() => {
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

  const handleApplyPreset = (type: 'professional' | 'curious' | 'direct') => {
    if (type === 'professional') {
      setEditedProfile({
        ...editedProfile,
        emailTemplateSubject: 'Inquiry regarding admission to {programName} at {universityName}',
        emailTemplateBody: 'Dear Admissions Committee,\n\nMy name is {firstName} {lastName}, and I am writing to express my strong interest in the {programName} program at {universityName}.\n\nHaving completed my {highestDegree} with a GPA of {gpa}/{gpaScale}, I believe my background aligns well with the academic standards of your institution. I have uploaded my transcripts and passport records via the UniApply portal for your review.\n\nCould you please confirm the receipt of my application and let me know if there are any additional requirements or potential scholarship options available for international students?\n\nThank you for your time and consideration.\n\nWarm regards,\n{firstName} {lastName}\n{email}\n{phone}'
      });
    } else if (type === 'curious') {
      setEditedProfile({
        ...editedProfile,
        emailTemplateSubject: 'Academic Inquiry: {firstName} {lastName} - {programName} Admission',
        emailTemplateBody: 'Dear Admissions Team at {universityName},\n\nI hope this message finds you well.\n\nI am {firstName} {lastName} from {countryOfResidence}, and I have recently submitted my application documents for the {programName} program. Given my academic focus in {majorInterest}, studying at {universityName} has been a primary milestone for my career.\n\nI have a cumulative GPA of {gpa} on a scale of {gpaScale}. Could you please advise on typical processing timelines for the {highestDegree} pathway? Additionally, I would love to know if there is any professor outreach recommended for {programName} candidates.\n\nThank you for guiding me through this automated admissions cycle.\n\nSincerely,\n{firstName} {lastName}\nEmail: {email}\nPhone: {phone}'
      });
    } else if (type === 'direct') {
      setEditedProfile({
        ...editedProfile,
        emailTemplateSubject: 'Application Submitted: {programName} - {firstName} {lastName}',
        emailTemplateBody: 'Dear Admissions Office,\n\nPlease find my automatic One-Apply submission for the {programName} program at {universityName}.\n\nMy student details are as follows:\n- Applicant: {firstName} {lastName}\n- Nationality: {nationality}\n- Prior Degree: {highestDegree}\n- Academic GPA: {gpa}/{gpaScale}\n- Application ID: {applicationNumber}\n\nI look forward to hearing from you regarding my eligibility. My contact email is {email}.\n\nRegards,\n{firstName} {lastName}'
      });
    }
  };

  const getRenderedPreview = () => {
    const mockProgram = { name: 'MSc in Advanced Clinical Nursing', universityName: 'Semmelweis University', country: 'Hungary' };
    const mockScholarship = { name: 'Semmelweis International Medical & Nursing Stipend' };
    const mockAppNum = 'EUA-2026-8849';

    const replaceAll = (text: string) => {
      if (!text) return '';
      return text
        .replace(/{firstName}/g, editedProfile.firstName || 'Jane')
        .replace(/{lastName}/g, editedProfile.lastName || 'Doe')
        .replace(/{email}/g, editedProfile.email || 'jane.doe@example.com')
        .replace(/{phone}/g, editedProfile.phone || '+36 1 459 1500')
        .replace(/{nationality}/g, editedProfile.nationality || 'International')
        .replace(/{countryOfResidence}/g, editedProfile.countryOfResidence || 'Poland')
        .replace(/{majorInterest}/g, editedProfile.majorInterest || 'Healthcare Sciences')
        .replace(/{highestDegree}/g, editedProfile.highestDegree || "Bachelor's Degree")
        .replace(/{gpa}/g, String(editedProfile.gpa || '3.8'))
        .replace(/{gpaScale}/g, String(editedProfile.gpaScale || '4.0'))
        .replace(/{programName}/g, mockProgram.name)
        .replace(/{universityName}/g, mockProgram.universityName)
        .replace(/{country}/g, mockProgram.country)
        .replace(/{scholarshipName}/g, mockScholarship.name)
        .replace(/{applicationNumber}/g, mockAppNum);
    };

    return {
      subject: replaceAll(editedProfile.emailTemplateSubject || DEFAULT_TEMPLATE_SUBJECT),
      body: replaceAll(editedProfile.emailTemplateBody || DEFAULT_TEMPLATE_BODY)
    };
  };

  const previewRender = getRenderedPreview();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(editedProfile);
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo) return;
    setSendingTest(true);
    setTestResult(null);
    try {
      // Get token from localstorage
      const gToken = localStorage.getItem('google_access_token');
      if (!gToken) {
        throw new Error('Missing linked Google Access Token.');
      }

      const res = await fetch('/api/gmail/send-custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gToken}`
        },
        body: JSON.stringify({
          to: testEmailTo,
          subject: 'UniApply EU API Test Email',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #2563eb;">UniApply EU Gmail Integration Active!</h2>
              <p>Hello!</p>
              <p>This is a real-time integration test. Your Gmail account has been linked successfully with <strong>gmail.send</strong> permissions!</p>
              <p>You can now automate university application receipts and admission alerts automatically using our <strong>One-Apply</strong> robotics engine.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="color: #64748b; font-size: 11px;">Sent from UniApply EU workspace.</p>
            </div>
          `
        })
      });

      const data = await res.json();
      if (res.ok) {
        setTestResult({ success: true, msg: `Sent! Message ID: ${data.response?.id || 'Success'}` });
      } else {
        setTestResult({ success: false, msg: data.error || 'Failed to dispatch email.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, msg: err.message || 'Error occurred.' });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* 1. Gmail Automation connection panel */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Gmail Link Card */}
        <div className="bg-white rounded border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Mail className="h-5 w-5 text-red-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans">
              Google Workspace & Gmail Link
            </h2>
          </div>

          <p className="text-xs text-slate-500 leading-normal">
            Link your Google account with UniApply to send, log, and track official university application submissions in real-time.
          </p>

          {gmailConnected ? (
            <div className="space-y-4">
              <div className="rounded bg-emerald-50 border border-emerald-100 p-3.5 text-xs text-emerald-800 space-y-1 font-mono">
                <p className="font-bold flex items-center gap-1 uppercase tracking-wide text-[10px]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Integration Online
                </p>
                <p className="text-[11px] font-bold text-emerald-700">Linked Account: {gmailAddress}</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-2">Emails dispatched via AI: {gmailSentCount}</p>
              </div>

              <button
                onClick={onDisconnectGmail}
                className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold uppercase tracking-widest rounded transition-colors border border-red-200 cursor-pointer"
              >
                Disconnect Gmail Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded bg-amber-50 border border-amber-100 p-3.5 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-normal font-medium text-[11px]">
                  Gmail is currently offline. You can still draft applications, but automated submission receipts will not be emailed directly to admissions.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => onConnectGmail(false)}
                  disabled={isConnectingGmail}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  {isConnectingGmail ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      Linking Account...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4" />
                      Link Google Account
                    </>
                  )}
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-2 text-[9px] text-slate-400 uppercase font-mono tracking-wider font-bold bg-white px-1">or bypass popups</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  onClick={() => onConnectGmail(true)}
                  disabled={isConnectingGmail}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm shadow-emerald-500/10"
                >
                  <Sparkles className="h-4 w-4 text-emerald-300" />
                  Seamless Popup-Bypass Link
                </button>
                <p className="text-[10px] text-slate-400 text-center italic">
                  Recommended to bypass popup blocks, auth rejections, or iframe errors.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Integration Tester */}
        {gmailConnected && (
          <div className="bg-white rounded border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Verify Real-time Gmail API
            </h3>
            <p className="text-[11px] text-slate-500">
              Send a test email directly from your linked Gmail inbox to check the OAuth token handshake.
            </p>
            <div className="space-y-2">
              <input
                type="email"
                placeholder="to: recipient@email.com"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
              <button
                onClick={handleSendTestEmail}
                disabled={sendingTest || !testEmailTo}
                className="w-full py-1.5 bg-slate-900 hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Sending API Payload...
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3" />
                    Send Test Email API
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div className={`rounded p-2.5 text-[10px] leading-relaxed font-bold font-mono border ${
                testResult.success 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                  : 'bg-red-50 text-red-800 border-red-100'
              }`}>
                {testResult.msg}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Interactive student profile editor */}
      <div className="lg:col-span-2 rounded border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans">
              Student Application Profile
            </h2>
          </div>
          <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700 uppercase tracking-wider border border-blue-100">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 fill-blue-100" />
            Gemini Auto-filled
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                First Name
              </label>
              <input
                type="text"
                value={editedProfile.firstName}
                onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                Last Name
              </label>
              <input
                type="text"
                value={editedProfile.lastName}
                onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                Email
              </label>
              <input
                type="email"
                value={editedProfile.email}
                onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={editedProfile.phone}
                  onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                Nationality
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Germany, Austria, France..."
                  value={editedProfile.nationality}
                  onChange={(e) => setEditedProfile({ ...editedProfile, nationality: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                Country of Residence
              </label>
              <input
                type="text"
                value={editedProfile.countryOfResidence}
                onChange={(e) => setEditedProfile({ ...editedProfile, countryOfResidence: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
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
                  className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 appearance-none cursor-pointer"
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
                      placeholder="Specify your custom degree or college status..."
                      value={editedProfile.highestDegree}
                      onChange={(e) => setEditedProfile({ ...editedProfile, highestDegree: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                  GPA
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editedProfile.gpa}
                  onChange={(e) => setEditedProfile({ ...editedProfile, gpa: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                  GPA Scale
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editedProfile.gpaScale}
                  onChange={(e) => setEditedProfile({ ...editedProfile, gpaScale: parseFloat(e.target.value) || 4.0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                Major Interest
              </label>
              <input
                type="text"
                placeholder="Computer Science, Business..."
                value={editedProfile.majorInterest}
                onChange={(e) => setEditedProfile({ ...editedProfile, majorInterest: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                Languages
              </label>
              <input
                type="text"
                placeholder="English, French, German"
                value={editedProfile.languages.join(', ')}
                onChange={(e) => setEditedProfile({ 
                  ...editedProfile, 
                  languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                })}
                className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="h-4 w-4" />
              Save Student Profile
            </button>
          </div>
        </form>
      </div>

      {/* 3. Customizable AI Email Outreach Templates */}
      <div className="lg:col-span-3 bg-white rounded border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5">
            <Mail className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans">
              Customizable Outreach Email Templates
            </h2>
          </div>
          <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700 uppercase tracking-wider border border-indigo-100">
            Personal Tone Customizer
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-normal max-w-3xl">
          Customize the automated outreach emails sent to university admissions boards when running <strong>One-Apply</strong>. Swap between expert preset models, inject dynamic applicant placeholders, and review exactly how your email reads in real-time before sending.
        </p>

        {/* Presets Grid */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            Select an Email Template Preset
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Preset 1 */}
            <button
              type="button"
              onClick={() => handleApplyPreset('professional')}
              className="p-3 text-left border border-slate-200 hover:border-indigo-500 rounded bg-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer group"
            >
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                💼 Professional & Balanced
              </h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                A formal academic inquiry presenting your profile credentials, transcripts, and a polite request for next steps.
              </p>
            </button>

            {/* Preset 2 */}
            <button
              type="button"
              onClick={() => handleApplyPreset('curious')}
              className="p-3 text-left border border-slate-200 hover:border-indigo-500 rounded bg-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer group"
            >
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                🔍 Highly Inquisitive & Engaging
              </h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Highlights your major interest and actively requests timelines and professor outreach guidance.
              </p>
            </button>

            {/* Preset 3 */}
            <button
              type="button"
              onClick={() => handleApplyPreset('direct')}
              className="p-3 text-left border border-slate-200 hover:border-indigo-500 rounded bg-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer group"
            >
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                ⚡ Short & Direct Submission
              </h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                A concise and structured bulleted recap detailing exact credentials, ideal for fast admissions handshakes.
              </p>
            </button>
          </div>
        </div>

        {/* Template Inputs & Preview Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Inputs Section */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                Email Subject Template
              </label>
              <input
                type="text"
                value={editedProfile.emailTemplateSubject || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, emailTemplateSubject: e.target.value })}
                placeholder="Inquiry regarding admission to {programName} at {universityName}"
                className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-sans font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                Email Body Template
              </label>
              <textarea
                rows={12}
                value={editedProfile.emailTemplateBody || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, emailTemplateBody: e.target.value })}
                placeholder="Dear Admissions Office..."
                className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-mono leading-relaxed"
              />
            </div>

            {/* Placeholders Quick Reference */}
            <div className="bg-slate-50 rounded p-4 border border-slate-100">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">
                Available Applicant & Program Placeholders
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: '{firstName}', desc: 'First Name' },
                  { tag: '{lastName}', desc: 'Last Name' },
                  { tag: '{email}', desc: 'Email Address' },
                  { tag: '{phone}', desc: 'Phone Number' },
                  { tag: '{nationality}', desc: 'Nationality' },
                  { tag: '{countryOfResidence}', desc: 'Country of Residence' },
                  { tag: '{majorInterest}', desc: 'Major Interest' },
                  { tag: '{highestDegree}', desc: 'Degree Status' },
                  { tag: '{gpa}', desc: 'GPA' },
                  { tag: '{gpaScale}', desc: 'GPA Scale' },
                  { tag: '{programName}', desc: 'Program Name' },
                  { tag: '{universityName}', desc: 'University Name' },
                  { tag: '{country}', desc: 'Country' },
                  { tag: '{scholarshipName}', desc: 'Scholarship' },
                  { tag: '{applicationNumber}', desc: 'Submission Number' }
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => {
                      // Insert placeholder at end of template body
                      const currentBody = editedProfile.emailTemplateBody || '';
                      setEditedProfile({
                        ...editedProfile,
                        emailTemplateBody: currentBody + ' ' + item.tag
                      });
                    }}
                    title={`Click to append: ${item.desc}`}
                    className="px-2 py-0.5 text-[9px] font-mono bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 font-bold transition-all hover:border-indigo-300 hover:text-indigo-600 shrink-0 cursor-pointer"
                  >
                    {item.tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Rendering Preview Pane */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-slate-400" />
              Live Personalization Preview
            </h3>
            
            <div className="rounded border border-slate-200 bg-slate-900/5 text-slate-800 overflow-hidden flex flex-col h-[380px]">
              {/* Fake Email Header */}
              <div className="bg-white border-b border-slate-200 p-4 space-y-2 shrink-0">
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="font-bold text-slate-400 w-12">To:</span>
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono text-[10px]">admissions@university.edu</span>
                </div>
                <div className="flex items-start gap-1 text-[11px] border-t border-slate-100 pt-2">
                  <span className="font-bold text-slate-400 w-12 shrink-0 mt-0.5">Subject:</span>
                  <span className="font-semibold text-slate-800 break-words">{previewRender.subject || '(Subject is empty)'}</span>
                </div>
              </div>
              
              {/* Fake Email Body */}
              <div className="p-4 overflow-y-auto bg-white flex-1 font-sans text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                <div className="border border-indigo-100 rounded-lg p-4 bg-indigo-50/10 shadow-xs relative">
                  <span className="absolute top-2.5 right-2.5 text-[8px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider font-mono">
                    Outreach Preview
                  </span>
                  {previewRender.body || '(Email body is empty. Type in the template editor on the left or select a preset to begin!)'}
                </div>
              </div>

              {/* Fake Email Footer */}
              <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
                <span className="flex items-center gap-1 font-mono">
                  <Sparkles className="h-3 w-3 text-indigo-500 fill-indigo-100" />
                  UniApply EU AI Parser
                </span>
                <span>Active Handshake Handover</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/50 border border-indigo-100/50 rounded p-3 text-[11px] text-indigo-800">
              <span className="font-medium">
                Changes to outreach templates apply instantly to all subsequent **One-Apply** submissions.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {autosaveStatus === 'editing' && (
                  <span className="text-slate-500 text-[10px] font-mono animate-pulse">
                    Unsaved changes...
                  </span>
                )}
                {autosaveStatus === 'saving' && (
                  <span className="text-indigo-600 text-[10px] font-mono animate-pulse flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Saving...
                  </span>
                )}
                {autosaveStatus === 'saved' && (
                  <span className="text-emerald-600 text-[10px] font-mono flex items-center gap-1">
                    <Check className="h-3 w-3" /> Autosaved
                  </span>
                )}
                {autosaveStatus === 'error' && (
                  <span className="text-red-600 text-[10px] font-mono">
                    Save failed
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onUpdateProfile(editedProfile)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest rounded transition-all text-[10px] cursor-pointer shrink-0 text-center"
                >
                  Save Template Only
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
