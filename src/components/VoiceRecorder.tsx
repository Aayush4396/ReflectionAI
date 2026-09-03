import React, { useState, useRef, useEffect } from 'react';
import { transcribeVoiceMemo } from '../lib/gemini-client';
import { Mic, Square, Sparkles, RefreshCw, AlertCircle, Volume2, Check } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscriptionComplete: (data: {
    transcription: string;
    suggestedTitle?: string;
    suggestedMood?: 'peaceful' | 'energized' | 'thoughtful' | 'anxious' | 'neutral' | 'grateful';
    suggestedTags?: string[];
  }) => void;
  onCancel?: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptionComplete,
  onCancel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone recording is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size === 0) {
          setError('No audio captured. Please try recording again.');
          return;
        }

        const previewUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(previewUrl);

        // Convert blob to base64
        await processAndTranscribe(audioBlob, mimeType);
      };

      recorder.start(250); // collect in chunks
      setIsRecording(true);
      setRecordSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setError(err?.message || 'Could not access microphone. Please check browser permissions.');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const processAndTranscribe = async (audioBlob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        if (!base64data) {
          throw new Error('Failed to encode audio for transcription.');
        }

        const result = await transcribeVoiceMemo({
          audioBase64: base64data,
          mimeType,
        });

        onTranscriptionComplete({
          transcription: result.transcription,
          suggestedTitle: result.suggestedTitle,
          suggestedMood: result.suggestedMood,
          suggestedTags: result.suggestedTags,
        });
        setIsTranscribing(false);
      };
    } catch (err: any) {
      console.error('Audio processing failed:', err);
      setError(err?.message || 'Failed to transcribe audio. Please retry.');
      setIsTranscribing(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 bg-slate-950/90 border border-indigo-900/60 rounded-2xl shadow-lg space-y-3 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-950/80 text-rose-400 border border-rose-800/80 rounded-xl">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-tight">Voice Stream-of-Consciousness Memo</h4>
            <p className="text-[10px] text-slate-400">Speak naturally. Audio is securely transcribed with title &amp; mood detection.</p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isTranscribing}
            className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-900 rounded-lg cursor-pointer transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recording status & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          {isRecording ? (
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-xs font-mono font-bold text-rose-300">
                Recording: {formatTime(recordSeconds)}
              </span>
            </div>
          ) : isTranscribing ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
              <span className="text-xs font-medium text-indigo-300">
                Transcribing voice note &amp; generating reflection framework...
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Volume2 className="w-4 h-4 text-slate-500" />
              <span>Ready to record voice thoughts</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div>
          {isRecording ? (
            <button
              id="btn-stop-recording"
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Finish &amp; Transcribe</span>
            </button>
          ) : (
            <button
              id="btn-start-recording"
              type="button"
              disabled={isTranscribing}
              onClick={startRecording}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Start Voice Memo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
