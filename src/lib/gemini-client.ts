import { 
  GeminiReflectRequest, 
  GeminiReflectResponse, 
  TrendSynthesisRequest, 
  TrendSynthesisResponse,
  ExtractActionsRequest,
  ExtractActionsResponse,
  TranscribeAudioRequest,
  TranscribeAudioResponse,
  SemanticSearchRequest,
  SemanticSearchResponse,
  ExerciseAssistantRequest,
  ExerciseAssistantResponse
} from '../types';

export async function askGeminiReflection(request: GeminiReflectRequest): Promise<GeminiReflectResponse> {
  try {
    const response = await fetch('/api/gemini/reflect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return data as GeminiReflectResponse;
  } catch (error: any) {
    console.error('Gemini reflection request failed:', error);
    throw new Error(error.message || 'Unable to connect to reflection service. Please try again.');
  }
}

export async function synthesizeJournalTrends(request: TrendSynthesisRequest): Promise<TrendSynthesisResponse> {
  try {
    const response = await fetch('/api/gemini/synthesize-trends', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return data as TrendSynthesisResponse;
  } catch (error: any) {
    console.error('Trend synthesis request failed:', error);
    throw new Error(error.message || 'Unable to generate trend synthesis report. Please try again.');
  }
}

export async function extractActionSteps(request: ExtractActionsRequest): Promise<ExtractActionsResponse> {
  try {
    const response = await fetch('/api/gemini/extract-actions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return data as ExtractActionsResponse;
  } catch (error: any) {
    console.error('Action extraction request failed:', error);
    throw new Error(error.message || 'Unable to extract action items. Please try again.');
  }
}

export async function transcribeVoiceMemo(request: TranscribeAudioRequest): Promise<TranscribeAudioResponse> {
  try {
    const response = await fetch('/api/gemini/transcribe-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return data as TranscribeAudioResponse;
  } catch (error: any) {
    console.error('Audio transcription failed:', error);
    throw new Error(error.message || 'Unable to transcribe voice recording. Please try again.');
  }
}

export async function searchSemantically(request: SemanticSearchRequest): Promise<SemanticSearchResponse> {
  try {
    const response = await fetch('/api/gemini/semantic-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return data as SemanticSearchResponse;
  } catch (error: any) {
    console.error('Semantic search failed:', error);
    throw new Error(error.message || 'Semantic search encountered an issue. Please try again.');
  }
}

export async function getExerciseAdvice(request: ExerciseAssistantRequest): Promise<ExerciseAssistantResponse> {
  try {
    const response = await fetch('/api/gemini/exercise-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return data as ExerciseAssistantResponse;
  } catch (error: any) {
    console.error('Exercise assistant failed:', error);
    throw new Error(error.message || 'Unable to get exercise assistant advice. Please try again.');
  }
}

