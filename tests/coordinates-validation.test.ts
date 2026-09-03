/**
 * Test Suite: Geographic Coordinate Validation & Sanitization
 * Validates Google Maps Directive boundary constraints (-90 <= lat <= 90, -180 <= lng <= 180).
 */

export function validateCoordinates(lat: unknown, lng: unknown): { valid: boolean; lat?: number; lng?: number; error?: string } {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return { valid: false, error: 'Latitude and longitude coordinates are required.' };
  }

  const latitude = typeof lat === 'number' ? lat : parseFloat(String(lat));
  const longitude = typeof lng === 'number' ? lng : parseFloat(String(lng));

  if (isNaN(latitude) || isNaN(longitude)) {
    return { valid: false, error: 'Latitude and longitude must be valid floating point numbers.' };
  }

  if (latitude < -90.0 || latitude > 90.0) {
    return { valid: false, error: 'Latitude must be between -90.0 and 90.0 degrees.' };
  }

  if (longitude < -180.0 || longitude > 180.0) {
    return { valid: false, error: 'Longitude must be between -180.0 and 180.0 degrees.' };
  }

  return {
    valid: true,
    lat: Number(latitude.toFixed(6)),
    lng: Number(longitude.toFixed(6)),
  };
}

export function runCoordinateTests(): { passed: number; failed: number; results: { name: string; ok: boolean; message?: string }[] } {
  const tests = [
    {
      name: 'Accepts standard San Francisco coordinates',
      lat: 37.7749,
      lng: -122.4194,
      expectValid: true,
    },
    {
      name: 'Accepts exact boundary coordinates (90, 180)',
      lat: 90.0,
      lng: 180.0,
      expectValid: true,
    },
    {
      name: 'Accepts exact boundary coordinates (-90, -180)',
      lat: -90.0,
      lng: -180.0,
      expectValid: true,
    },
    {
      name: 'Rejects out of range latitude (+90.0001)',
      lat: 90.0001,
      lng: 0.0,
      expectValid: false,
    },
    {
      name: 'Rejects out of range latitude (-91)',
      lat: -91.0,
      lng: 45.0,
      expectValid: false,
    },
    {
      name: 'Rejects out of range longitude (+180.5)',
      lat: 0.0,
      lng: 180.5,
      expectValid: false,
    },
    {
      name: 'Rejects out of range longitude (-181)',
      lat: 10.0,
      lng: -181.0,
      expectValid: false,
    },
    {
      name: 'Rejects non-numeric string coordinates ("invalid", "coords")',
      lat: 'invalid',
      lng: 'coords',
      expectValid: false,
    },
    {
      name: 'Parses string numbers correctly ("35.6762", "139.6503")',
      lat: '35.6762',
      lng: '139.6503',
      expectValid: true,
    },
    {
      name: 'Rejects null or undefined coordinates',
      lat: null,
      lng: undefined,
      expectValid: false,
    },
  ];

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const t of tests) {
    const res = validateCoordinates(t.lat, t.lng);
    const ok = res.valid === t.expectValid;
    if (ok) {
      passed++;
      results.push({ name: t.name, ok: true });
    } else {
      failed++;
      results.push({ name: t.name, ok: false, message: `Expected valid=${t.expectValid}, got valid=${res.valid} (${res.error})` });
    }
  }

  return { passed, failed, results };
}
