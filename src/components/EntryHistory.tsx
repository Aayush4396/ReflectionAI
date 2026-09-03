import React, { useState, useMemo } from 'react';
import { JournalEntry, SemanticSearchMatch } from '../types';
import { searchSemantically } from '../lib/gemini-client';
import { 
  Search, 
  Tag, 
  Trash2, 
  Pin, 
  MessageSquare, 
  Calendar, 
  Edit3, 
  Eye, 
  Sparkles,
  SlidersHorizontal,
  X,
  RefreshCw,
  Archive,
  HelpCircle,
  BrainCircuit
} from 'lucide-react';

interface EntryHistoryProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onViewDetails: (entry: JournalEntry) => void;
  onTogglePin: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onOpenExport?: () => void;
}

const MOOD_EMOJIS: Record<string, string> = {
  thoughtful: '🤔',
  grateful: '🙏',
  peaceful: '🍃',
  energized: '⚡',
  anxious: '🌧️',
  neutral: '⚖️',
};

export const EntryHistory: React.FC<EntryHistoryProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onViewDetails,
  onTogglePin,
  onDeleteEntry,
  onOpenExport,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [showPinnedOnly, setShowPinnedOnly] = useState<boolean>(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  // Semantic Search State
  const [isSemanticMode, setIsSemanticMode] = useState<boolean>(false);
  const [isSearchingSemantics, setIsSearchingSemantics] = useState<boolean>(false);
  const [semanticMatches, setSemanticMatches] = useState<SemanticSearchMatch[]>([]);
  const [semanticExplanation, setSemanticExplanation] = useState<string | null>(null);
  const [semanticError, setSemanticError] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      e.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [entries]);

  // Execute Semantic Search
  const handleExecuteSemanticSearch = async (overrideQuery?: string) => {
    const q = overrideQuery !== undefined ? overrideQuery : searchQuery;
    if (!q.trim()) return;

    setIsSearchingSemantics(true);
    setSemanticError(null);
    try {
      const res = await searchSemantically({
        query: q.trim(),
        entries: entries.map((e) => ({
          id: e.id,
          title: e.title,
          content: e.content,
          tags: e.tags || [],
          mood: e.mood,
          createdAt: e.createdAt,
        })),
      });

      setSemanticMatches(res.matches || []);
      setSemanticExplanation(res.queryExplanation || null);
    } catch (err: any) {
      setSemanticError(err?.message || 'Semantic search encountered an issue.');
    } finally {
      setIsSearchingSemantics(false);
    }
  };

  const clearSemanticSearch = () => {
    setSemanticMatches([]);
    setSemanticExplanation(null);
    setSemanticError(null);
  };

  // Map of semantic matches by ID
  const semanticMatchMap = useMemo(() => {
    const map = new Map<string, SemanticSearchMatch>();
    semanticMatches.forEach((m) => {
      map.set(m.id, m);
    });
    return map;
  }, [semanticMatches]);

  // Filtered & Sorted entries
  const filteredEntries = useMemo(() => {
    // If in semantic mode with active matches
    if (isSemanticMode && semanticMatches.length > 0) {
      return entries
        .filter((entry) => semanticMatchMap.has(entry.id))
        .sort((a, b) => {
          const scoreA = semanticMatchMap.get(a.id)?.relevanceScore || 0;
          const scoreB = semanticMatchMap.get(b.id)?.relevanceScore || 0;
          return scoreB - scoreA;
        });
    }

    return entries.filter((entry) => {
      // Standard search
      if (searchQuery.trim() && !isSemanticMode) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = entry.title?.toLowerCase().includes(q);
        const matchesContent = entry.content?.toLowerCase().includes(q);
        const matchesTags = entry.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesMessages = entry.messages?.some((m) => m.text.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesTags && !matchesMessages) {
          return false;
        }
      }

      // Mood filter
      if (selectedMoodFilter && entry.mood !== selectedMoodFilter) {
        return false;
      }

      // Tag filter
      if (selectedTagFilter && !entry.tags?.includes(selectedTagFilter)) {
        return false;
      }

      // Pinned only
      if (showPinnedOnly && !entry.isPinned) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Pinned first, then newest updated
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });
  }, [entries, searchQuery, isSemanticMode, semanticMatches, semanticMatchMap, selectedMoodFilter, selectedTagFilter, showPinnedOnly]);

  const hasActiveFilters = Boolean(
    (!isSemanticMode && searchQuery) || 
    selectedMoodFilter || 
    selectedTagFilter || 
    showPinnedOnly || 
    (isSemanticMode && semanticMatches.length > 0)
  );

  return (
    <div className="w-full flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
      {/* Header & Search */}
      <div className="p-4 bg-slate-950/70 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base font-bold text-white">
              Reflection History
            </h3>
            <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded-full font-medium border border-slate-700/60">
              {filteredEntries.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenExport && (
              <button
                id="btn-history-export"
                type="button"
                onClick={onOpenExport}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                title="Export & Backup Journal"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              id="btn-filter-pinned-only"
              type="button"
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
              className={`px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                showPinnedOnly 
                  ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 font-semibold ring-1 ring-indigo-500/30' 
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${showPinnedOnly ? 'fill-indigo-400 text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Pinned Only</span>
            </button>
          </div>
        </div>

        {/* Mode Selector: Keyword vs AI Semantic Search */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setIsSemanticMode(false);
                clearSemanticSearch();
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                !isSemanticMode
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Exact Keyword
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSemanticMode(true);
                clearSemanticSearch();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                isSemanticMode
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BrainCircuit className="w-3 h-3 text-cyan-300" />
              <span>AI Semantic Search</span>
            </button>
          </div>

          {isSemanticMode && (
            <span className="text-[10px] text-cyan-300 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Conceptual Match</span>
            </span>
          )}
        </div>

        {/* Search Bar Input */}
        <div className="relative flex items-center gap-1.5">
          <div className="relative flex-1">
            {isSemanticMode ? (
              <BrainCircuit className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
            ) : (
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            )}

            <input
              id="input-history-search"
              type="text"
              placeholder={
                isSemanticMode 
                  ? "Describe concept: e.g. 'feeling overwhelmed with project deadlines'..." 
                  : "Search keywords, titles, tags..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isSemanticMode) {
                  handleExecuteSemanticSearch();
                }
              }}
              className={`w-full pl-9 pr-8 py-2 text-xs text-slate-200 bg-slate-950/60 border rounded-xl focus:outline-none focus:ring-2 placeholder:text-slate-500 ${
                isSemanticMode 
                  ? 'border-cyan-500/40 focus:border-cyan-400 focus:ring-cyan-500/20' 
                  : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/30'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  clearSemanticSearch();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isSemanticMode && (
            <button
              id="btn-trigger-semantic-search"
              type="button"
              onClick={() => handleExecuteSemanticSearch()}
              disabled={isSearchingSemantics || !searchQuery.trim()}
              className="px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {isSearchingSemantics ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Search</span>
            </button>
          )}
        </div>

        {/* Semantic Search Explanation Banner */}
        {isSemanticMode && semanticExplanation && (
          <div className="p-2.5 bg-cyan-950/30 border border-cyan-800/60 rounded-xl text-xs text-cyan-200 flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                Semantic Insight:
              </span>
              <p className="text-[11px] text-cyan-100">{semanticExplanation}</p>
            </div>
            <button
              type="button"
              onClick={clearSemanticSearch}
              className="text-cyan-400 hover:text-cyan-200 text-xs shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {semanticError && (
          <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-200">
            {semanticError}
          </div>
        )}

        {/* Tag & Mood Filter Chips (when not in semantic match mode) */}
        {!isSemanticMode && (allTags.length > 0 || hasActiveFilters) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <SlidersHorizontal className="w-3 h-3 text-slate-500 mr-0.5" />
            
            {allTags.slice(0, 6).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? null : tag)}
                className={`px-2 py-0.5 text-[11px] rounded-md transition-colors cursor-pointer ${
                  selectedTagFilter === tag
                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                }`}
              >
                #{tag}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedMoodFilter(null);
                  setSelectedTagFilter(null);
                  setShowPinnedOnly(false);
                  clearSemanticSearch();
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline ml-auto font-medium cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Entries List */}
      <div className="divide-y divide-slate-800/80 max-h-[620px] overflow-y-auto">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center space-y-2 text-slate-500">
            <div className="w-10 h-10 mx-auto rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-300">
              {isSemanticMode && searchQuery ? 'No semantic conceptual matches found' : 'No journal entries found'}
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              {isSemanticMode && searchQuery
                ? 'Try expressing your question in a different way or switch to exact keyword search.'
                : hasActiveFilters 
                ? 'Try broadening your search query or resetting active filters.' 
                : 'Write your first reflection on the left to start exploring insights!'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = selectedEntryId === entry.id;
            const moodEmoji = entry.mood ? MOOD_EMOJIS[entry.mood] || '📝' : '📝';
            const dateStr = new Date(entry.createdAt || entry.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const semanticMatch = semanticMatchMap.get(entry.id);

            return (
              <div
                key={entry.id}
                id={`entry-card-${entry.id}`}
                className={`p-4 transition-all hover:bg-slate-800/50 ${
                  isSelected ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-sm shrink-0" title={entry.mood || 'Reflection'}>
                      {moodEmoji}
                    </span>
                    <h4 
                      onClick={() => onSelectEntry(entry)}
                      className="text-xs sm:text-sm font-bold text-slate-100 truncate hover:text-indigo-400 cursor-pointer transition-colors"
                    >
                      {entry.title || 'Untitled Reflection'}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Pin toggle */}
                    <button
                      type="button"
                      onClick={() => onTogglePin(entry)}
                      className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                        entry.isPinned ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={entry.isPinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${entry.isPinned ? 'fill-indigo-400' : ''}`} />
                    </button>

                    {/* View Details modal */}
                    <button
                      type="button"
                      onClick={() => onViewDetails(entry)}
                      className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      title="View Full Conversation"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setEntryToDelete(entry.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Semantic Match Indicator */}
                {semanticMatch && (
                  <div className="mb-2 p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/50 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-cyan-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>Semantic Relevance</span>
                      </span>
                      <span className="font-mono font-bold text-cyan-200 bg-cyan-900/60 px-1.5 py-0.2 rounded border border-cyan-700/60">
                        {semanticMatch.relevanceScore}% Match
                      </span>
                    </div>
                    <p className="text-[11px] text-cyan-100 italic">
                      "{semanticMatch.matchedConcept}"
                    </p>
                  </div>
                )}

                {/* Excerpt */}
                <p 
                  onClick={() => onSelectEntry(entry)}
                  className="text-xs text-slate-400 line-clamp-2 leading-relaxed cursor-pointer mb-2.5 hover:text-slate-300 transition-colors"
                >
                  {entry.content || (entry.messages?.[0]?.text) || 'No journal text recorded yet.'}
                </p>

                {/* Footer Metadata & Tags */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{dateStr}</span>
                    </span>

                    {entry.messages && entry.messages.length > 0 && (
                      <span className="flex items-center gap-1 text-slate-400 font-medium">
                        <MessageSquare className="w-3 h-3 text-indigo-400" />
                        <span>{entry.messages.length}</span>
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.2 bg-slate-800 text-slate-300 border border-slate-700/60 rounded text-[10px]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-950/80 border border-rose-800 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Delete Reflection?</h4>
                <p className="text-xs text-slate-400">This action will permanently delete this journal entry.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEntryToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteEntry(entryToDelete);
                  setEntryToDelete(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
