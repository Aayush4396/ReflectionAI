import React, { useState } from 'react';
import { JournalEntry } from '../types';
import Markdown from 'react-markdown';
import { 
  X, 
  Sparkles, 
  Calendar, 
  Tag, 
  Copy, 
  Check, 
  Edit3, 
  MessageSquare,
  Pin,
  ListCheck
} from 'lucide-react';

interface EntryDetailModalProps {
  entry: JournalEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onEditInWorkbench: (entry: JournalEntry) => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  isOpen,
  onClose,
  onEditInWorkbench,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !entry) return null;

  const handleCopy = () => {
    let fullText = `# ${entry.title}\n\n`;
    if (entry.content) {
      fullText += `## Journal Entry\n${entry.content}\n\n`;
    }
    if (entry.messages && entry.messages.length > 0) {
      fullText += `## Reflection Dialogue\n`;
      entry.messages.forEach((m) => {
        fullText += `### ${m.sender === 'user' ? 'Prompt' : 'AI Reflection'}\n${m.text}\n\n`;
      });
    }

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div 
        id="modal-entry-detail"
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold font-serif text-white">
                {entry.title || 'Untitled Reflection'}
              </h3>
              {entry.isPinned && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-950/80 border border-indigo-700 text-indigo-300 rounded-full flex items-center gap-1">
                  <Pin className="w-3 h-3 fill-indigo-400" />
                  <span>Pinned</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </span>
              {entry.mood && (
                <span className="capitalize bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[11px] text-slate-300">
                  Mood: {entry.mood}
                </span>
              )}
            </div>
          </div>

          <button
            id="btn-close-detail-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-200">
          {/* Initial content */}
          {entry.content && (
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Original Journal Entry:
              </span>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-200">
                {entry.content}
              </p>
            </div>
          )}

          {/* Action Items if present */}
          {entry.actionItems && entry.actionItems.length > 0 && (
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <ListCheck className="w-3.5 h-3.5" />
                <span>Action Items &amp; Commitments ({entry.actionItems.length}):</span>
              </span>
              <ul className="space-y-1.5 pl-1">
                {entry.actionItems.map((act, i) => (
                  <li key={i} className="text-xs text-slate-200 flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              {entry.tags.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700/60 rounded-md text-xs font-medium">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Conversation history */}
          {entry.messages && entry.messages.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reflection Dialogue</span>
              </h4>

              <div className="space-y-3">
                {entry.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-4 rounded-xl border ${
                      m.sender === 'user'
                        ? 'bg-slate-800/90 border-slate-700 ml-6 text-slate-200'
                        : 'bg-indigo-950/40 border-indigo-900/60 mr-6 text-slate-100 shadow-md shadow-indigo-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
                      <span className="font-semibold text-slate-200">
                        {m.sender === 'user' ? 'You' : 'AI Reflection'}
                      </span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-xs sm:text-sm prose prose-invert max-w-none text-slate-200">
                      <Markdown>{m.text}</Markdown>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <button
            id="btn-copy-entry"
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-edit-in-workbench"
              type="button"
              onClick={() => {
                onEditInWorkbench(entry);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Continue in Editor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
