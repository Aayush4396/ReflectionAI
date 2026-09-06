import React, { useState } from 'react';
import { X, ShieldCheck, Lock, KeyRound, Download, CheckCircle2, ChevronDown } from 'lucide-react';

interface ThreatModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThreatModelModal: React.FC<ThreatModelModalProps> = ({ isOpen, onClose }) => {
  const [showTechDetails, setShowTechDetails] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div 
        id="modal-threat-model"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-xl shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Your Privacy &amp; Trust Promise</h3>
              <p className="text-xs text-slate-400">Your reflections are sacred, confidential, and completely yours</p>
            </div>
          </div>
          <button
            id="btn-close-threat-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300 leading-relaxed">
          {/* 4 Core Pillars for Everyday People */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 bg-slate-950/70 border border-slate-800/90 rounded-xl space-y-2 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-2 font-semibold text-slate-100 text-xs">
                <div className="p-1 bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 rounded-md">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <span>Strictly Private to You</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nobody else—not other users or ReflectAI staff—can ever view your journal entries. Your writings belong solely to your account.
              </p>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800/90 rounded-xl space-y-2 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-2 font-semibold text-slate-100 text-xs">
                <div className="p-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Never Used to Train AI</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your personal thoughts, emotions, and entries will never be used to train or fine-tune public artificial intelligence models.
              </p>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800/90 rounded-xl space-y-2 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-2 font-semibold text-slate-100 text-xs">
                <div className="p-1 bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded-md">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <span>Bank-Grade Cloud Encryption</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every reflection is continuously secured and encrypted in transit and in storage using Google Cloud's world-class security infrastructure.
              </p>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800/90 rounded-xl space-y-2 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-2 font-semibold text-slate-100 text-xs">
                <div className="p-1 bg-purple-950/80 text-purple-400 border border-purple-800/60 rounded-md">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <span>Total Ownership &amp; Control</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                You can download a complete backup of your entire diary at any time, or permanently delete any entry with a single click.
              </p>
            </div>
          </div>

          {/* Simple Reassurance Note */}
          <div className="p-3.5 bg-indigo-950/30 border border-indigo-900/50 rounded-xl flex items-center gap-3 text-xs text-indigo-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Safe Google Sign-In:</strong> Your account is protected by Google Account verification with no passwords to lose or compromise.
            </span>
          </div>

          {/* Optional Discrete Developer/Auditor Drawer */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowTechDetails(!showTechDetails)}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <span>Technical &amp; Architecture Audit Details</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showTechDetails ? 'rotate-180' : ''}`} />
            </button>

            {showTechDetails && (
              <div className="mt-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-[11px] text-slate-400">
                <p>
                  <strong className="text-slate-300">Data Isolation:</strong> Firestore rules enforce <code className="text-indigo-300">users/&#123;userId&#125;/*</code> with strict <code className="text-indigo-300">request.auth.uid == userId</code>.
                </p>
                <p>
                  <strong className="text-slate-300">Secret Management:</strong> Gemini API keys reside strictly in Secret Manager / server-side environment.
                </p>
                <p>
                  <strong className="text-slate-300">SSRF Defense:</strong> Webhook dispatchers block internal/loopback ranges (<code className="text-indigo-300">127.0.0.1</code>, <code className="text-indigo-300">169.254.169.254</code>).
                </p>
                <p>
                  <strong className="text-slate-300">Fallback Ladder:</strong> Resilient 5-tier Gemini model failover ladder active.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <span className="text-xs text-slate-500">🔒 100% Private, encrypted, and isolated</span>
          <button
            id="btn-understand-threat-model"
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-colors cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
