export type UserRole = 'user' | 'moderator' | 'admin';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: UserRole;
}

export interface LocationPin {
  lat: number;
  lng: number;
  address: string;
  placeName?: string;
  city?: string;
}

export type ReflectionMode = 'socratic' | 'summary' | 'brainstorm' | 'action_items' | 'empathy';

export interface EntryMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string; // ISO 8601 string
  mode?: ReflectionMode;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string; // Initial reflection or current draft
  mood?: 'peaceful' | 'energized' | 'thoughtful' | 'anxious' | 'neutral' | 'grateful';
  tags: string[];
  location?: LocationPin;
  messages: EntryMessage[];
  summary?: string;
  actionItems?: string[];
  isPinned?: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface GeminiReflectRequest {
  prompt: string;
  context?: string;
  conversationHistory?: Array<{
    role: 'user' | 'model';
    text: string;
  }>;
  mode?: ReflectionMode;
}

export interface GeminiReflectResponse {
  reply: string;
  modelUsed: string;
}

export type AppTab = 'journal' | 'analytics' | 'atlas' | 'admin';

export interface TrendSynthesisRequest {
  timeframe: '7days' | '30days' | 'all';
  entries: Array<{
    id: string;
    title: string;
    date: string;
    mood?: string;
    tags: string[];
    snippet: string;
    dialogueCount: number;
  }>;
}

export interface TrendSynthesisResponse {
  synthesis: string;
  keyThemes: string[];
  growthHighlights: string[];
  recommendations: string[];
  dominantMood: string;
  modelUsed: string;
}

export interface ActionItem {
  id: string;
  title: string;
  category?: 'work' | 'personal' | 'mindfulness' | 'habit';
  estimatedMinutes?: number;
  completed?: boolean;
}

export interface ExtractActionsRequest {
  title: string;
  content: string;
  dialogue?: string[];
}

export interface ExtractActionsResponse {
  actionItems: ActionItem[];
  reflectionSummary: string;
  modelUsed: string;
}

export interface TranscribeAudioRequest {
  audioBase64: string;
  mimeType: string;
}

export interface TranscribeAudioResponse {
  transcription: string;
  suggestedTitle: string;
  suggestedMood: 'peaceful' | 'energized' | 'thoughtful' | 'anxious' | 'neutral' | 'grateful';
  suggestedTags: string[];
  modelUsed: string;
}

export interface SemanticSearchMatch {
  id: string;
  relevanceScore: number; // 0 - 100
  matchedConcept: string;
  keyExcerpt?: string;
}

export interface SemanticSearchRequest {
  query: string;
  entries: Array<{
    id: string;
    title: string;
    content: string;
    tags: string[];
    mood?: string;
    createdAt: string;
  }>;
}

export interface SemanticSearchResponse {
  matches: SemanticSearchMatch[];
  queryExplanation: string;
  modelUsed: string;
}

export type ExerciseFrameworkType = 'cbt' | 'stoic' | 'retro' | 'morning';

export interface ExerciseAssistantRequest {
  framework: ExerciseFrameworkType;
  stepData: Record<string, any>;
  prompt?: string;
}

export interface ExerciseAssistantResponse {
  suggestion: string;
  keyObservation?: string;
  cognitiveDistortionsDetected?: string[];
  modelUsed: string;
}

export interface NotificationConfig {
  webhookUrl: string;
  channelName?: string;
  enabled: boolean;
  triggers: {
    onActionItemsExtracted: boolean;
    onHighAnxietyAlert: boolean;
    onWeeklyMilestone: boolean;
  };
}

export interface NotificationDispatchPayload {
  webhookUrl?: string;
  eventType: 'action_items' | 'anxiety_alert' | 'streak_milestone' | 'test_ping';
  title: string;
  summary: string;
  details?: string[];
  mood?: string;
  locationName?: string;
  timestamp: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  operatorEmail: string;
  action: string;
  category: 'security' | 'telemetry' | 'notification' | 'rbac';
  status: 'success' | 'warning' | 'error';
  details?: string;
}

export interface SystemHealthMetrics {
  geminiLadderStatus: Array<{
    model: string;
    tier: string;
    latencyMs: number;
    status: 'operational' | 'degraded' | 'standby';
  }>;
  averageLatencyMs: number;
  activeUsersCount: number;
  totalJournalEntriesCount: number;
  securityAuditsTodayCount: number;
  lastRuleDeployment: string;
}

