import React, { useState } from 'react';
import { ExerciseFrameworkType } from '../types';
import { getExerciseAdvice } from '../lib/gemini-client';
import { 
  X, 
  Brain, 
  Shield, 
  Calendar, 
  Sun, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  RefreshCw, 
  AlertCircle,
  HelpCircle,
  Compass
} from 'lucide-react';

interface GuidedExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertIntoJournal: (data: {
    title: string;
    content: string;
    mood: 'peaceful' | 'energized' | 'thoughtful' | 'anxious' | 'neutral' | 'grateful';
    tags: string[];
  }) => void;
}

interface DistortionItem {
  name: string;
  desc: string;
}

const CBT_DISTORTIONS: DistortionItem[] = [
  { name: 'All-or-Nothing', desc: 'Viewing situations in black-and-white categories (perfection vs failure).' },
  { name: 'Catastrophizing', desc: 'Assuming the absolute worst-case scenario will inevitably happen.' },
  { name: 'Mind Reading', desc: 'Arbitrarily concluding someone is reacting negatively without proof.' },
  { name: 'Emotional Reasoning', desc: 'Believing that because you feel anxious or inadequate, it must be true.' },
  { name: 'Overgeneralization', desc: 'Viewing a single negative event as a never-ending pattern of defeat.' },
  { name: 'Should Statements', desc: 'Demanding unrealistic standards upon yourself or others with "musts".' },
  { name: 'Personalization', desc: 'Holding yourself solely responsible for events outside your control.' },
];

export const GuidedExerciseModal: React.FC<GuidedExerciseModalProps> = ({
  isOpen,
  onClose,
  onInsertIntoJournal,
}) => {
  const [selectedFramework, setSelectedFramework] = useState<ExerciseFrameworkType>('cbt');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isConsultingAI, setIsConsultingAI] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiDistortions, setAiDistortions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // CBT State
  const [cbtSituation, setCbtSituation] = useState('');
  const [cbtAutoThought, setCbtAutoThought] = useState('');
  const [cbtDistortions, setCbtDistortions] = useState<string[]>([]);
  const [cbtEvidence, setCbtEvidence] = useState('');
  const [cbtRationalReframe, setCbtRationalReframe] = useState('');

  // Stoic State
  const [stoicChallenge, setStoicChallenge] = useState('');
  const [stoicOutsideControl, setStoicOutsideControl] = useState('');
  const [stoicInsideControl, setStoicInsideControl] = useState('');
  const [stoicPremeditatio, setStoicPremeditatio] = useState('');
  const [stoicDeclaration, setStoicDeclaration] = useState('');

  // Retro State
  const [retroWins, setRetroWins] = useState('');
  const [retroFrictions, setRetroFrictions] = useState('');
  const [retroLesson, setRetroLesson] = useState('');
  const [retroCommitments, setRetroCommitments] = useState('');

  // Morning Primer State
  const [morningGratitude, setMorningGratitude] = useState('');
  const [morningPriority, setMorningPriority] = useState('');
  const [morningAffirmation, setMorningAffirmation] = useState('');

  if (!isOpen) return null;

  const frameworksMeta = [
    {
      id: 'cbt' as ExerciseFrameworkType,
      title: 'CBT Cognitive Restructuring',
      subtitle: "Beck's Cognitive Therapy",
      desc: 'Identify automatic distortions, test assumptions against evidence, and craft a rational reframe.',
      icon: Brain,
      color: 'from-purple-500 to-indigo-600',
      totalSteps: 5,
      mood: 'thoughtful' as const,
      tags: ['CBT', 'Reframe', 'CognitiveClarity'],
    },
    {
      id: 'stoic' as ExerciseFrameworkType,
      title: 'Stoic Dichotomy of Control',
      subtitle: 'Epictetus & Marcus Aurelius',
      desc: 'Segregate external chaos from internal agency and establish calm resilience.',
      icon: Shield,
      color: 'from-amber-500 to-emerald-600',
      totalSteps: 5,
      mood: 'peaceful' as const,
      tags: ['Stoicism', 'Agency', 'InnerEquanimity'],
    },
    {
      id: 'retro' as ExerciseFrameworkType,
      title: 'Weekly Mindful Retrospective',
      subtitle: 'Continuous Growth Sprint',
      desc: 'Celebrate wins, diagnose energetic friction points, and commit to next week’s non-negotiables.',
      icon: Calendar,
      color: 'from-cyan-500 to-blue-600',
      totalSteps: 4,
      mood: 'energized' as const,
      tags: ['WeeklyRetro', 'Momentum', 'SelfAudit'],
    },
    {
      id: 'morning' as ExerciseFrameworkType,
      title: '5-Minute Morning Primer',
      subtitle: 'Daily Grounding & Intention',
      desc: 'Anchor in gratitude, isolate your highest-priority objective, and set your emotional tone.',
      icon: Sun,
      color: 'from-amber-400 to-orange-500',
      totalSteps: 3,
      mood: 'grateful' as const,
      tags: ['MorningPrimer', 'DailyFocus', 'Gratitude'],
    },
  ];

  const currentMeta = frameworksMeta.find((f) => f.id === selectedFramework)!;

  const handleSelectFramework = (type: ExerciseFrameworkType) => {
    setSelectedFramework(type);
    setCurrentStepIndex(0);
    setAiSuggestion(null);
    setAiDistortions([]);
    setError(null);
  };

  const toggleDistortion = (name: string) => {
    setCbtDistortions((prev) => 
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    );
  };

  // AI Coaching Assistant
  const handleConsultAI = async () => {
    setIsConsultingAI(true);
    setError(null);

    let stepData: Record<string, any> = {};
    if (selectedFramework === 'cbt') {
      stepData = {
        situation: cbtSituation,
        automaticThought: cbtAutoThought,
        selectedDistortions: cbtDistortions,
        evidence: cbtEvidence,
      };
    } else if (selectedFramework === 'stoic') {
      stepData = {
        challenge: stoicChallenge,
        outsideControl: stoicOutsideControl,
        insideControl: stoicInsideControl,
      };
    } else if (selectedFramework === 'retro') {
      stepData = {
        wins: retroWins,
        frictions: retroFrictions,
      };
    } else {
      stepData = {
        gratitude: morningGratitude,
        priority: morningPriority,
      };
    }

    try {
      const res = await getExerciseAdvice({
        framework: selectedFramework,
        stepData,
      });

      setAiSuggestion(res.suggestion);
      if (res.cognitiveDistortionsDetected && res.cognitiveDistortionsDetected.length > 0) {
        setAiDistortions(res.cognitiveDistortionsDetected);
      }

      // Auto-suggest rational reframe if in CBT
      if (selectedFramework === 'cbt' && !cbtRationalReframe.trim()) {
        setCbtRationalReframe(res.suggestion);
      } else if (selectedFramework === 'stoic' && !stoicDeclaration.trim()) {
        setStoicDeclaration(res.suggestion);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch AI guidance.');
    } finally {
      setIsConsultingAI(false);
    }
  };

  // Compile full structured markdown and insert
  const handleFinishAndInsert = () => {
    let title = '';
    let content = '';

    if (selectedFramework === 'cbt') {
      title = `CBT Reframe: ${cbtSituation.slice(0, 35) || 'Reflective Thought Audit'}`;
      content = `### 🧠 Cognitive Behavioral Restructuring\n\n` +
        `**Activating Situation:**\n> ${cbtSituation || 'None recorded'}\n\n` +
        `**Automatic Thought (ANT):**\n> "${cbtAutoThought || 'None recorded'}"\n\n` +
        `**Identified Distortions:**\n${cbtDistortions.length > 0 ? cbtDistortions.map(d => `- ${d}`).join('\n') : '- No manual distortions picked'}\n\n` +
        `**Objective Evidence Audit:**\n${cbtEvidence || 'No evidence noted.'}\n\n` +
        `---\n\n` +
        `### ✨ Adaptive Rational Reframe\n${cbtRationalReframe || aiSuggestion || 'I choose a balanced, compassionate, and grounded truth.'}\n`;
    } else if (selectedFramework === 'stoic') {
      title = `Stoic Agency: ${stoicChallenge.slice(0, 35) || 'Dichotomy of Control'}`;
      content = `### 🛡️ Stoic Dichotomy of Control\n\n` +
        `**The Challenge:**\n${stoicChallenge || 'General turbulence'}\n\n` +
        `**Outside Direct Control (Release & Accept):**\n${stoicOutsideControl || 'External outcomes, other individuals.'}\n\n` +
        `**Inside Immediate Agency (Direct Effort Here):**\n${stoicInsideControl || 'My judgments, values, and deliberate responses.'}\n\n` +
        `**Premeditatio Malorum (Preparedness):**\n${stoicPremeditatio || 'Ready to face difficulties with composure.'}\n\n` +
        `---\n\n` +
        `### 🏛️ Stoic Declaration of Peace\n> "${stoicDeclaration || 'I relinquish sovereignty over that which I cannot command, and dedicate my life to virtuous action.'}"\n`;
    } else if (selectedFramework === 'retro') {
      title = `Weekly Retrospective: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      content = `### 📊 Weekly Mindful Retrospective\n\n` +
        `#### 🌟 Celebrated Wins & Energy Catalysts\n${retroWins || 'Recognized steady progress.'}\n\n` +
        `#### ⚠️ Frictions & Energy Leaks\n${retroFrictions || 'Identified moments of hesitation.'}\n\n` +
        `#### 💡 Core Lesson Learned\n${retroLesson || 'Patience and focused priority.'}\n\n` +
        `---\n\n` +
        `#### 🎯 Next Week's Non-Negotiables\n${retroCommitments || '1. Deep focus blocks\n2. Daily reflection\n3. Restorative downtime'}\n`;
    } else {
      title = `Morning Grounding: ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
      content = `### ☀️ 5-Minute Morning Primer\n\n` +
        `**Gratitude Anchors:**\n${morningGratitude || 'Thankful for breath, clarity, and opportunity.'}\n\n` +
        `**The Essential Priority:**\n> **${morningPriority || 'Make meaningful forward progress with intention.'}**\n\n` +
        `**Intention & Affirmation:**\n${morningAffirmation || 'I show up with presence, curiosity, and calm strength.'}\n`;
    }

    onInsertIntoJournal({
      title,
      content,
      mood: currentMeta.mood,
      tags: currentMeta.tags,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Guided Reflection Frameworks
              </h3>
              <p className="text-xs text-slate-400">
                Evidence-based cognitive and philosophical exercises to elevate your journal.
              </p>
            </div>
          </div>

          <button
            id="btn-close-exercise-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Framework Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-slate-950/40 border-b border-slate-800">
          {frameworksMeta.map((fw) => {
            const Icon = fw.icon;
            const isSelected = fw.id === selectedFramework;
            return (
              <button
                key={fw.id}
                type="button"
                onClick={() => handleSelectFramework(fw.id)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/80 border-indigo-500/80 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-bold truncate">{fw.title.split(' ')[0]}</span>
                </div>
                <span className="text-[9px] text-slate-400 line-clamp-1">{fw.subtitle}</span>
              </button>
            );
          })}
        </div>

        {/* Exercise Body & Step Wizard */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Active Framework Header & Step Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {currentMeta.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-indigo-300 rounded-full border border-slate-700">
                  Step {currentStepIndex + 1} of {currentMeta.totalSteps}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{currentMeta.desc}</p>
            </div>

            {/* AI Assist button */}
            <button
              id="btn-exercise-ai-assist"
              type="button"
              onClick={handleConsultAI}
              disabled={isConsultingAI}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {isConsultingAI ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Coaching Advice</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Suggestion Box */}
          {aiSuggestion && (
            <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/60 rounded-xl space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Reflection Perspective:</span>
                </span>
                {aiDistortions.length > 0 && (
                  <div className="flex items-center gap-1">
                    {aiDistortions.map((d, i) => (
                      <span key={i} className="px-1.5 py-0.5 text-[9px] bg-rose-950/80 border border-rose-800 text-rose-300 rounded">
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-indigo-100 leading-relaxed">{aiSuggestion}</p>
            </div>
          )}

          {/* FRAMEWORK CONTENT BY STEP */}
          {selectedFramework === 'cbt' && (
            <div className="space-y-4">
              {currentStepIndex === 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    1. Activating Situation or Trigger
                  </label>
                  <p className="text-xs text-slate-400">
                    What specific event, conversation, or incident occurred that triggered uncomfortable emotions? Stick to factual descriptions.
                  </p>
                  <textarea
                    rows={4}
                    value={cbtSituation}
                    onChange={(e) => setCbtSituation(e.target.value)}
                    placeholder="E.g., I gave a presentation at work, stumbled over a slide, and saw my manager look down at their phone..."
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>
              )}

              {currentStepIndex === 1 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    2. Automatic Negative Thought (ANT)
                  </label>
                  <p className="text-xs text-slate-400">
                    What thought flashed immediately across your mind? What story did your brain tell you?
                  </p>
                  <textarea
                    rows={4}
                    value={cbtAutoThought}
                    onChange={(e) => setCbtAutoThought(e.target.value)}
                    placeholder='E.g., "I ruined the whole pitch. My manager thinks I am incompetent and I am going to be sidelined."'
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>
              )}

              {currentStepIndex === 2 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-200">
                      3. Identify Cognitive Distortions
                    </label>
                    <p className="text-xs text-slate-400">
                      Select any mental distortions present in your automatic thought:
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CBT_DISTORTIONS.map((d) => {
                      const isChecked = cbtDistortions.includes(d.name);
                      return (
                        <button
                          key={d.name}
                          type="button"
                          onClick={() => toggleDistortion(d.name)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                            isChecked
                              ? 'bg-purple-950/80 border-purple-500/80 text-white'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-purple-600 text-white' : 'border border-slate-700'
                          }`}>
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <span className="text-xs font-semibold block">{d.name}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{d.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStepIndex === 3 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    4. Evidence Audit
                  </label>
                  <p className="text-xs text-slate-400">
                    What objective facts support this thought? What contradictory facts or alternative explanations exist?
                  </p>
                  <textarea
                    rows={4}
                    value={cbtEvidence}
                    onChange={(e) => setCbtEvidence(e.target.value)}
                    placeholder="E.g., Fact against: The team asked 4 engaged questions afterwards and the data charts were solid. Fact against: My manager checks messages during every sync regardless..."
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>
              )}

              {currentStepIndex === 4 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    5. Adaptive Rational Reframe
                  </label>
                  <p className="text-xs text-slate-400">
                    Construct a balanced, compassionate, and realistic perspective based on objective truth.
                  </p>
                  <textarea
                    rows={4}
                    value={cbtRationalReframe}
                    onChange={(e) => setCbtRationalReframe(e.target.value)}
                    placeholder='E.g., "Stumbling for 10 seconds is normal human communication. The overall material was valuable, and one momentary glitch does not define my career credibility."'
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>
              )}
            </div>
          )}

          {/* STOIC DICHOTOMY OF CONTROL */}
          {selectedFramework === 'stoic' && (
            <div className="space-y-4">
              {currentStepIndex === 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    1. The Current Challenge or Turbulence
                  </label>
                  <p className="text-xs text-slate-400">
                    What external friction, uncertainty, or obstacle is creating turmoil in your thoughts?
                  </p>
                  <textarea
                    rows={4}
                    value={stoicChallenge}
                    onChange={(e) => setStoicChallenge(e.target.value)}
                    placeholder="E.g., A client might cancel their contract due to budget constraints, which is creating a lot of stress..."
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>
              )}

              {currentStepIndex === 1 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    2. Outside My Direct Control (The Externals)
                  </label>
                  <p className="text-xs text-slate-400">
                    What factors belong entirely to the external world, other people's decisions, or the future?
                  </p>
                  <textarea
                    rows={4}
                    value={stoicOutsideControl}
                    onChange={(e) => setStoicOutsideControl(e.target.value)}
                    placeholder="E.g., The client company's board decisions, macroeconomic shifts, their internal politics, other people's opinions..."
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>
              )}

              {currentStepIndex === 2 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    3. Within My Absolute Agency (The Internals)
                  </label>
                  <p className="text-xs text-slate-400">
                    What choices, virtues, preparations, and responses remain strictly under your command?
                  </p>
                  <textarea
                    rows={4}
                    value={stoicInsideControl}
                    onChange={(e) => setStoicInsideControl(e.target.value)}
                    placeholder="E.g., How thoroughly I prepare our value proposal, maintaining professional calm, reaching out to alternative pipelines, my work ethic..."
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>
              )}

              {currentStepIndex === 3 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    4. Premeditatio Malorum (Worst-Case Calm)
                  </label>
                  <p className="text-xs text-slate-400">
                    If the absolute worst external outcome occurs, how will you respond with dignity, virtue, and practical action?
                  </p>
                  <textarea
                    rows={4}
                    value={stoicPremeditatio}
                    onChange={(e) => setStoicPremeditatio(e.target.value)}
                    placeholder="E.g., If they cancel, we immediately activate our contingency pipeline. I will thank them gracefully and reallocate resources without panic."
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>
              )}

              {currentStepIndex === 4 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    5. Stoic Declaration of Peace
                  </label>
                  <p className="text-xs text-slate-400">
                    A grounding declaration to center your mind and release external anxieties.
                  </p>
                  <textarea
                    rows={4}
                    value={stoicDeclaration}
                    onChange={(e) => setStoicDeclaration(e.target.value)}
                    placeholder='E.g., "I release all anxiety over outcomes I cannot dictate. I focus entirely on my effort, integrity, and present courage."'
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>
              )}
            </div>
          )}

          {/* WEEKLY MINDFUL RETRO */}
          {selectedFramework === 'retro' && (
            <div className="space-y-4">
              {currentStepIndex === 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    1. Celebrated Wins &amp; Energy Sources
                  </label>
                  <p className="text-xs text-slate-400">
                    What went well this week? What moments gave you genuine pride, momentum, or fulfillment?
                  </p>
                  <textarea
                    rows={4}
                    value={retroWins}
                    onChange={(e) => setRetroWins(e.target.value)}
                    placeholder="E.g., Completed the core module refactor ahead of schedule, had a deep conversation with my family, stayed consistent with exercise..."
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>
              )}

              {currentStepIndex === 1 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    2. Frictions, Hesitations &amp; Energy Leaks
                  </label>
                  <p className="text-xs text-slate-400">
                    Where did friction or procrastination occur? What drained your focus or stamina?
                  </p>
                  <textarea
                    rows={4}
                    value={retroFrictions}
                    onChange={(e) => setRetroFrictions(e.target.value)}
                    placeholder="E.g., Lost 2 hours on Thursday doom-scrolling, hesitated to speak up during the strategy meeting..."
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>
              )}

              {currentStepIndex === 2 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    3. Core Lesson &amp; Behavioral Insight
                  </label>
                  <p className="text-xs text-slate-400">
                    What is the single most valuable lesson this past week revealed about your habits or psychology?
                  </p>
                  <textarea
                    rows={4}
                    value={retroLesson}
                    onChange={(e) => setRetroLesson(e.target.value)}
                    placeholder="E.g., Whenever I don't define the first 10 minutes of my morning, my focus fractures for the rest of the day."
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>
              )}

              {currentStepIndex === 3 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    4. Next Week's 3 Non-Negotiable Commitments
                  </label>
                  <p className="text-xs text-slate-400">
                    What are the 1 to 3 non-negotiable commitments you will protect next week?
                  </p>
                  <textarea
                    rows={4}
                    value={retroCommitments}
                    onChange={(e) => setRetroCommitments(e.target.value)}
                    placeholder="1. Protect 9-11 AM deep focus blocks without phone\n2. 30-minute outdoor walk every afternoon\n3. Ship the MVP demo by Thursday afternoon"
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>
              )}
            </div>
          )}

          {/* 5-MINUTE MORNING PRIMER */}
          {selectedFramework === 'morning' && (
            <div className="space-y-4">
              {currentStepIndex === 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    1. Three Specific Gratitude Anchors
                  </label>
                  <p className="text-xs text-slate-400">
                    Name 3 micro-specific things you feel genuine appreciation for this morning:
                  </p>
                  <textarea
                    rows={4}
                    value={morningGratitude}
                    onChange={(e) => setMorningGratitude(e.target.value)}
                    placeholder="1. The smell of fresh coffee brewing\n2. A restful 8 hours of sleep\n3. The freedom to work on creative problems today"
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>
              )}

              {currentStepIndex === 1 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    2. The Single Essential Priority
                  </label>
                  <p className="text-xs text-slate-400">
                    If only one high-impact task gets completed with excellence today, what must it be?
                  </p>
                  <textarea
                    rows={4}
                    value={morningPriority}
                    onChange={(e) => setMorningPriority(e.target.value)}
                    placeholder="E.g., Complete the design documentation for the client review."
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>
              )}

              {currentStepIndex === 2 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    3. Emotional Intention &amp; Presence
                  </label>
                  <p className="text-xs text-slate-400">
                    How do you choose to show up for yourself and others today?
                  </p>
                  <textarea
                    rows={4}
                    value={morningAffirmation}
                    onChange={(e) => setMorningAffirmation(e.target.value)}
                    placeholder='E.g., "I choose patience over urgency, curiosity over defensive reactions, and deep presence with each task."'
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div>
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((prev) => prev - 1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-500">Select steps or consult AI</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStepIndex < currentMeta.totalSteps - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((prev) => prev + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                id="btn-insert-exercise-journal"
                type="button"
                onClick={handleFinishAndInsert}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Import into Journal Editor</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
