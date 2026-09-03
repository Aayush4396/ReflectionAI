import React from 'react';
import { UserProfile, AppTab } from '../types';
import { SecurityBadge } from './SecurityBadge';
import { 
  LogOut, 
  Sparkles, 
  BookOpen, 
  PlusCircle, 
  Shield, 
  TrendingUp, 
  PenTool,
  Compass,
  Archive
} from 'lucide-react';

interface NavbarProps {
  user: UserProfile;
  entryCount: number;
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  onNewEntry: () => void;
  onSignOut: () => void;
  onOpenThreatModel: () => void;
  onOpenGuidedExercises?: () => void;
  onOpenExport?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  entryCount,
  activeTab,
  onChangeTab,
  onNewEntry,
  onSignOut,
  onOpenThreatModel,
  onOpenGuidedExercises,
  onOpenExport,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 text-slate-100 border-b border-slate-800 backdrop-blur-xl shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Tab Navigation */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white font-bold shadow-md shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold tracking-tight text-white">
                  ReflectAI
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 rounded-md border border-indigo-800/60 shadow-xs">
                  Private Journal
                </span>
              </div>
            </div>
          </div>

          {/* Center Tabs */}
          <nav className="flex items-center gap-1 p-1 bg-slate-950/70 border border-slate-800/80 rounded-xl shadow-inner">
            <button
              id="tab-btn-journal"
              type="button"
              onClick={() => onChangeTab('journal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'journal'
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Journal</span>
            </button>

            <button
              id="tab-btn-analytics"
              type="button"
              onClick={() => onChangeTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </nav>
        </div>

        {/* Middle: Guided reflection button & Stats */}
        <div className="hidden xl:flex items-center gap-3">
          {onOpenGuidedExercises && (
            <button
              id="btn-nav-guided-exercises"
              type="button"
              onClick={onOpenGuidedExercises}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Guided Frameworks</span>
            </button>
          )}

          {onOpenExport && (
            <button
              id="btn-nav-export-archive"
              type="button"
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Export complete journal data as JSON or Markdown"
            >
              <Archive className="w-3.5 h-3.5 text-slate-400" />
              <span>Export</span>
            </button>
          )}

          <SecurityBadge onClick={onOpenThreatModel} />
          
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-full text-xs text-slate-300 border border-slate-700/60 shadow-2xs">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>{entryCount} {entryCount === 1 ? 'Entry' : 'Entries'}</span>
          </div>
        </div>

        {/* Right actions: New Entry + User Profile + Logout */}
        <div className="flex items-center gap-2">
          {onOpenGuidedExercises && (
            <button
              id="btn-nav-guided-exercises-mobile"
              type="button"
              onClick={onOpenGuidedExercises}
              className="xl:hidden p-2 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Guided Reflection Frameworks"
            >
              <Compass className="w-4 h-4" />
            </button>
          )}

          {activeTab === 'journal' && (
            <button
              id="btn-nav-new-entry"
              type="button"
              onClick={onNewEntry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          )}

          <button
            id="btn-nav-threat-model-mobile"
            type="button"
            onClick={onOpenThreatModel}
            className="xl:hidden p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            title="Privacy & Security"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
          </button>

          {/* User Profile info */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User Avatar'}
                className="w-8 h-8 rounded-full border border-indigo-500/40 object-cover shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 flex items-center justify-center text-xs font-bold shadow-xs">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            
            <div className="hidden lg:block text-left">
              <div className="text-xs font-medium text-slate-200 truncate max-w-[130px]">
                {user.displayName || 'Journaler'}
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                {user.email || 'Authenticated'}
              </div>
            </div>

            <button
              id="btn-sign-out"
              type="button"
              onClick={onSignOut}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
