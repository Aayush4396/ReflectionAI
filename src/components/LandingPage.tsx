import React from 'react';
import { Sparkles, Shield, Lock, Brain, BookOpen, ArrowRight, CheckCircle2, Cloud } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  isSigningIn: boolean;
  error: string | null;
  onOpenThreatModel: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  isSigningIn,
  error,
  onOpenThreatModel,
}) => {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Subtle background glow elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-indigo-900/20 via-purple-900/10 to-transparent blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-white">
            ReflectAI
          </span>
        </div>

        <button
          id="btn-landing-threat-model"
          type="button"
          onClick={onOpenThreatModel}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900/80 border border-slate-700/80 rounded-full hover:bg-slate-800 hover:text-white transition-all shadow-xs backdrop-blur-md cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Security &amp; Threat Model</span>
        </button>
      </header>

      {/* Main Hero & Auth Section */}
      <main className="w-full max-w-4xl mx-auto px-6 py-10 my-auto flex flex-col items-center text-center relative z-10">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-950/80 border border-indigo-800/70 text-indigo-300 text-xs font-medium rounded-full mb-6 shadow-xs backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Thoughtful AI Reflection &amp; Private Journaling</span>
        </div>

        {/* Display Title */}
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-3xl leading-[1.15]">
          A private sanctuary for your thoughts and deep reflections.
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl font-light leading-relaxed">
          Write journal entries, explore thoughtful inquiries, and converse with an empathetic AI reflection companion. All reflections remain strictly private to your personal account.
        </p>

        {/* Error Banner */}
        {error && (
          <div className="mt-6 w-full max-w-md p-3.5 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl text-xs text-left shadow-lg backdrop-blur-md">
            <p className="font-semibold mb-0.5 text-rose-300">Sign-In Notice</p>
            <p>{error}</p>
          </div>
        )}

        {/* CTA Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <button
            id="btn-google-sign-in"
            type="button"
            disabled={isSigningIn}
            onClick={onSignIn}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google Sign-In</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>

        {/* Feature Pillars */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg backdrop-blur-md space-y-2.5 hover:border-slate-700 transition-all">
            <div className="w-9 h-9 rounded-xl bg-indigo-950/80 text-indigo-400 flex items-center justify-center border border-indigo-800/60 shadow-xs">
              <Brain className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">Guided AI Reflection Partner</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore your thoughts through multiple lenses: Socratic questioning, structured summaries, creative brainstorming, and actionable next steps.
            </p>
          </div>

          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg backdrop-blur-md space-y-2.5 hover:border-slate-700 transition-all">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center border border-emerald-800/60 shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">Strict Privacy &amp; Protection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your reflections belong solely to you. Complete account-level data isolation guarantees no other user can access your private journals.
            </p>
          </div>

          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg backdrop-blur-md space-y-2.5 hover:border-slate-700 transition-all">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-800/60 shadow-xs">
              <Cloud className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">Real-Time Cloud Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Seamlessly access your thoughts anywhere. Filter entries by mood, search tags, pin key insights, and revisit your growth anytime.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Secure Google authentication with private encrypted cloud storage.</span>
        </div>
        <p>&copy; {new Date().getFullYear()} ReflectAI. All personal entries encrypted &amp; isolated.</p>
      </footer>
    </div>
  );
};
