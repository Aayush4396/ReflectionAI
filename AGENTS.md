# ReflectAI Custom Instructions & Directives

## Directive 1: Google Maps Integration Directive (Location-Aware Journaling)
* **Objective**: Enable secure, privacy-preserving location tagging and geographic mindset mapping ("Mindset Atlas") across journal reflections.
* **Core Principles & Security Standards**:
  1. **Dual-Key & Backend Proxy Architecture**:
     - Client-side interactive maps and autocompletion must only use HTTP Referrer-restricted Google Maps browser keys (`VITE_GOOGLE_MAPS_API_KEY`).
     - Any server-side geocoding, reverse geocoding, or IP-based location inference must run via server-side routes (`/api/maps/geocode`) using Secret Manager or `GOOGLE_MAPS_API_KEY`, keeping high-privilege keys hidden from browser clients.
  2. **Opt-In Geolocation & User Privacy**:
     - Geolocation collection via the browser `navigator.geolocation` API must always require explicit user consent and opt-in action.
     - Never silently ping or track the user's location in the background.
     - Provide immediate capability to remove or edit the pinned location from any reflection.
  3. **Strict Coordinate & Input Validation**:
     - All coordinates must be strictly checked: latitude must be a float between -90.0 and 90.0; longitude between -180.0 and 180.0.
     - Place names and formatted addresses must be sanitized and string-length bounded to prevent XSS.
  4. **Data Isolation**:
     - Location metadata (`lat`, `lng`, `address`, `placeName`, `city`) is stored strictly within the user's private document path (`/users/{userId}/entries/{entryId}`).
     - Location coordinates are never indexed into public collections or shared without the user's explicit consent.
  5. **Graceful Fallback & Offline Experience**:
     - When Google Maps API key is not present or offline, the UI must provide an interactive location selector with manual entry, local coordinate approximation, and a styled fallback map view so functionality is never broken.

---

## Directive 2: Admin Roles & Role-Based Access Control (RBAC) Directive
* **Objective**: Enforce strict, fail-closed role-based access control across system configuration, telemetry monitoring, and administrative workflows.
* **Role Taxonomy**:
  - `user`: Default role. Can only read and write their own documents under `/users/{request.auth.uid}`. Strictly barred from viewing system telemetry or other users' reflections.
  - `moderator`: Can access anonymized moderation triage queues and view safety violation alerts without accessing personal identifiable information (PII).
  - `admin`: Elevated administrative operator. Authorized to inspect system health, Gemini API fallback status, token throughput, audit logs, and trigger administrative health probes.
* **Security & Access Enforcement**:
  1. **Fail-Closed Authorization Boundary**:
     - All admin endpoints (e.g. `/api/admin/*`) and client routes must verify the caller's role before processing.
     - Non-admin callers must immediately receive a `403 Forbidden` response.
  2. **Role Tampering Prevention**:
     - Ordinary users must never have permission to elevate their own role. In `firestore.rules`, user profile updates must enforce that `request.resource.data.role == resource.data.role` or rely on backend admin claims/tokens.
  3. **Data Anonymization in Admin Telemetry**:
     - The Admin Dashboard must never display raw, private reflection entries.
     - Global mindset analytics displayed in the Admin Dashboard must be aggregated and scrubbed of user identifiers (`uid`, `email`, raw note text).
  4. **Immutable Audit Logging**:
     - Any privileged action (role updates, safety queue actions, system setting toggles) must generate a structured, timestamped audit log entry containing `operatorUid`, `actionType`, `targetEntity`, and `clientIp`.

---

## Directive 3: External Notification API Directive (Slack / Discord / Webhook)
* **Objective**: Provide automated, user-configured external notifications to Slack, Discord, or generic webhooks when specific reflection events occur, preserving user privacy and preventing credential leaks.
* **Security & Credential Management**:
  1. **Webhook URL Sanitization & SSRF Defense**:
     - Webhook URLs submitted by users must be validated against allowed HTTPS protocols.
     - Internal and loopback addresses (e.g., `127.0.0.1`, `localhost`, `169.254.169.254`, AWS metadata endpoints) must be rejected to prevent Server-Side Request Forgery (SSRF).
  2. **Privacy & Content Minimization**:
     - Never transmit raw, full-text journal entries or personal confessions to external third-party webhooks.
     - Only dispatch sanitized, high-level event summaries (e.g., "Action items extracted: 3 tasks ready", "Weekly streak milestone reached: 7 days", or "Mindfulness check-in alert").
  3. **Strict Payload Schema Enforcement**:
     - All outgoing payloads must conform to structured schemas (Slack Block Kit, Discord Embed, or Standard JSON Webhook).
     - Include timestamp, event source (`ReflectAI`), event type, and sanitized title.
  4. **Rate-Limiting & Circuit Breaking**:
     - The server dispatcher must enforce rate-limiting per user (maximum 10 notifications per hour) to prevent abuse and avoid hitting third-party API rate limits.
     - All outgoing webhook requests must have a strict 5-second timeout.
