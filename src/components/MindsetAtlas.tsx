import React, { useState, useMemo } from 'react';
import { JournalEntry, LocationPin } from '../types';
import { 
  MapPin, 
  Globe, 
  Compass, 
  ExternalLink, 
  Calendar, 
  Sparkles, 
  Tag, 
  Search, 
  Navigation,
  Layers,
  Info
} from 'lucide-react';

interface MindsetAtlasProps {
  entries: JournalEntry[];
  onOpenEntry: (entry: JournalEntry) => void;
}

const MOOD_COLOR_MAP: Record<string, { bg: string; border: string; text: string; dot: string; glow: string }> = {
  peaceful: { bg: 'bg-emerald-950/80', border: 'border-emerald-700', text: 'text-emerald-300', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/30' },
  energized: { bg: 'bg-amber-950/80', border: 'border-amber-700', text: 'text-amber-300', dot: 'bg-amber-400', glow: 'shadow-amber-500/30' },
  thoughtful: { bg: 'bg-indigo-950/80', border: 'border-indigo-700', text: 'text-indigo-300', dot: 'bg-indigo-400', glow: 'shadow-indigo-500/30' },
  anxious: { bg: 'bg-rose-950/80', border: 'border-rose-700', text: 'text-rose-300', dot: 'bg-rose-400', glow: 'shadow-rose-500/30' },
  grateful: { bg: 'bg-pink-950/80', border: 'border-pink-700', text: 'text-pink-300', dot: 'bg-pink-400', glow: 'shadow-pink-500/30' },
  neutral: { bg: 'bg-slate-900/80', border: 'border-slate-700', text: 'text-slate-300', dot: 'bg-slate-400', glow: 'shadow-slate-500/30' },
};

export const MindsetAtlas: React.FC<MindsetAtlasProps> = ({
  entries,
  onOpenEntry,
}) => {
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [activePinEntry, setActivePinEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter entries that have valid location coordinates
  const localizedEntries = useMemo(() => {
    return entries.filter(e => e.location && typeof e.location.lat === 'number' && typeof e.location.lng === 'number');
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return localizedEntries.filter(e => {
      const matchesMood = selectedMood === 'all' || e.mood === selectedMood;
      const matchesSearch = !searchQuery.trim() || 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location?.placeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location?.city?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMood && matchesSearch;
    });
  }, [localizedEntries, selectedMood, searchQuery]);

  // Spatial stats calculation
  const spatialStats = useMemo(() => {
    const locationCounts: Record<string, number> = {};
    const moodByLoc: Record<string, Record<string, number>> = {};

    localizedEntries.forEach(e => {
      const locKey = e.location?.city || e.location?.placeName || 'Other';
      locationCounts[locKey] = (locationCounts[locKey] || 0) + 1;
      
      if (!moodByLoc[locKey]) moodByLoc[locKey] = {};
      const mood = e.mood || 'neutral';
      moodByLoc[locKey][mood] = (moodByLoc[locKey][mood] || 0) + 1;
    });

    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return { topLocations, totalPinned: localizedEntries.length };
  }, [localizedEntries]);

  // Calculate visual layout bounds for the map projection
  const bounds = useMemo(() => {
    if (filteredEntries.length === 0) {
      return { minLat: 37.7, maxLat: 37.9, minLng: -122.5, maxLng: -122.3 };
    }
    const lats = filteredEntries.map(e => e.location!.lat);
    const lngs = filteredEntries.map(e => e.location!.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latMargin = Math.max(0.04, (maxLat - minLat) * 0.25);
    const lngMargin = Math.max(0.04, (maxLng - minLng) * 0.25);

    return {
      minLat: minLat - latMargin,
      maxLat: maxLat + latMargin,
      minLng: minLng - lngMargin,
      maxLng: maxLng + lngMargin,
    };
  }, [filteredEntries]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Places &amp; Memories</span>
              </h1>
              <p className="text-xs text-slate-400">
                See how the places you visit, travel to, and spend time in shape your thoughts, headspace, and mood.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-slate-950/80 rounded-xl border border-slate-800 text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Places Pinned</span>
              <span className="text-sm font-bold text-cyan-400">{spatialStats.totalPinned} / {entries.length}</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* Mood Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Filter Mood:
            </span>
            {['all', 'peaceful', 'energized', 'thoughtful', 'anxious', 'grateful'].map(mood => (
              <button
                key={mood}
                type="button"
                onClick={() => setSelectedMood(mood)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                  selectedMood === mood
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location or title..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map Visualizer + Location Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visual Map Canvas & Pins (8 cols on lg) */}
        <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl relative min-h-[460px] flex flex-col">
          {/* Map Top Bar */}
          <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-medium text-slate-200">Cartographic Canvas</span>
              <span className="text-[10px] text-slate-500">
                ({filteredEntries.length} {filteredEntries.length === 1 ? 'location plotted' : 'locations plotted'})
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Peaceful</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Energized</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-400"></span> Thoughtful</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Anxious</span>
            </div>
          </div>

          {/* Map Stage */}
          <div className="relative flex-1 min-h-[400px] bg-[#060c1c] overflow-hidden flex items-center justify-center p-6">
            {/* Grid Pattern Background */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)',
                backgroundSize: '28px 28px'
              }}
            />
            {/* Subtle Radar Scan Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <div className="w-[320px] h-[320px] rounded-full border border-cyan-500"></div>
              <div className="w-[540px] h-[540px] rounded-full border border-cyan-500 absolute"></div>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="relative z-10 text-center max-w-sm px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-cyan-400 shadow-md">
                  <Navigation className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">No Location-Pinned Entries Found</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {localizedEntries.length === 0
                    ? 'Pin your current GPS or place setting when writing a reflection in the Journal editor to plot it on your Mindset Atlas.'
                    : 'No entries match your current mood filter or search query.'}
                </p>
              </div>
            ) : (
              /* Plotted Map Pins */
              <div className="relative w-full h-full min-h-[380px]">
                {filteredEntries.map((entry) => {
                  const latSpan = bounds.maxLat - bounds.minLat || 1;
                  const lngSpan = bounds.maxLng - bounds.minLng || 1;
                  
                  // Invert latitude for Y-axis (top = higher lat)
                  const topPercent = Math.max(10, Math.min(88, ((bounds.maxLat - entry.location!.lat) / latSpan) * 80 + 10));
                  const leftPercent = Math.max(10, Math.min(88, ((entry.location!.lng - bounds.minLng) / lngSpan) * 80 + 10));

                  const moodStyle = MOOD_COLOR_MAP[entry.mood || 'neutral'] || MOOD_COLOR_MAP.neutral;
                  const isSelected = activePinEntry?.id === entry.id;

                  return (
                    <div
                      key={entry.id}
                      style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
                      onClick={() => setActivePinEntry(entry)}
                    >
                      {/* Pulse ring for active selection */}
                      {isSelected && (
                        <div className={`absolute -inset-2 rounded-full animate-ping opacity-75 ${moodStyle.dot}`} />
                      )}

                      {/* Pin marker button */}
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 border shadow-lg ${
                          isSelected 
                            ? `${moodStyle.bg} ${moodStyle.border} scale-125 ring-2 ring-white/60 shadow-xl` 
                            : 'bg-slate-900/90 border-slate-700 hover:scale-110 hover:border-cyan-400'
                        }`}
                      >
                        <MapPin className={`w-4 h-4 ${isSelected ? moodStyle.text : 'text-cyan-400'}`} />
                      </div>

                      {/* Floating tooltip label */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none whitespace-nowrap z-30">
                        <div className="px-2.5 py-1 bg-slate-950/95 border border-slate-700 text-[11px] rounded-lg shadow-xl text-slate-200 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${moodStyle.dot}`}></span>
                          <span className="font-semibold">{entry.location?.placeName || entry.title}</span>
                          <span className="text-[9px] text-slate-400">({entry.mood || 'neutral'})</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Location & Reflection Inspector (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-5">
          {activePinEntry ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Pinned Reflection
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border capitalize ${
                  (MOOD_COLOR_MAP[activePinEntry.mood || 'neutral'] || MOOD_COLOR_MAP.neutral).bg
                } ${(MOOD_COLOR_MAP[activePinEntry.mood || 'neutral'] || MOOD_COLOR_MAP.neutral).text} ${(MOOD_COLOR_MAP[activePinEntry.mood || 'neutral'] || MOOD_COLOR_MAP.neutral).border}`}>
                  {activePinEntry.mood || 'neutral'}
                </span>
              </div>

              <h2 className="text-base font-bold text-white mb-2 leading-tight">
                {activePinEntry.title}
              </h2>

              <p className="text-xs text-slate-300 line-clamp-4 leading-relaxed mb-4">
                {activePinEntry.content}
              </p>

              {/* Geographic Coordinates & Address */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 mb-4 space-y-1.5 text-xs">
                <div className="text-slate-200 font-medium truncate">
                  {activePinEntry.location?.placeName || activePinEntry.location?.address}
                </div>
                <div className="text-[11px] text-slate-400">
                  {activePinEntry.location?.lat.toFixed(4)}°N, {activePinEntry.location?.lng.toFixed(4)}°W
                </div>
                <div className="flex items-center gap-2 pt-1.5 border-t border-slate-800/60">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${activePinEntry.location?.lat},${activePinEntry.location?.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    <span>Inspect on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Metadata tags */}
              {activePinEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {activePinEntry.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-slate-800 text-[10px] text-slate-400 rounded-md border border-slate-700/60">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => onOpenEntry(activePinEntry)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open in Journal Workbench</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center shadow-lg">
              <Compass className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h3 className="text-xs font-semibold text-slate-300 mb-1">Click Any Pin on the Atlas</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Select a plotted pin on the cartographic canvas to inspect the entry, read reflection notes, and explore local spatial patterns.
              </p>
            </div>
          )}

          {/* Top Reflection Environments Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <h3 className="text-xs font-bold text-white mb-2.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Top Journaling Environments</span>
            </h3>
            {spatialStats.topLocations.length === 0 ? (
              <p className="text-xs text-slate-500">No location records yet.</p>
            ) : (
              <div className="space-y-2">
                {spatialStats.topLocations.map(([loc, count]) => (
                  <div key={loc} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <span className="font-medium text-slate-300 truncate max-w-[170px]">{loc}</span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/50 text-[10px] font-bold">
                      {count} {count === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
