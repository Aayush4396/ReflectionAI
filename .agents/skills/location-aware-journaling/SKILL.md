---
name: location-aware-journaling
description: Secure, privacy-preserving location tagging and geographic mindset mapping ("Mindset Atlas") across journal reflections with dual-key proxy architecture and coordinate validation.
---

# Location-Aware Journaling & Mindset Atlas Skill

This skill governs the capture, validation, storage, and visualization of geographic coordinates and place metadata associated with personal journal entries.

## 1. Core Architectural Standards

### A. Dual-Key & Backend Proxy Architecture
- **Client-Side Restrictions**: The browser UI must only ever use an HTTP Referrer-restricted browser API key (`VITE_GOOGLE_MAPS_API_KEY`).
- **Server-Side Proxy**: High-privilege geocoding, reverse geocoding, and IP inference MUST be executed through backend proxy endpoints (`/api/maps/reverse-geocode`, `/api/maps/geocode`) using server secrets (`GOOGLE_MAPS_API_KEY`), keeping backend credentials strictly isolated from the client bundle.

### B. Opt-In Geolocation & Privacy Isolation
- **Explicit User Consent**: Geolocation must NEVER be collected in the background or inferred without an explicit user click action.
- **User Document Isolation**: Coordinates (`lat`, `lng`, `address`, `placeName`, `city`) must ONLY be stored within the authenticated user's private path:
  `/users/{userId}/entries/{entryId}`
- Never index user coordinates into public collections or shared aggregates.
- Provide a single-click action to remove or edit the pinned location from any reflection.

### C. Strict Coordinate Validation & Sanitization
All coordinates must undergo boundary and type checking before processing or storage:
```typescript
export function validateCoordinates(lat: unknown, lng: unknown): { valid: boolean; lat?: number; lng?: number; error?: string } {
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
  return { valid: true, lat: Number(latitude.toFixed(6)), lng: Number(longitude.toFixed(6)) };
}
```

### D. Offline & Demo Fallback Strategy
When a live Google Maps key is unavailable or the user is offline:
- Provide an interactive, styled Cartesian cartographic grid representing latitude/longitude offsets.
- Support pre-configured sanctuary presets (*Home Sanctuary*, *Mindful Cafe*, *Mountain Trail*, *Urban Transit*).
- Display a friendly fallback badge (`Demo Coordinate Grid`) without throwing errors.
