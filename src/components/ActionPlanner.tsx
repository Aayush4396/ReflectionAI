import React, { useState } from 'react';
import { ActionItem } from '../types';
import { extractActionSteps } from '../lib/gemini-client';
import { 
  ListCheck, 
  Sparkles, 
  Calendar, 
  Download, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Tag, 
  RefreshCw, 
  AlertCircle,
  ExternalLink,
  Plus
} from 'lucide-react';

interface ActionPlannerProps {
  title: string;
  content: string;
  dialogue?: string[];
  initialActions?: string[];
  onSaveActions?: (actions: string[]) => void;
}

export const ActionPlanner: React.FC<ActionPlannerProps> = ({
  title,
  content,
  dialogue = [],
  initialActions = [],
  onSaveActions,
}) => {
  const [items, setItems] = useState<ActionItem[]>(
    initialActions.map((act, i) => ({
      id: String(i + 1),
      title: act,
      category: 'work',
      estimatedMinutes: 20,
      completed: false,
    }))
  );
  const [summary, setSummary] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState<string>('');

  const handleExtractActions = async () => {
    if (!content.trim() && dialogue.length === 0) {
      setError('Please write some thoughts or reflection dialogue first.');
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const res = await extractActionSteps({
        title,
        content,
        dialogue,
      });

      setItems(res.actionItems);
      setSummary(res.reflectionSummary);
      if (onSaveActions) {
        onSaveActions(res.actionItems.map((a) => a.title));
      }
    } catch (err: any) {
      console.error('Extraction failed:', err);
      setError(err?.message || 'Failed to extract action items.');
    } finally {
      setIsExtracting(false);
    }
  };

  const toggleComplete = (id: string) => {
    const updated = items.map((it) => it.id === id ? { ...it, completed: !it.completed } : it);
    setItems(updated);
    if (onSaveActions) {
      onSaveActions(updated.map((a) => a.title));
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem: ActionItem = {
      id: crypto.randomUUID(),
      title: newItemTitle.trim(),
      category: 'personal',
      estimatedMinutes: 15,
      completed: false,
    };

    const updated = [...items, newItem];
    setItems(updated);
    setNewItemTitle('');
    if (onSaveActions) {
      onSaveActions(updated.map((a) => a.title));
    }
  };

  // Google Calendar Quick Schedule URL Generator
  const createGoogleCalendarUrl = (item: ActionItem) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // tomorrow
    startDate.setHours(10, 0, 0, 0);

    const endDate = new Date(startDate.getTime() + (item.estimatedMinutes || 30) * 60000);

    const formatGCalTime = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const eventTitle = encodeURIComponent(`[ReflectAI Action] ${item.title}`);
    const details = encodeURIComponent(`Extracted from Reflection: "${title}"\nCategory: ${item.category}\nEstimated Time: ${item.estimatedMinutes} mins`);
    const dates = `${formatGCalTime(startDate)}/${formatGCalTime(endDate)}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&details=${details}&dates=${dates}`;
  };

  // Export as .ICS calendar event file for Apple Calendar / Outlook / Google
  const downloadIcsFile = () => {
    if (items.length === 0) return;

    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ReflectAI//Action Planner//EN\n";
    
    items.forEach((item, index) => {
      const start = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(9 + index, 0, 0, 0);
      const end = new Date(start.getTime() + (item.estimatedMinutes || 30) * 60000);

      const formatIcsTime = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:${item.id}@reflectai.internal\n`;
      icsContent += `DTSTAMP:${formatIcsTime(new Date())}\n`;
      icsContent += `DTSTART:${formatIcsTime(start)}\n`;
      icsContent += `DTEND:${formatIcsTime(end)}\n`;
      icsContent += `SUMMARY:[ReflectAI] ${item.title}\n`;
      icsContent += `DESCRIPTION:Action item from reflection: ${title}\n`;
      icsContent += "STATUS:CONFIRMED\n";
      icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.slice(0, 20).replace(/\s+/g, '_')}_actions.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4 shadow-inner">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-950 text-indigo-400 border border-indigo-800/80 rounded-xl">
            <ListCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-tight">Actionable Steps &amp; Calendar Export</h4>
            <p className="text-[10px] text-slate-400">Convert reflective breakthroughs into concrete calendar tasks.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-extract-actions"
            type="button"
            onClick={handleExtractActions}
            disabled={isExtracting || (!content.trim() && dialogue.length === 0)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {isExtracting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Tasks...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Extract Action Items</span>
              </>
            )}
          </button>

          {items.length > 0 && (
            <button
              id="btn-download-ics"
              type="button"
              onClick={downloadIcsFile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Export all action tasks as an .ICS Calendar File"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export .ICS</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {summary && (
        <div className="p-3 bg-slate-900/90 border border-indigo-900/50 rounded-xl text-xs text-indigo-200 leading-relaxed">
          <strong className="text-white block mb-0.5">Commitment Focus:</strong>
          {summary}
        </div>
      )}

      {/* Action Items List */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">
            No action items generated yet. Click "Extract Action Items" to synthesize actionable tasks from your notes.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                item.completed
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => toggleComplete(item.id)}
                  className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <span className={`text-xs block truncate ${item.completed ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}`}>
                    {item.title}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                    {item.category && (
                      <span className="capitalize px-1.5 py-0.2 bg-slate-800 rounded text-slate-300">
                        {item.category}
                      </span>
                    )}
                    {item.estimatedMinutes && (
                      <span className="flex items-center gap-0.5 text-slate-400">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{item.estimatedMinutes}m</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Schedule in Google Calendar Link */}
              <a
                href={createGoogleCalendarUrl(item)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Schedule in Google Calendar"
              >
                <Calendar className="w-3 h-3 text-indigo-400" />
                <span className="hidden sm:inline">Add to G-Cal</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            </div>
          ))
        )}
      </div>

      {/* Manual Task Add */}
      <form onSubmit={handleAddItem} className="flex gap-2 pt-1">
        <input
          type="text"
          placeholder="Add custom action step..."
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200 placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!newItemTitle.trim()}
          className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>
    </div>
  );
};
