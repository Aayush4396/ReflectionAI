import React, { useState } from 'react';
import { JournalEntry } from '../types';
import { 
  X, 
  Download, 
  FileText, 
  FileCode, 
  Check, 
  Database,
  Archive,
  Calendar,
  Sparkles
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  entries,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalWords = entries.reduce((acc, e) => acc + (e.content ? e.content.trim().split(/\s+/).length : 0), 0);
  const totalDialogues = entries.reduce((acc, e) => acc + (e.messages ? e.messages.length : 0), 0);
  const totalActionItems = entries.reduce((acc, e) => acc + (e.actionItems ? e.actionItems.length : 0), 0);

  const getFormattedDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // 1. Export as Formatted JSON
  const handleExportJSON = () => {
    const backupData = {
      exportMetadata: {
        app: 'ReflectAI Private Journal',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        totalEntries: entries.length,
        totalWords,
        totalDialogueExchanges: totalDialogues,
        totalActionItems,
      },
      entries: entries.map((e) => ({
        id: e.id,
        title: e.title,
        content: e.content,
        mood: e.mood,
        tags: e.tags,
        actionItems: e.actionItems || [],
        messages: e.messages || [],
        isPinned: Boolean(e.isPinned),
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ReflectAI_Backup_${getFormattedDate()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess('Full JSON backup downloaded successfully.');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 2. Export as Formatted Markdown Diary Archive
  const handleExportMarkdown = () => {
    let md = `# 📖 ReflectAI Personal Journal Archive\n\n`;
    md += `*Exported on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}*\n\n`;
    md += `**Summary:** ${entries.length} Reflections | ${totalWords.toLocaleString()} Words | ${totalDialogues} AI Inquiries | ${totalActionItems} Action Items\n\n`;
    md += `---\n\n## 📑 Table of Contents\n\n`;

    // Table of contents
    entries.forEach((e, idx) => {
      const dateStr = new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const slug = (e.title || 'Untitled').toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      md += `${idx + 1}. [${e.title || 'Untitled'} (${dateStr})](#${slug})\n`;
    });

    md += `\n---\n\n`;

    // Each Entry
    entries.forEach((entry, idx) => {
      const dateStr = new Date(entry.createdAt).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const timeStr = new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const moodStr = entry.mood ? entry.mood.toUpperCase() : 'NEUTRAL';
      const tagsStr = entry.tags && entry.tags.length > 0 ? entry.tags.map(t => `#${t}`).join(' ') : 'None';

      md += `## ${idx + 1}. ${entry.title || 'Untitled'}\n\n`;
      md += `*📅 ${dateStr} at ${timeStr}* | *Mindset: **${moodStr}*** | *Tags: ${tagsStr}*\n\n`;
      md += `### Reflection Content\n\n${entry.content || '*No written draft*'}\n\n`;

      if (entry.actionItems && entry.actionItems.length > 0) {
        md += `### 🎯 Action Items & Commitments\n\n`;
        entry.actionItems.forEach((act) => {
          md += `- [ ] ${act}\n`;
        });
        md += `\n`;
      }

      if (entry.messages && entry.messages.length > 0) {
        md += `### 💬 Socratic Exploration Dialogue\n\n`;
        entry.messages.forEach((msg) => {
          const role = msg.sender === 'user' ? '👤 Author' : '✨ ReflectAI Partner';
          md += `**${role}:**\n> ${msg.text.replace(/\n/g, '\n> ')}\n\n`;
        });
      }

      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ReflectAI_Journal_Archive_${getFormattedDate()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess('Markdown journal archive downloaded successfully.');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Data Portability &amp; Archive Export
              </h3>
              <p className="text-xs text-slate-400">
                You own 100% of your reflections. Export your complete archive anytime.
              </p>
            </div>
          </div>

          <button
            id="btn-close-export-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Total Entries
              </span>
              <span className="text-sm font-bold text-white">{entries.length}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Total Words
              </span>
              <span className="text-sm font-bold text-indigo-300">{totalWords.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Action Items
              </span>
              <span className="text-sm font-bold text-emerald-300">{totalActionItems}</span>
            </div>
          </div>

          {downloadSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-3 pt-1">
            {/* Markdown Export Card */}
            <div className="p-4 bg-slate-950/40 border border-slate-800 hover:border-slate-700 rounded-xl flex items-start justify-between gap-4 transition-all">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Markdown Journal Book (.md)</span>
                    <span className="px-1.5 py-0.5 text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 rounded">
                      Recommended
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Formatted text document containing all entries, complete with table of contents, timestamps, tags, AI dialogues, and action checklists. Ideal for Obsidian, Notion, or local reading.
                  </p>
                </div>
              </div>

              <button
                id="btn-export-markdown"
                type="button"
                onClick={handleExportMarkdown}
                className="shrink-0 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .MD</span>
              </button>
            </div>

            {/* JSON Schema Export Card */}
            <div className="p-4 bg-slate-950/40 border border-slate-800 hover:border-slate-700 rounded-xl flex items-start justify-between gap-4 transition-all">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-0.5">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Full JSON Database Backup (.json)</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Standard raw JSON schema export containing all database attributes, message histories, and metadata. Suitable for custom software migrations or cold offline backups.
                  </p>
                </div>
              </div>

              <button
                id="btn-export-json"
                type="button"
                onClick={handleExportJSON}
                className="shrink-0 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Export .JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Zero vendor lock-in guarantee</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
