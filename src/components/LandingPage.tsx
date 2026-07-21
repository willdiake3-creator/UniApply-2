import React, { useState, useEffect } from 'react';
import { 
  Sparkles, FileText, GraduationCap, ShieldCheck, Clock, Globe, ArrowRight, Lightbulb, Send, Eye, Info
} from 'lucide-react';
// @ts-ignore
import universityBg from '../assets/images/university_cinematic_bg_1784418680397.jpg';

interface LandingPageProps {
  onEnterApp: (tab?: string) => void;
  onLoginSuccess: (email: string) => void;
  userEmail: string | null;
  profile: any;
  documents: any[];
}

export default function LandingPage({ onEnterApp, onLoginSuccess, userEmail, profile, documents }: LandingPageProps) {
  const [isScanning, setIsScanning] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleActionClick = (targetTab?: string) => {
    if (userEmail) {
      onEnterApp(targetTab);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setLoginError('Email address is required.');
      return;
    }
    setLoginError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.email);
        setShowLoginModal(false);
        onEnterApp('dashboard');
      } else {
        const errData = await res.json();
        setLoginError(errData.error || 'Failed to authenticate.');
      }
    } catch (err) {
      setLoginError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple interval to simulate an elegant AI scanning/analyzing line movement
  useEffect(() => {
    const interval = setInterval(() => {
      setIsScanning(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simple auto-rotation of "how it works" highlighted steps for user interactivity
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(stepInterval);
  }, []);

  return (
    <div className="min-h-screen bg-[#04060b] text-slate-100 flex flex-col relative overflow-x-hidden font-sans">
      
      {/* 1. HERO FOLD: Atmospheric Cinematic Background with Vignette Overlay (Flickr Inspired) */}
      <div 
        className="relative min-h-screen flex flex-col justify-between z-10 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(4, 6, 11, 0.05) 0%, rgba(4, 6, 11, 0.2) 50%, rgba(4, 6, 11, 0.55) 100%), radial-gradient(circle at center, rgba(4, 6, 11, 0) 0%, rgba(4, 6, 11, 0.35) 100%), url(${universityBg})` 
        }}
      >
        {/* Soft flowing liquid orbs blended into dark background for a cosmic glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
          <div className="liquid-orb-1 -top-48 -left-48" />
          <div className="liquid-orb-3 top-1/3 left-1/4" />
        </div>

        {/* Header Bar - Simple, Clean, High-Contrast */}
        <header className="w-full max-w-7xl mx-auto px-6 md:px-12 h-24 flex items-center justify-between relative z-20 shrink-0">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleActionClick()}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/20 transform hover:scale-105 transition-transform">
              <GraduationCap className="h-5.5 w-5.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-xl tracking-tight leading-none font-sans">UniApply</span>
              <span className="text-[9px] text-indigo-400 uppercase font-black tracking-widest mt-1 font-mono">Global Portal</span>
            </div>
          </div>

          {/* Minimal Navigation */}
          <div className="flex items-center gap-5">
            <button 
              onClick={() => handleActionClick('dashboard')}
              className="text-xs font-bold text-slate-300 hover:text-white transition-colors uppercase tracking-wider px-3 py-2 cursor-pointer font-sans"
            >
              Sign In
            </button>
            <button 
              onClick={() => handleActionClick('dashboard')}
              className="px-6 py-3 bg-white text-slate-900 text-xs font-extrabold rounded-full hover:bg-slate-100 transition-all shadow-xl hover:shadow-white/10 uppercase tracking-widest cursor-pointer transform active:scale-95"
            >
              {userEmail ? 'Launch Portal' : 'Login / Register'}
            </button>
          </div>
        </header>

        {/* Center Hero Box */}
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 py-12 flex-1 flex flex-col justify-center items-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md animate-pulse">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest font-mono">
              Next-Gen Autonomous Admissions
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tighter leading-[1.05] font-sans max-w-3xl drop-shadow-sm">
            Find your academic <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-blue-200 to-purple-300 font-sans">
              inspiration.
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal font-sans drop-shadow-md">
            Upload your transcripts or CV once. Let our intelligent AI parse your credentials, automatically build your global student profile, and orchestrate direct admissions outreach with premier universities worldwide.
          </p>

          {/* Large Centered Flickr-Inspired Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full sm:w-auto">
            <button
              onClick={() => handleActionClick('dashboard')}
              className="w-full sm:w-auto px-10 py-5 bg-white text-slate-950 font-black text-xs rounded-full hover:bg-indigo-50 hover:text-indigo-900 transition-all shadow-2xl hover:shadow-indigo-500/20 uppercase tracking-widest flex items-center justify-center gap-2.5 cursor-pointer transform active:scale-98"
            >
              <span>{userEmail ? 'Enter Portal Dashboard' : 'Get Started with Email'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const programsSection = document.getElementById('programs-fold');
                if (programsSection) {
                  programsSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full sm:w-auto px-8 py-5 bg-slate-900/60 hover:bg-slate-900/90 text-white font-extrabold text-xs rounded-full transition-all border border-white/10 flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer backdrop-blur-md"
            >
              <span>Explore Features</span>
            </button>
          </div>

          {/* Security and speed indicators */}
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-8 pt-4 text-[11px] font-semibold text-slate-400/80 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>AES-256 Secure Vault</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-indigo-400" />
              <span>Apply In 3 Minutes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-purple-400" />
              <span>Full Global Matchmaking</span>
            </div>
          </div>
        </div>

        {/* Bottom Credits Line (Flickr style subtle aesthetic) */}
        <div className="w-full text-center py-6 text-[10px] text-slate-500 font-mono tracking-wide relative z-10 shrink-0 border-t border-white/5 bg-slate-950/20 backdrop-blur-xs">
          <span>say goodbye to messy application forms... </span>
          <span className="text-slate-400">photo of historic gothic study hall by UniApply AI</span>
        </div>
      </div>

      {/* 2. BODY FOLD: Comprehensive Information Modules & Statistics */}
      <div id="programs-fold" className="w-full bg-[#050811] relative z-20 py-24 border-t border-slate-900">
        
        {/* Soft flowing liquid orbs in the body fold too */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
          <div className="liquid-orb-2 bottom-1/4 -right-24" />
        </div>

        <div className="max-w-7xl w-full mx-auto px-6 md:px-12 relative z-10 space-y-28">

          {/* Interactive Feature Grid: Left Column Stats, Right Column Live Extraction Mockup */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Col: Explanations and Stats */}
            <div className="lg:col-span-6 space-y-8 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
                <Info className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest font-mono">
                  Autonomous Processing Engine
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight font-sans">
                A single profile. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-indigo-500 font-sans">
                  Unlimited academic avenues.
                </span>
              </h2>

              <p className="text-sm text-slate-400 leading-relaxed font-sans font-normal max-w-xl">
                Tired of filing identical forms for every single university? UniApply processes your primary academic documents—transcripts, certificates, and curriculum vitae—converting them instantly into an encrypted personal vault. From there, our system maps your real-time criteria to match target levels automatically.
              </p>

              {/* By the numbers Stat counters (Preserved and styled beautifully) */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-900">
                {[
                  { count: '50+', label: 'Elite Universities', sub: 'Ivy, Russell Group, and EU elite' },
                  { count: '300+', label: 'Verified Programs', sub: 'Bachelors, Masters, PhD curricula' },
                  { count: '120+', label: 'Active Scholarships', sub: 'Full rides and living stipends' },
                  { count: '24+', label: 'Eligible Countries', sub: 'Global admission compliance' }
                ].map((stat, idx) => (
                  <div key={idx} className="space-y-1.5 p-4 rounded-lg bg-slate-900/30 border border-white/5 hover:border-indigo-500/20 transition-all">
                    <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight block">
                      {stat.count}
                    </span>
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block font-sans">
                      {stat.label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block leading-snug">
                      {stat.sub}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Live Document Extraction Interactive HUD (Preserved & Made Ultra Sleek) */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              
              {/* Main Interactive Mock Sheet */}
              <div className="w-full max-w-md bg-slate-900/80 rounded-2xl border border-white/10 shadow-2xl p-8 relative overflow-hidden transition-all duration-300 backdrop-blur-md">
                
                {/* Mock Header Controls */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest">OFFICIAL_TRANSCRIPT.PDF</span>
                </div>

                {/* Mock Document contents */}
                <div className="space-y-4 relative">
                  
                  {/* Simulated text lines representing university transcripts */}
                  <div className="h-4.5 bg-white/10 rounded w-1/3" />
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3.5 bg-white/5 rounded w-5/6" />
                  
                  {/* Mock Grade Section */}
                  <div className="border border-white/5 rounded-xl p-4 space-y-2.5 mt-6 bg-white/5">
                    <div className="h-3.5 bg-white/10 rounded w-2/5" />
                    <div className="flex items-center justify-between">
                      <div className="h-7 bg-indigo-500/25 rounded w-1/4" />
                      <div className="h-4.5 bg-white/10 rounded w-1/3" />
                    </div>
                  </div>

                  {/* More dummy data rows */}
                  <div className="space-y-2.5 pt-4">
                    <div className="h-3.5 bg-white/10 rounded w-1/2" />
                    <div className="h-3.5 bg-white/10 rounded w-2/3" />
                    <div className="h-3.5 bg-white/10 rounded w-3/4" />
                  </div>

                  {/* Dynamic Moving Scanning Laser Grid Line */}
                  <div className={`absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-lg shadow-indigo-400/50 transition-all duration-[3000ms] ${
                    isScanning ? 'top-0' : 'top-full'
                  }`} />
                </div>
              </div>

              {/* Overlapping Floating AI Extraction HUD Box (Preserved perfectly) */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 w-[94%] sm:w-[340px] bg-slate-900 text-white rounded-xl shadow-2xl p-5 border border-white/15 flex items-center gap-4 transform hover:-translate-y-1 transition-all duration-300 z-20">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    AI Transcript Extractor
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-white">
                    <span className="font-bold bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded text-[10px] border border-indigo-500/20">
                      GPA 3.85
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="font-semibold text-slate-300">CS & Science</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400 font-bold">12 matched</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                    Active
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* 3. Step-by-Step Integrated Academic Launchpad Section */}
          <section className="space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono block">
                The One-Apply Workflow
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                From document upload to admissions handshake.
              </h2>
              <p className="text-sm text-slate-400 leading-normal max-w-xl mx-auto">
                Our pipeline integrates state-of-the-art Large Language Models with automated emailing frameworks to manage your academic future flawlessly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Secure Academic Vault',
                  desc: 'Upload your academic certificates, transcript records, or residency documents into an encrypted personal cabinet with strict local safeguards.',
                  icon: FileText,
                  color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                },
                {
                  step: '02',
                  title: 'Instant Profile Mapping',
                  desc: 'Gemini models extract key metrics like your CGPA and prior degree status on document upload to auto-fill your profile details.',
                  icon: Sparkles,
                  color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                },
                {
                  step: '03',
                  title: 'Personalized Outreach',
                  desc: 'Craft customized email presets and outreach copy inside settings. Insert dynamic fields for program details and personal notes.',
                  icon: Lightbulb,
                  color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                },
                {
                  step: '04',
                  title: 'One-Apply Dispatch',
                  desc: 'Instantly file student admission inquiries and dispatch automated outreach messages using your secure linked Gmail workspace.',
                  icon: Send,
                  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                },
              ].map((stepItem, idx) => {
                const Icon = stepItem.icon;
                const isHighlight = activeStep === idx;
                return (
                  <div 
                    key={idx}
                    className={`p-6 rounded-xl border transition-all duration-300 text-left relative overflow-hidden cursor-pointer ${
                      isHighlight 
                        ? 'border-indigo-500 ring-1 ring-indigo-500/25 bg-slate-900/60 -translate-y-1.5 shadow-xl shadow-indigo-500/5' 
                        : 'bg-slate-900/20 border-white/5 hover:border-white/10 hover:bg-slate-900/40'
                    }`}
                    onClick={() => setActiveStep(idx)}
                  >
                    <div className="absolute right-4 top-4 text-3xl font-black text-slate-800/40 font-mono tracking-tighter select-none">
                      {stepItem.step}
                    </div>

                    <div className={`p-2.5 rounded-lg border inline-flex items-center justify-center mb-6 ${stepItem.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="text-sm font-bold text-white tracking-tight uppercase mb-2">
                      {stepItem.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">
                      {stepItem.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="pt-6 text-center">
              <button
                onClick={() => handleActionClick('dashboard')}
                className="inline-flex items-center gap-2 text-xs font-extrabold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest cursor-pointer group"
              >
                <span>Launch your secure student cabinet now</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </section>

        </div>
      </div>

      {/* 4. Minimal Elegant Footer matching Flickr-style Cleanliness */}
      <footer className="py-12 border-t border-slate-900 relative z-20 bg-[#04060b]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500 text-[11px] font-mono">
          <p>© 2026 UniApply Inc. Connecting global minds to world-class education.</p>
          <div className="flex gap-8">
            <a href="#privacy" className="hover:text-slate-300 transition-colors text-slate-500">Security & Encryption</a>
            <a href="#terms" className="hover:text-slate-300 transition-colors text-slate-500">Partner Universities</a>
            <a href="#help" className="hover:text-slate-300 transition-colors text-slate-500">Technical API Docs</a>
          </div>
        </div>
      </footer>

      {/* 5. Sleek email sign-in modal with dark blurred glass design */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0b0f19] border border-white/10 rounded-2xl shadow-2xl p-8 relative overflow-hidden text-left">
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
              <div className="liquid-orb-3 -top-24 -left-24" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                    <GraduationCap className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight uppercase">Sign In with Email</h3>
                    <p className="text-[10px] text-indigo-400 font-mono tracking-wider uppercase mt-0.5">Secure Cabinet Access</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowLoginModal(false);
                    setLoginError('');
                  }}
                  className="text-slate-400 hover:text-white hover:bg-white/5 rounded-full p-1 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your email address to sign in or create a personalized, persistent student cabinet.
                </p>
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-indigo-300 leading-normal font-medium">
                    Once logged in, upload any document to trigger automated AI profile auto-population!
                  </p>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-sans"
                    disabled={isSubmitting}
                  />
                </div>

                {loginError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-semibold text-red-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs uppercase tracking-widest rounded-lg transition-all shadow-xl hover:shadow-white/5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Cabinet</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

