import React, { useState, useEffect, useRef } from 'react';
import { 
  JournalEntry, 
  EntryMessage, 
  ReflectionMode,
  LocationPin
} from '../types';
import { askGeminiReflection } from '../lib/gemini-client';
import { saveJournalEntry } from '../lib/firestore';
import { VoiceRecorder } from './VoiceRecorder';
import { ActionPlanner } from './ActionPlanner';
import { LocationPicker } from './LocationPicker';
import Markdown from 'react-markdown';
import { 
  Send, 
  Sparkles, 
  Brain, 
  ListCheck, 
  Lightbulb, 
  HeartHandshake, 
  FileText, 
  Tag, 
  Save, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  X,
  Smile,
  Clock,
  Pin,
  Mic,
  Compass
} from 'lucide-react';

interface JournalEditorProps {
  userId: string;
  activeEntry: JournalEntry | null;
  onEntrySaved: (saved: JournalEntry) => void;
  onReset: () => void;
  onOpenGuidedExercises?: () => void;
}

const MOODS: Array<{ value: JournalEntry['mood']; label: string; icon: string; bg: string; text: string }> = [
  { value: 'thoughtful', label: 'Thoughtful', icon: '🤔', bg: 'bg-indigo-950/80 border-indigo-700', text: 'text-indigo-300' },
  { value: 'grateful', label: 'Grateful', icon: '🙏', bg: 'bg-amber-950/80 border-amber-700', text: 'text-amber-300' },
  { value: 'peaceful', label: 'Peaceful', icon: '🍃', bg: 'bg-emerald-950/80 border-emerald-700', text: 'text-emerald-300' },
  { value: 'energized', label: 'Energized', icon: '⚡', bg: 'bg-orange-950/80 border-orange-700', text: 'text-orange-300' },
  { value: 'anxious', label: 'Anxious', icon: '🌧️', bg: 'bg-slate-800/80 border-slate-600', text: 'text-slate-300' },
  { value: 'neutral', label: 'Neutral', icon: '⚖️', bg: 'bg-slate-800/80 border-slate-600', text: 'text-slate-300' },
];

const MODES: Array<{ id: ReflectionMode; label: string; icon: React.FC<{ className?: string }>; description: string }> = [
  { id: 'socratic', label: 'Thoughtful Questions', icon: Brain, description: 'Gentle, thought-provoking questions to help you explore your thoughts deeper.' },
  { id: 'summary', label: 'Summary & Takeaways', icon: FileText, description: 'A clear, structured overview of what you wrote with key takeaways.' },
  { id: 'brainstorm', label: 'Fresh Perspectives', icon: Lightbulb, description: 'New creative angles and alternative viewpoints to consider.' },
  { id: 'action_items', label: 'Action Steps', icon: ListCheck, description: 'Clear, practical micro-steps to turn reflection into progress.' },
  { id: 'empathy', label: 'Mindful Support', icon: HeartHandshake, description: 'Empathetic validation and warm, compassionate emotional presence.' },
];

const PROMPT_STARTERS = [
  'What decision or challenge is currently taking up the most mental space?',
  'What went surprisingly well today, and what made it happen?',
  'What is one boundary or priority I want to protect this week?',
  'Untangle a thought or feeling that felt confusing recently.',
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  userId,
  activeEntry,
  onEntrySaved,
  onReset,
  onOpenGuidedExercises,
}) => {
  const [entryId, setEntryId] = useState<string>(activeEntry ? activeEntry.id : crypto.randomUUID());
  const [title, setTitle] = useState<string>(activeEntry ? activeEntry.title : '');
  const [content, setContent] = useState<string>(activeEntry ? activeEntry.content : '');
  const [mood, setMood] = useState<JournalEntry['mood']>(activeEntry?.mood || 'thoughtful');
  const [tags, setTags] = useState<string[]>(activeEntry?.tags || ['Reflection']);
  const [tagInput, setTagInput] = useState<string>('');
  const [isPinned, setIsPinned] = useState<boolean>(activeEntry?.isPinned || false);
  const [selectedMode, setSelectedMode] = useState<ReflectionMode>('socratic');
  const [actionItems, setActionItems] = useState<string[]>(activeEntry?.actionItems || []);
  const [location, setLocation] = useState<LocationPin | undefined>(activeEntry?.location);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState<boolean>(false);
  
  // Multi-turn conversation state
  const [messages, setMessages] = useState<EntryMessage[]>(activeEntry?.messages || []);
  const [followUpPrompt, setFollowUpPrompt] = useState<string>('');
  
  // Loading & Save states
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync when activeEntry changes
  useEffect(() => {
    if (activeEntry) {
      setEntryId(activeEntry.id);
      setTitle(activeEntry.title || '');
      setContent(activeEntry.content || '');
      setMood(activeEntry.mood || 'thoughtful');
      setTags(activeEntry.tags || []);
      setLocation(activeEntry.location);
      setIsPinned(Boolean(activeEntry.isPinned));
      setActionItems(activeEntry.actionItems || []);
      setMessages(activeEntry.messages || []);
      setSaveStatus('saved');
    } else {
      setEntryId(crypto.randomUUID());
      setTitle('');
      setContent('');
      setMood('thoughtful');
      setTags(['Reflection']);
      setLocation(undefined);
      setIsPinned(false);
      setActionItems([]);
      setMessages([]);
      setSaveStatus('idle');
    }
    setShowVoiceRecorder(false);
    setErrorMessage(null);
  }, [activeEntry]);

  // Scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiLoading]);

  // Add Tag
  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const cleanTag = tagInput.trim().replace(/^#/, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Perform Firestore Save
  const performSave = async (updatedMessages?: EntryMessage[], newTitle?: string, newActionItems?: string[]) => {
    try {
      setSaveStatus('saving');
      setErrorMessage(null);

      const entryToSave: JournalEntry = {
        id: entryId,
        userId,
        title: (newTitle !== undefined ? newTitle : title).trim() || 'Untitled Reflection',
        content,
        mood,
        tags,
        location,
        messages: updatedMessages || messages,
        actionItems: newActionItems !== undefined ? newActionItems : actionItems,
        isPinned,
        createdAt: activeEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await saveJournalEntry(userId, entryToSave);
      onEntrySaved(saved);
      setSaveStatus('saved');
    } catch (err: any) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to persist entry to Firestore. Please retry.');
    }
  };

  // Request AI Reflection on initial entry or multi-turn prompt
  const handleSendToGemini = async (overridePrompt?: string, modeOverride?: ReflectionMode) => {
    const promptToSend = overridePrompt !== undefined ? overridePrompt : followUpPrompt.trim();
    const activeMode = modeOverride || selectedMode;

    if (!promptToSend && !content.trim()) {
      setErrorMessage('Please write your reflection or enter a question to start.');
      return;
    }

    setIsAiLoading(true);
    setErrorMessage(null);

    // Auto-generate title if empty
    let currentTitle = title.trim();
    if (!currentTitle) {
      currentTitle = (content || promptToSend).slice(0, 32).trim() + '...';
      setTitle(currentTitle);
    }

    // Build user message
    const userMsg: EntryMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: promptToSend || `Please reflect on my journal entry with the "${activeMode}" approach.`,
      timestamp: new Date().toISOString(),
      mode: activeMode,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setFollowUpPrompt('');

    try {
      // Build conversation history format for API
      const conversationHistory = messages.map(m => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        text: m.text,
      }));

      const aiResponse = await askGeminiReflection({
        prompt: promptToSend || `Please analyze and reflect on this journal entry: "${content}". Mode: ${activeMode}`,
        context: content.trim(),
        conversationHistory,
        mode: activeMode,
      });

      setModelUsed(aiResponse.modelUsed);

      const geminiMsg: EntryMessage = {
        id: crypto.randomUUID(),
        sender: 'gemini',
        text: aiResponse.reply,
        timestamp: new Date().toISOString(),
        mode: activeMode,
      };

      const updatedMessages = [...newMessages, geminiMsg];
      setMessages(updatedMessages);

      // Save to Firestore with guaranteed verification
      await performSave(updatedMessages, currentTitle);
    } catch (err: any) {
      console.error('AI reflection failed:', err);
      setErrorMessage(err?.message || 'Unable to generate reflection at this moment. You can retry.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-4 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg font-bold text-white">
            {activeEntry ? 'Edit Reflection' : 'New Journal Reflection'}
          </span>
          
          {/* Pin Button */}
          <button
            id="btn-toggle-pin"
            type="button"
            onClick={() => {
              setIsPinned(!isPinned);
              performSave();
            }}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              isPinned 
                ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 font-semibold ring-1 ring-indigo-500/30' 
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isPinned ? 'Unpin Reflection' : 'Pin to top of history'}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-indigo-400 text-indigo-400' : ''}`} />
            <span className="text-[11px]">{isPinned ? 'Pinned' : 'Pin'}</span>
          </button>
        </div>

        {/* Save Status & Action Controls */}
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1 text-xs text-indigo-400 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Save Failed</span>
            </span>
          )}

          {onOpenGuidedExercises && (
            <button
              id="btn-open-guided-exercises"
              type="button"
              onClick={onOpenGuidedExercises}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Open structured exercises: CBT, Stoic, Weekly Retro, Morning Primer"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Guided Frameworks</span>
            </button>
          )}

          <LocationPicker 
            location={location} 
            onChangeLocation={setLocation} 
          />

          <button
            id="btn-toggle-voice"
            type="button"
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-xs ${
              showVoiceRecorder 
                ? 'bg-rose-950/90 border-rose-600 text-rose-300 ring-1 ring-rose-500/40' 
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title="Record a voice audio memo stream-of-consciousness"
          >
            <Mic className={`w-3.5 h-3.5 ${showVoiceRecorder ? 'text-rose-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{showVoiceRecorder ? 'Close Voice' : 'Voice Memo'}</span>
          </button>

          <button
            id="btn-manual-save"
            type="button"
            onClick={() => performSave()}
            disabled={saveStatus === 'saving'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            id="btn-new-entry-reset"
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mx-5 mt-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl flex items-center justify-between text-xs text-rose-200 shadow-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-rose-900/50 rounded text-rose-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Journal Content Area */}
      <div className="p-5 space-y-5">
        {/* Voice Recorder Component if Toggled */}
        {showVoiceRecorder && (
          <VoiceRecorder
            onTranscriptionComplete={({ transcription, suggestedTitle, suggestedMood, suggestedTags }) => {
              if (transcription) {
                setContent((prev) => prev ? `${prev}\n\n${transcription}` : transcription);
              }
              if (suggestedTitle && !title.trim()) {
                setTitle(suggestedTitle);
              }
              if (suggestedMood) {
                setMood(suggestedMood);
              }
              if (suggestedTags && suggestedTags.length > 0) {
                const combined = Array.from(new Set([...tags, ...suggestedTags]));
                setTags(combined);
              }
              setShowVoiceRecorder(false);
            }}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        )}

        {/* Title Input */}
        <div>
          <label htmlFor="input-entry-title" className="block text-xs font-medium text-slate-400 mb-1">
            Reflection Title
          </label>
          <input
            id="input-entry-title"
            type="text"
            placeholder="e.g. Navigating architectural trade-offs, morning gratitude..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 text-base font-semibold text-white bg-slate-950/60 border border-slate-800 rounded-xl focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Mood & Tag Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mood Pill Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-slate-500" />
              <span>Current Mindset / Mood</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  id={`mood-btn-${m.value}`}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={`px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                    mood === m.value 
                      ? `${m.bg} ${m.text} font-semibold ring-2 ring-indigo-500/30` 
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags Manager */}
          <div>
            <label htmlFor="input-tag" className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Tags (Press Enter or comma)</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950/60 border border-slate-800 rounded-xl focus-within:bg-slate-950 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500 transition-all">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-slate-800 text-slate-200 border border-slate-700/60 rounded-md font-medium"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                id="input-tag"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? 'Add tags (e.g. Work, Clarity)' : 'Add tag...'}
                className="flex-1 min-w-[80px] bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none px-1"
              />
            </div>
          </div>
        </div>

        {/* Journal Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="textarea-journal-entry" className="block text-xs font-medium text-slate-400">
              Journal Content / Personal Reflection
            </label>
            <span className="text-[11px] text-slate-500">
              {content.length} characters
            </span>
          </div>
          <textarea
            id="textarea-journal-entry"
            rows={5}
            placeholder="Write your journal entry, stream of consciousness, or challenge here... Your reflection companion will thoughtfully analyze and respond."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3.5 py-3 text-sm text-slate-200 bg-slate-950/60 border border-slate-800 rounded-xl focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all leading-relaxed placeholder:text-slate-500"
          />

          {/* Prompt Starters */}
          {content.length === 0 && (
            <div className="mt-2.5">
              <span className="text-[11px] text-slate-400 block mb-1.5">Or start with a guided reflection prompt:</span>
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_STARTERS.map((starter, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setContent(starter + '\n\n')}
                    className="text-[11px] text-left px-2.5 py-1 bg-slate-800/70 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer border border-slate-700/60"
                  >
                    "{starter}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Reflection Action Bar */}
        <div className="p-4 bg-slate-950/50 border border-slate-800/90 rounded-2xl space-y-3 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Choose Conversation Style:</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded font-medium">
              Companion Ready
            </span>
          </div>

          {/* Style Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {MODES.map((m) => {
              const Icon = m.icon;
              const isSelected = selectedMode === m.id;
              return (
                <button
                  key={m.id}
                  id={`btn-mode-${m.id}`}
                  type="button"
                  onClick={() => setSelectedMode(m.id)}
                  className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/90 border-indigo-500 text-white shadow-md shadow-indigo-950/50 font-medium ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-semibold">{m.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                    {m.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Trigger Reflection Button */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-400">
              Your reflection companion will listen, support, and share thoughtful insights.
            </p>

            <button
              id="btn-trigger-gemini-reflection"
              type="button"
              disabled={isAiLoading || !content.trim()}
              onClick={() => handleSendToGemini('', selectedMode)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAiLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Reflecting on your thoughts...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Reflect with Companion</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Multi-Turn Conversation History Section */}
        {messages.length > 0 && (
          <div className="mt-8 border-t border-slate-800 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-400" />
                <span>Reflection Dialogue ({messages.length})</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                Saved privately to your account
              </span>
            </div>

            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl border text-sm leading-relaxed transition-all ${
                      isUser
                        ? 'bg-slate-800/90 border-slate-700 ml-6 text-slate-200 shadow-xs'
                        : 'bg-indigo-950/40 border-indigo-900/60 mr-6 text-slate-100 shadow-md shadow-indigo-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold">
                        {isUser ? (
                          <span className="text-slate-300">You (Prompt / Thought)</span>
                        ) : (
                          <div className="flex items-center gap-1.5 text-indigo-300">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Reflection Companion</span>
                            {msg.mode && (
                              <span className="px-1.5 py-0.5 bg-indigo-900/60 border border-indigo-700/50 text-[10px] rounded text-indigo-300 uppercase font-mono">
                                {msg.mode}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-200 space-y-2">
                      <div className="prose prose-invert prose-xs max-w-none text-slate-200">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isAiLoading && (
                <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-800/60 mr-6 animate-pulse flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-indigo-200 font-medium">
                    Reflecting on your thoughts...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Follow-up Question Input */}
            <div className="pt-2">
              <label htmlFor="input-followup-prompt" className="block text-xs font-medium text-slate-400 mb-1.5">
                Continue the dialogue:
              </label>
              <div className="flex gap-2">
                <input
                  id="input-followup-prompt"
                  type="text"
                  placeholder="Ask a follow-up question, clarify a thought, or ask for more ideas..."
                  value={followUpPrompt}
                  onChange={(e) => setFollowUpPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && followUpPrompt.trim()) {
                      e.preventDefault();
                      handleSendToGemini(followUpPrompt.trim());
                    }
                  }}
                  disabled={isAiLoading}
                  className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-950/60 border border-slate-800 rounded-xl focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500"
                />
                <button
                  id="btn-send-followup"
                  type="button"
                  disabled={isAiLoading || !followUpPrompt.trim()}
                  onClick={() => handleSendToGemini(followUpPrompt.trim())}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-xl shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Items & Productivity Planner Section */}
        <div className="mt-8 border-t border-slate-800 pt-6">
          <ActionPlanner
            title={title || 'Reflective Journal'}
            content={content}
            dialogue={messages.map((m) => `${m.sender === 'user' ? 'User' : 'Reflection'}: ${m.text}`)}
            initialActions={actionItems}
            onSaveActions={(newActions) => {
              setActionItems(newActions);
              performSave(undefined, undefined, newActions);
            }}
          />
        </div>
      </div>
    </div>
  );
};
