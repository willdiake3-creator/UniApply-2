import React, { useState } from 'react';
import { 
  GraduationCap, Mail, Bell, Check, AlertCircle, Sparkles, 
  LayoutDashboard, Search, FileText, Settings, ChevronDown, Award, User, Compass, X, Trash2
} from 'lucide-react';
import { AppNotification, StudentProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  gmailConnected: boolean;
  gmailAddress: string;
  onConnectGmail: () => void;
  onDisconnectGmail: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  profile: StudentProfile;
  userEmail: string | null;
  onLogout: () => void;
  children: React.ReactNode;
  onBrandClick?: () => void;
  syncStatus?: 'synced' | 'syncing' | 'error' | 'idle';
}

export default function Navbar({
  activeTab,
  setActiveTab,
  gmailConnected,
  gmailAddress,
  onConnectGmail,
  onDisconnectGmail,
  notifications,
  onMarkRead,
  onMarkAllRead,
  profile,
  userEmail,
  onLogout,
  children,
  onBrandClick,
  syncStatus
}: NavbarProps) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const initials = profile.firstName || profile.lastName 
    ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase()
    : (userEmail?.[0] || 'S').toUpperCase();

  return (
    <div className="flex h-screen w-screen bg-[#070A13] overflow-hidden font-sans text-slate-100 relative">
      
      {/* Dynamic flowing liquid orbs in background */}
      <div className="liquid-bg-container">
        <div className="liquid-orb-1 -top-48 -left-48" />
        <div className="liquid-orb-2 bottom-1/4 -right-24" />
        <div className="liquid-orb-3 top-1/3 left-1/4" />
      </div>

      {/* 1. Sidebar Panel (Left) - hidden on mobile, flexing on md and above */}
      <aside id="sidebar-aside" className="w-64 glass-sidebar border-r border-white/5 flex flex-col shrink-0 md:flex hidden z-10">
        {/* Brand Block */}
        <div 
          id="sidebar-brand-block"
          onClick={onBrandClick}
          className="p-6 mb-8 cursor-pointer group hover:bg-white/5 transition-colors animate-fade-in"
          title="Return to Landing Page"
          style={{ height: "73px", width: "250.333px" }}
        >
          <div className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
            <div className="w-8.5 h-8.5 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-100 font-extrabold text-base tracking-tight leading-none">UniApply</span>
              <span className="text-[9px] text-blue-400 uppercase font-bold tracking-widest font-mono mt-1">Portal Dashboard</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav 
          id="sidebar-nav" 
          className="flex-1 px-4 space-y-1"
          style={{ height: "339.323px", width: "248.33299999999997px" }}
        >
          {[
            { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
            { id: 'programs', label: 'Explore Programs', icon: Search },
            { id: 'scholarships', label: 'Scholarships Finder', icon: Award },
            { id: 'documents', label: 'Document Vault', icon: FileText },
            { id: 'visas', label: 'Visa Tracker', icon: Compass },
            { id: 'profile', label: 'Student Profile', icon: User },
            { id: 'settings', label: 'Gmail & AI Settings', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-150 text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/25 text-blue-400 border-blue-500/20 font-semibold'
                    : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {isActive ? (
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                ) : (
                  <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Profile Card at Sidebar Bottom */}
        <div className="p-4 border-t border-white/5 bg-slate-950/40 space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
            {profile.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt="Student Avatar" 
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase tracking-wider shrink-0 animate-fade-in">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-semibold truncate">
                {profile.firstName || profile.lastName 
                  ? `${profile.firstName} ${profile.lastName}`.trim() 
                  : (userEmail || 'Guest Student')}
              </p>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono mt-0.5 truncate">
                Student ID: {profile.gpa ? (profile.gpa * 2200).toFixed(0) : '8821'}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full text-center py-1.5 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Sign Out / Switch
          </button>
        </div>
      </aside>

      {/* 2. Main Space Container (Right) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden z-10">
        
        {/* Top Header Row */}
        <header className="h-20 bg-slate-950/25 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 md:px-8 shrink-0">
          <div className="flex items-center gap-4 md:gap-8 min-w-0">
            {/* Mobile Brand Name (only visible if sidebar is hidden) */}
            <div 
              onClick={onBrandClick}
              className="flex md:hidden items-center gap-2 mr-2 shrink-0 cursor-pointer"
              title="Return to Landing Page"
            >
              <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center text-white shadow-sm">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-white text-sm tracking-tight">UniApply</span>
            </div>

            {/* Gmail Connection Status */}
            <div className="flex items-center min-w-0">
              {gmailConnected ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-[11px] font-semibold text-green-400 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-green-400 shrink-0 animate-pulse" />
                  <span className="truncate max-w-[120px] sm:max-w-[200px]">Gmail Linked: {gmailAddress}</span>
                </div>
              ) : (
                <button
                  onClick={onConnectGmail}
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 rounded-full text-[11px] font-semibold text-amber-300 transition-colors cursor-pointer"
                >
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span>Link Gmail Workspace</span>
                </button>
              )}
            </div>

            {/* Cloud Synchronization Indicator */}
            {syncStatus && (
              <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-white/5 border border-white/5 rounded-full px-2.5 py-1 shrink-0">
                {syncStatus === 'syncing' && (
                  <>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                    </span>
                    <span className="text-blue-400 font-bold">Cloud Syncing...</span>
                  </>
                )}
                {syncStatus === 'synced' && (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-emerald-400 font-semibold">Cloud Synced</span>
                  </>
                )}
                {syncStatus === 'error' && (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-400 font-semibold">Sync Error</span>
                  </>
                )}
                {syncStatus === 'idle' && (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                    <span>State Idle</span>
                  </>
                )}
              </div>
            )}

            {/* Horizontal Divider */}
            <div className="h-6 w-px bg-white/10 hidden sm:block" />

            {/* Global Stats */}
            <div className="hidden sm:flex gap-4">
              <span className="text-xs text-slate-400 font-medium">
                Global Coverage: <span className="text-white font-bold">EU, North America, Asia</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Navigation Action Shortcut */}
            {activeTab !== 'programs' && (
              <button
                onClick={() => setActiveTab('programs')}
                className="hidden sm:block px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors uppercase tracking-wider cursor-pointer shadow-lg shadow-blue-500/20"
              >
                New Application
              </button>
            )}

             {/* Notification Bell Trigger */}
             <div className="relative z-30">
               <button
                 onClick={() => setShowNotifDropdown(true)}
                 className="relative p-2.5 text-slate-300 hover:text-white hover:bg-blue-600/10 rounded-xl border border-white/15 hover:border-blue-500/30 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                 title="Open Notification Center"
               >
                 <Bell className="h-5 w-5" />
                 {unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white ring-2 ring-slate-950 animate-bounce z-10">
                     {unreadCount}
                   </span>
                 )}
               </button>
             </div>
          </div>
        </header>

        {/* Scrollable Work View Container */}
        <main className="flex-1 p-6 md:p-8 bg-transparent overflow-y-auto pb-24 md:pb-8 relative">
          {children}
        </main>
      </div>

      {/* Mobile Sticky Tab bar (only visible on mobile `md:hidden`) */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 border-t border-white/5 bg-slate-950/80 backdrop-blur-md justify-around py-1.5 z-40">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'programs', label: 'Explore', icon: Search },
          { id: 'scholarships', label: 'Scholarships', icon: Award },
          { id: 'documents', label: 'Vault', icon: FileText },
          { id: 'visas', label: 'Visas', icon: Compass },
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-bold rounded transition-colors ${
                isActive ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Backdrop Dim Overlay (Guaranteed on top of everything) */}
      {showNotifDropdown && (
        <div 
          className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md z-[99999] transition-all duration-300 animate-fade-in"
          onClick={() => setShowNotifDropdown(false)}
        />
      )}

      {/* Sliding Drawer Panel (Guaranteed on top of everything) */}
      {showNotifDropdown && (
        <div className="fixed top-0 right-0 h-full w-full sm:w-112 bg-[#090d1a] border-l border-white/10 z-[100000] shadow-[0_0_80px_rgba(59,130,246,0.25)] flex flex-col p-0 transition-transform duration-300 ease-out animate-slide-in">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-white/10 bg-slate-950/50 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/15 rounded-lg border border-blue-500/30">
                  <Bell className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-tight">Notification Center</h2>
                  <p className="text-[10px] text-blue-400 uppercase font-mono tracking-widest font-bold">UniApply Live Updates</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowNotifDropdown(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="text-xs font-semibold text-slate-300">
                {unreadCount} pending {unreadCount === 1 ? 'notification' : 'notifications'}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    onMarkAllRead();
                    setShowNotifDropdown(false);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 rounded uppercase tracking-wider transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                  Mark All Read
                </button>
              )}
            </div>
          </div>

          {/* Drawer Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 mb-4 border border-white/5">
                  <Bell className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-300">All caught up!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">You have no new alerts. Uploaded documents or automated submission steps will trigger live alerts here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Unread Section Banner */}
                {notifications.some(n => !n.isRead) && (
                  <div className="px-2 py-1 text-[10px] font-bold text-blue-400 uppercase tracking-wider font-mono">
                    New Updates
                  </div>
                )}

                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => onMarkRead(n.id)}
                    className={`p-4 rounded-xl text-left transition-all duration-200 cursor-pointer border relative overflow-hidden ${
                      n.isRead 
                        ? 'bg-slate-950/20 border-white/5 text-slate-300 hover:bg-slate-950/40 hover:border-white/10' 
                        : 'bg-gradient-to-r from-slate-950 to-[#0e1428] border-blue-500/30 text-white shadow-lg shadow-blue-500/5 hover:border-blue-500/50'
                    }`}
                  >
                    {/* Subtle Indicator Glow Line */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                      n.type === 'success' ? 'bg-emerald-500' :
                      n.type === 'warning' ? 'bg-amber-500' :
                      n.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />

                    <div className="flex items-start gap-3 pl-1">
                      <div className="mt-1 shrink-0 p-1.5 rounded-lg bg-slate-900 border border-white/5">
                        {n.type === 'success' && <Check className="h-4 w-4 text-emerald-400" />}
                        {n.type === 'warning' && <AlertCircle className="h-4 w-4 text-amber-400" />}
                        {n.type === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
                        {n.type === 'info' && <AlertCircle className="h-4 w-4 text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`font-bold leading-tight ${n.isRead ? 'text-slate-200' : 'text-white'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 shadow-lg shadow-blue-500/50 animate-pulse" />
                          )}
                        </div>
                        <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{n.message}</p>
                        
                        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>{new Date(n.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          <span>{new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Drawer Footer */}
          <div className="p-4 border-t border-white/10 bg-slate-950/80 text-center">
            <p className="text-[10px] text-slate-500 font-mono">Secure End-to-End Extraction & Document Processing</p>
          </div>
        </div>
      )}
    </div>
  );
}

