/**
 * Test Suite: SSRF Protection & Webhook URL Validation
 * Validates OWASP A10 / SSRF mitigations for external notification dispatcher.
 */

export function validateWebhookUrl(rawUrl: string): { valid: boolean; error?: string; url?: URL } {
  try {
    const target = rawUrl.trim();
    if (!target) {
      return { valid: false, error: 'Target URL cannot be empty.' };
    }
    const parsed = new URL(target);
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Webhook URL must use secure HTTPS protocol.' };
    }
    const hostname = parsed.hostname.toLowerCase();
    
    // Block loopback addresses
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return { valid: false, error: 'Target webhook address violates SSRF security boundaries.' };
    }
    
    // Block Cloud Metadata endpoints
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
      return { valid: false, error: 'Target webhook address violates SSRF security boundaries.' };
    }

    // Block private RFC 1918 subnets & internal suffixes
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

export function runSsrfTests(): { passed: number; failed: number; results: { name: string; ok: boolean; message?: string }[] } {
  const tests = [
    {
      name: 'Rejects insecure HTTP protocol',
      input: 'http://hooks.slack.com/services/123/456',
      expectValid: false,
    },
    {
      name: 'Rejects localhost loopback address',
      input: 'https://localhost:8080/webhook',
      expectValid: false,
    },
    {
      name: 'Rejects 127.0.0.1 loopback IP',
      input: 'https://127.0.0.1/hook',
      expectValid: false,
    },
    {
      name: 'Rejects Cloud Metadata IP (169.254.169.254)',
      input: 'https://169.254.169.254/computeMetadata/v1/',
      expectValid: false,
    },
    {
      name: 'Rejects GCP internal metadata hostname',
      input: 'https://metadata.google.internal/computeMetadata/v1/',
      expectValid: false,
    },
    {
      name: 'Rejects RFC 1918 10.x.x.x private network',
      input: 'https://10.0.1.25/webhook',
      expectValid: false,
    },
    {
      name: 'Rejects RFC 1918 192.168.x.x private network',
      input: 'https://192.168.1.1/admin-hook',
      expectValid: false,
    },
    {
      name: 'Rejects internal company suffix .internal',
      input: 'https://backend.prod.internal/hook',
      expectValid: false,
    },
    {
      name: 'Accepts valid public Discord webhook URL',
      input: 'https://discord.com/api/webhooks/123456789/abcdef-token',
      expectValid: true,
    },
    {
      name: 'Accepts valid public Slack webhook URL',
      input: 'https://hooks.slack.com/services/sample/test/webhook',
      expectValid: true,
    },
  ];

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const t of tests) {
    const res = validateWebhookUrl(t.input);
    const ok = res.valid === t.expectValid;
    if (ok) {
      passed++;
      results.push({ name: t.name, ok: true });
    } else {
      failed++;
      results.push({ name: t.name, ok: false, message: `Expected valid=${t.expectValid}, got valid=${res.valid} (${res.error || 'no error'})` });
    }
  }

  return { passed, failed, results };
}
