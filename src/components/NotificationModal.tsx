import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  ExternalLink,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { NotificationConfig, NotificationDispatchPayload } from '../types';
import { saveNotificationConfig, getNotificationConfig } from '../lib/firestore';

interface NotificationModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [onActionItems, setOnActionItems] = useState(true);
  const [onHighAnxiety, setOnHighAnxiety] = useState(true);
  const [onMilestones, setOnMilestones] = useState(true);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    platform?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      getNotificationConfig(userId).then(cfg => {
        if (cfg) {
          if (cfg.webhookUrl) setWebhookUrl(cfg.webhookUrl);
          if (cfg.triggers) {
            setOnActionItems(cfg.triggers.onActionItemsExtracted ?? true);
            setOnHighAnxiety(cfg.triggers.onHighAnxietyAlert ?? true);
            setOnMilestones(cfg.triggers.onWeeklyMilestone ?? true);
          }
        }
      });
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleTestDispatch = async () => {
    setIsTesting(true);
    setTestResult(null);

    const payload: NotificationDispatchPayload = {
      webhookUrl: webhookUrl.trim() || undefined,
      eventType: 'test_ping',
      title: 'ReflectAI Companion Connected',
      summary: 'Your personal reflection journal reminders are active and connected safely.',
      details: [
        'Safe, encrypted webhook connection active',
        'Ready to send gentle check-ins and action tasks'
      ],
      mood: 'peaceful',
      locationName: 'Personal Sanctuary',
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.mode === 'simulated' 
            ? 'Test reminder processed in verified Demo Sandbox mode! (Provide a real Slack or Discord webhook for live delivery).' 
            : `Successfully delivered test reminder to ${data.platform || 'your channel'}!`,
          platform: data.platform || (data.mode === 'simulated' ? 'Demo Sandbox' : 'Webhook'),
        });

        // Save preferences
        await saveNotificationConfig(userId, {
          webhookUrl: webhookUrl.trim(),
          enabled: true,
          triggers: {
            onActionItemsExtracted: onActionItems,
            onHighAnxietyAlert: onHighAnxiety,
            onWeeklyMilestone: onMilestones,
          }
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed. Please check the webhook link and retry.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Network error occurred while connecting. Please retry.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700 text-indigo-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Connect Slack or Discord</span>
                <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-emerald-950 text-emerald-300 rounded border border-emerald-800">
                  Verified Safe Connection
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Receive gentle reminders and action items directly in your messaging app.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Webhook Input */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Paste Slack or Discord Webhook Link
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/... or https://hooks.slack.com/..."
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Leave blank to try in Demo Sandbox mode first without needing a webhook URL.
            </span>
          </div>

          {/* Trigger Toggles */}
          <div className="space-y-2 pt-2">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              What Would You Like to Receive?
            </span>

            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:bg-slate-800/40 transition-colors">
              <input
                type="checkbox"
                checked={onActionItems}
                onChange={(e) => setOnActionItems(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-200 block">Action steps from my reflections</span>
                <span className="text-[11px] text-slate-400">
                  Send practical next steps and reminders to your channel whenever you explore action plans.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:bg-slate-800/40 transition-colors">
              <input
                type="checkbox"
                checked={onHighAnxiety}
                onChange={(e) => setOnHighAnxiety(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-200 block">Gentle check-ins when feeling anxious or overwhelmed</span>
                <span className="text-[11px] text-slate-400">
                  Receive a warm, supportive check-in ping and grounding tips when you log high emotional strain.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:bg-slate-800/40 transition-colors">
              <input
                type="checkbox"
                checked={onMilestones}
                onChange={(e) => setOnMilestones(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-200 block">Celebrate weekly streaks and milestones</span>
                <span className="text-[11px] text-slate-400">
                  Get cheered on when you hit 3-day and 7-day reflection consistency milestones.
                </span>
              </div>
            </label>
          </div>

          {/* Test Dispatch Feedback */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.success 
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800 text-rose-200'
            }`}>
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold block">
                  {testResult.success ? 'Connection Ready!' : 'Connection Check Failed'}
                </span>
                <span className="text-[11px] opacity-90">{testResult.message}</span>
              </div>
            </div>
          )}

          {/* Privacy Guarantee Note */}
          <div className="flex items-center gap-2 p-2.5 bg-indigo-950/30 border border-indigo-900/50 rounded-xl text-[11px] text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Private &amp; Secure:</strong> Your personal diary entries are never sent to external apps—only high-level action items and gentle check-ins that you authorize.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleTestDispatch}
            disabled={isTesting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending Test Reminder...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Test Reminder</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
