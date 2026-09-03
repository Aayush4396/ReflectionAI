---
name: external-notifications
description: Automated, user-configured external notifications to Slack, Discord, or webhooks with SSRF defense, privacy minimization, and rate-limiting.
---

# External Notification & Webhook Security Skill

This skill governs outbound notifications dispatched from the application to user-configured third-party webhooks (Slack, Discord, custom HTTPS endpoints).

## 1. SSRF Defense & URL Sanitization
Outbound webhook requests must strictly reject loopback, internal, private network, and cloud metadata addresses:

```typescript
export function validateWebhookUrl(rawUrl: string): { valid: boolean; error?: string; url?: URL } {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Webhook URL must use secure HTTPS protocol.' };
    }
    const hostname = parsed.hostname.toLowerCase();
    
    // Block loopback and link-local
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return { valid: false, error: 'Target webhook address violates SSRF security boundaries.' };
    }
    
    // Block Cloud Metadata
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
      return { valid: false, error: 'Target webhook address violates SSRF security boundaries.' };
    }

    // Block private RFC 1918 subnets
    if (
      hostname.startsWith('10.') || 
      hostname.startsWith('192.168.') || 
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return { valid: false, error: 'Target webhook address violates SSRF security boundaries.' };
    }

    return { valid: true, url: parsed };
  } catch {
    return { valid: false, error: 'Invalid webhook URL syntax.' };
  }
}
```

## 2. Privacy & Content Minimization
- **NEVER** transmit raw personal journal text or user confessions to external webhooks.
- Only dispatch sanitized event metadata:
  - Event Type (`action_items_extracted`, `weekly_streak_milestone`, `mindfulness_alert`)
  - Timestamp (ISO string)
  - Action item count or summary title (e.g., "3 action items extracted")
  - Sanitized mood and location name

## 3. Platform Payload Schemas
- **Discord**: Uses rich embed blocks with accent colors, inline fields, and timestamp badges.
- **Slack**: Uses Block Kit sections with header blocks, context blocks, and divider bars.
- **Generic**: Standard JSON schema conforming to `NotificationDispatchPayload`.

## 4. Rate-Limiting & Timeouts
- Strict 5-second timeout on all outbound `fetch` requests via `AbortSignal.timeout(5000)`.
- Per-user rate-limiting (max 10 dispatches/hour) to prevent webhook flooding.
