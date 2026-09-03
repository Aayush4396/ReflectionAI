import React from 'react';
import { X, ShieldCheck, Lock, KeyRound, Database, Cpu, CheckCircle2 } from 'lucide-react';

interface ThreatModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThreatModelModal: React.FC<ThreatModelModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div 
        id="modal-threat-model"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Security & Threat Model Review</h3>
              <p className="text-xs text-slate-400">OWASP Top 10 + LLM Security Directives</p>
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
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-medium text-slate-200 text-xs">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>1. User Data Isolation</span>
              </div>
              <p className="text-xs text-slate-400">
                Firestore rules strictly restrict document reads and writes to <code className="bg-slate-800 border border-slate-700/60 px-1 py-0.5 rounded text-[11px] text-slate-200">users/&#123;userId&#125;/*</code> where <code className="bg-slate-800 border border-slate-700/60 px-1 py-0.5 rounded text-[11px] text-slate-200">request.auth.uid == userId</code>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-medium text-slate-200 text-xs">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>2. Zero Hardcoded API Keys</span>
              </div>
              <p className="text-xs text-slate-400">
                Gemini API tokens reside strictly server-side in Secret Manager / environment variables and are never sent to browser clients.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-medium text-slate-200 text-xs">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>3. Model Resilience Ladder</span>
              </div>
              <p className="text-xs text-slate-400">
                Automatic fallback chaining from <code className="bg-slate-800 border border-slate-700/60 px-1 py-0.5 rounded text-[11px] text-slate-200">gemini-3.6-flash</code> to <code className="bg-slate-800 border border-slate-700/60 px-1 py-0.5 rounded text-[11px] text-slate-200">gemini-3.1-flash-lite</code> &amp; <code className="bg-slate-800 border border-slate-700/60 px-1 py-0.5 rounded text-[11px] text-slate-200">gemini-3.7-flash</code>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-medium text-slate-200 text-xs">
                <Database className="w-4 h-4 text-purple-400" />
                <span>4. Undefined-Stripping Hygiene</span>
              </div>
              <p className="text-xs text-slate-400">
                Payload sanitizer recursively strips <code className="bg-slate-800 border border-slate-700/60 px-1 py-0.5 rounded text-[11px] text-slate-200">undefined</code> values prior to database transactions, eliminating runtime driver rejections.
              </p>
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-2.5 font-medium text-xs text-slate-200 border-b border-slate-800">
              Active Security Countermeasures Table
            </div>
            <div className="divide-y divide-slate-800/80 text-xs bg-slate-900/50">
              <div className="p-3 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">Federated Authentication:</strong> Google Sign-In with Firebase Auth prevents raw password storage or credential handling risks.
                </div>
              </div>
              <div className="p-3 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">Defensive Input Ingestion:</strong> Express server parses top-level JSON middleware first and safely sanitizes all body fields with fallback bounds.
                </div>
              </div>
              <div className="p-3 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">Indirect Prompt Injection Defense:</strong> Reflection contexts are wrapped in structured data delimiters and handled purely as journal data.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 bg-slate-950/80 border-t border-slate-800">
          <button
            id="btn-understand-threat-model"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-colors cursor-pointer"
          >
            Close Threat Model
          </button>
        </div>
      </div>
    </div>
  );
};
