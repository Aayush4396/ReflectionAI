/**
 * Test Suite: Database Persistence & Undefined-Stripping Hygiene
 * Validates zero-crash payload sanitation before passing objects to Firestore driver.
 */

export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = stripUndefined(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

export function runPayloadHygieneTests(): { passed: number; failed: number; results: { name: string; ok: boolean; message?: string }[] } {
  const tests = [
    {
      name: 'Strips top-level undefined properties',
      input: { title: 'Test Entry', content: 'Reflection', badField: undefined },
      validate: (out: any) => !('badField' in out) && out.title === 'Test Entry',
    },
    {
      name: 'Preserves null values explicitly',
      input: { title: 'Test', location: null },
      validate: (out: any) => out.location === null,
    },
    {
      name: 'Preserves boolean false and number 0',
      input: { isPinned: false, count: 0, title: '' },
      validate: (out: any) => out.isPinned === false && out.count === 0 && out.title === '',
    },
    {
      name: 'Recursively cleans nested objects',
      input: {
        title: 'Deep Nesting',
        location: {
          lat: 37.7749,
          lng: -122.4194,
          elevation: undefined,
        },
      },
      validate: (out: any) => out.location.lat === 37.7749 && !('elevation' in out.location),
    },
    {
      name: 'Recursively cleans array of objects',
      input: {
        messages: [
          { role: 'user', text: 'Hello', meta: undefined },
          { role: 'model', text: 'Hi', meta: { token: undefined, timestamp: 12345 } },
        ],
      },
      validate: (out: any) =>
        out.messages.length === 2 &&
        !('meta' in out.messages[0]) &&
        out.messages[1].meta.timestamp === 12345 &&
        !('token' in out.messages[1].meta),
    },
  ];

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const t of tests) {
    const cleaned = stripUndefined(t.input);
    const ok = Boolean(t.validate(cleaned));
    if (ok) {
      passed++;
      results.push({ name: t.name, ok: true });
    } else {
      failed++;
      results.push({ name: t.name, ok: false, message: `Failed validation check for input: ${JSON.stringify(t.input)}` });
    }
  }

  return { passed, failed, results };
}
