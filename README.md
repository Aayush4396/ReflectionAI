# ReflectAI — User-Authenticated Journal & Gemini Reflection Partner

A full-stack, privacy-first personal journaling platform built with **React**, **Node.js (Express)**, **Google Cloud Firestore**, **Firebase Authentication**, and the **Gemini 3.6 Flash API**.

---

## 🌟 Key Capabilities

- **Federated Authentication**: Passwordless Google Sign-In with Firebase Auth — zero raw password storage or credential handling risks.
- **Strict Data Isolation**: User data is isolated under `/users/{userId}/entries/{entryId}` and guarded by hardened Firestore Security Rules.
- **Multi-Turn AI Reflections**: Multi-turn dialogue powered by Gemini supporting Socratic Inquiry, Executive Summaries, Brainstorming, Action Items, and Mindful Empathy.
- **Resilient AI Fallback Ladder**: Robust error recovery with automatic fallback sequencing: `gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.8-flash` &rarr; `gemini-3.7-flash`.
- **Longitudinal Mindset & Emotional Analytics**: Interactive sentiment valence trajectory, mood breakdown donut charts, top recurring theme frequencies, and weekly journaling habit cadence.
- **AI Cognitive Pattern Synthesis ("Mindset Report")**: Server-side AI synthesis of recurring psychological themes, cognitive shifts, and customized guidance for the upcoming week.
- **Voice Memo Audio Transcription**: Hands-free stream-of-consciousness recording with automatic Gemini audio transcription, evocative title generation, and mood detection.
- **Action Planner & Calendar Synchronization**: AI-extracted micro-action steps from reflections with one-click Google Calendar scheduling and `.ICS` calendar file download.
- **Zero-Crash Payload Hygiene**: Recursive undefined-stripping on all payloads before database writes to prevent Firestore driver rejections.
- **Real-Time Cloud Synchronization**: Instant bi-directional state synchronization, search indexing, tag categorization, mood tracking, and pinning.

---

## 🛡️ Firestore Security Rules

Deploy these rules to guarantee that each user can only read, write, and delete their own journal entries:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 🔐 Secret Management Setup

Gemini API keys and server secrets are never exposed to browser clients. Configure Google Cloud Secret Manager:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the Cloud Run compute service account permission to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 Google Cloud Run Deployment

### 1. Enable Required GCP APIs
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

### 2. Build & Deploy to Cloud Run
```bash
gcloud run deploy reflect-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

### 3. Apply Required Challenge Label
```bash
gcloud run services update reflect-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 📋 Comprehensive Functional Stability & Test Walkthrough

Below are the step-by-step verification procedures covering every user interaction in the application:

### Test Scenario 1: Unauthenticated Flow & Security Transparency
1. Navigate to the root application URL (`/`).
2. Verify the Landing Page renders with headline *"A private sanctuary for your thoughts and deep AI reflections."*
3. Click the **"Security & Threat Model"** pill button in the top navigation or feature section.
4. Verify the **Threat Model Modal** opens displaying the 5 threat zones and active countermeasures (User Data Isolation, Zero Hardcoded Keys, Fallback Ladder, Undefined Stripping). Click **Close**.

### Test Scenario 2: Federated Google Sign-In
1. On the landing page, click **"Continue with Google Sign-In"**.
2. Complete authentication via the Google popup dialog.
3. Confirm that upon success, the application automatically redirects to the private dashboard, showing the user's Google avatar and display name in the navbar.

### Test Scenario 3: Creating an Entry & Generating AI Reflections
1. In the **New Reflection** workbench, enter a title (e.g., *"Navigating my weekly priorities"*).
2. Select a mood pill (e.g., *Thoughtful* or *Energized*).
3. Type a tag (e.g., `Strategy`) and press <kbd>Enter</kbd>.
4. Type an initial thought into the journal textarea (e.g., *"I have 3 competing projects this week and need to decide which to prioritize first."*).
5. Click **"Socratic Inquiry"** under the reflection lens selector.
6. Click **"Reflect with Gemini"**.
7. Confirm that the loading spinner appears, followed by Gemini's formatted response.
8. Verify that the save indicator reads **"Saved in Firestore"** and the entry immediately appears in the right-hand **Reflection History** panel.

### Test Scenario 4: Multi-Turn Conversation
1. Below the initial reflection response, locate the follow-up input box.
2. Enter: *"Can you break down Project 1 into three 30-minute micro-tasks?"* and press <kbd>Enter</kbd>.
3. Confirm Gemini replies directly in context within the conversation timeline.
4. Verify the message counter on the history card increments to `2`.

### Test Scenario 5: Search, Filter, and Pinning
1. In the **Reflection History** search bar, type `Strategy`. Confirm only matching entries remain visible.
2. Click the **Pin icon** on the entry. Confirm the card moves to the top with a **Pinned** badge.
3. Click the **"Pinned Only"** filter button. Confirm unpinned entries are filtered out.

### Test Scenario 6: Full Conversation Inspection & Markdown Export
1. Click the **Eye icon** on an entry card to open the **Entry Detail Modal**.
2. Verify the full dialogue history and formatted markdown text are visible.
3. Click **"Copy Markdown"**. Confirm the button displays **"Copied to Clipboard"**.
4. Click **"Continue in Editor"**. Verify the workbench loads the exact reflection with all prior messages intact.

### Test Scenario 7: Deletion & Sign-Out
1. Click the **Trash icon** on an entry. Confirm the confirmation prompt appears.
2. Click **"Confirm Delete"**. Verify the document is removed from Firestore and disappears from the history list.
3. Click the **Sign Out** icon in the top right navbar. Confirm the application returns to the unauthenticated Landing Page.

### Test Scenario 8: Longitudinal Mindset & Pattern Synthesis
1. Click the **"Mindset & Analytics"** tab in the top navigation bar.
2. Verify the metric tiles (Total Entries, Reflection Depth, AI Inquiries, Dominant Mindset) correctly calculate summary statistics from your Firestore entries.
3. Toggle between the **"Last 7 Days"**, **"Last 30 Days"**, and **"All Time"** timeframe filters. Verify the charts dynamically update.
4. Verify the **Emotional Tone & Valence Trajectory** area chart and **Mindset Breakdown** donut chart render with interactive tooltips.
5. Click the **"Generate Mindset Report"** button.
6. Confirm the loading animation (*"Analyzing Cognitive Patterns..."*) displays while the server processes the request through the Gemini fallback ladder.
7. Verify the generated Mindset Report renders:
   - Executive Reflection Summary (formatted in Markdown)
   - Identified Growth Themes tags
   - Cognitive Breakthroughs checklist
   - Mindful Focus Recommendations for the upcoming week
8. Click **"Copy Report"** and verify confirmation feedback (*"Copied"*).

### Test Scenario 9: Voice Memo Stream-of-Consciousness Transcription
1. In the Journal Workbench, click the **"Voice Memo"** microphone button in the top action bar.
2. Verify the Voice Memo recording panel expands with recording status.
3. Click **"Start Voice Memo"** (allow microphone permissions in browser when prompted).
4. Speak a reflection aloud (e.g. *"Today I tackled a complex backend migration, felt anxious at first but found clarity by breaking down steps"*).
5. Click **"Finish & Transcribe"**.
6. Verify the audio is sent to the server-side Gemini audio pipeline and that:
   - The transcribed text is automatically appended to your journal content.
   - An evocative reflection title is generated.
   - The appropriate emotional mindset and tags are automatically selected.

### Test Scenario 10: Action Planner & Calendar Integration
1. In the Journal Workbench, scroll down to the **"Actionable Steps & Calendar Export"** panel.
2. Click **"Extract Action Items"**.
3. Verify Gemini analyzes the journal context and reflection dialogue to return concrete micro-tasks with estimated completion times and category tags.
4. Click the checkbox next to an action item to mark it complete.
5. Click **"Add to G-Cal"** on an item. Verify a new tab opens to Google Calendar pre-populated with event title, duration, and notes.
6. Click **"Export .ICS"**. Verify a standardized `.ics` calendar file downloads containing all extracted commitments.

### Test Scenario 11: Guided Reflection Frameworks (Phase 3)
1. Click **"Guided Frameworks"** in the top navbar or above the editor.
2. Verify the modal opens with 4 evidence-based frameworks:
   - *CBT Thought Record* (Trigger &rarr; Automatic Thought &rarr; Cognitive Distortions &rarr; Rational Reframe)
   - *Stoic Dichotomy of Control* (What is in my control vs. outside my control &rarr; Virtuous action)
   - *Weekly Retrospective* (Wins &rarr; Challenges &rarr; Learnings &rarr; Next Week's Focus)
   - *Morning Clarity Primer* (Gratitude &rarr; Core Intention &rarr; Anticipated Obstacle &rarr; Affirmation)
3. Select the **CBT Thought Record** framework.
4. Fill in step 1 (Trigger) and step 2 (Automatic Thought).
5. Click **"AI Distortion Check"**. Verify Gemini detects cognitive distortions (e.g., Catastrophizing, All-or-Nothing) and provides compassionate feedback.
6. Complete all steps and click **"Insert into Journal"**.
7. Confirm that the structured exercise is seamlessly transferred into the Journal Editor as formatted Markdown, pre-tagged with `#cbt-exercise` and appropriate mood.

### Test Scenario 12: AI Semantic Concept Search (Bonus Extension)
1. In the right-hand **Reflection History** panel, locate the search controls.
2. Click the **"Semantic AI"** toggle button.
3. Type an abstract conceptual query (e.g. *"feeling overwhelmed by work deadlines"* or *"moments of unexpected gratitude"*).
4. Press <kbd>Enter</kbd> or click the search icon.
5. Verify that Gemini evaluates the conceptual semantics of the entries and returns them ranked by relevance percentage score, highlighting the matched concept for each result.
6. Toggle back to **"Keyword"** search mode to search by direct text matches.

### Test Scenario 13: Full Data Portability & Archive Export (Bonus Extension)
1. In the top navbar or history header, click **"Export"**.
2. Verify the **Export & Data Portability Modal** opens, showing aggregate metrics (Total Entries, Total Words, Action Items, Dialogue Turns).
3. Select your desired date range filter (*All Time*, *Last 30 Days*, or *Last 7 Days*).
4. Click **"Download JSON Archive"**. Verify a structured `.json` backup file is downloaded containing complete metadata, message histories, and timestamps.
5. Click **"Download Markdown Archive"**. Verify an organized `.md` file is downloaded, formatted with table of contents and headings for reading in Obsidian, Notion, or local text editors.

---

## 🤖 Antigravity Developer Environment & Localized Skills

ReflectAI is organized with localized Antigravity skills under `.agents/skills/`:

| Localized Skill | Path | Description |
| :--- | :--- | :--- |
| **Location-Aware Journaling** | `.agents/skills/location-aware-journaling/SKILL.md` | Dual-key proxy architecture, coordinate boundary validation ($-90 \le \text{lat} \le 90$, $-180 \le \text{lng} \le 180$), and opt-in user privacy. |
| **RBAC & Security Architecture** | `.agents/skills/rbac-and-security/SKILL.md` | Role hierarchy (`user`, `moderator`, `admin`), fail-closed authorization boundaries, and immutable audit logs. |
| **External Notifications** | `.agents/skills/external-notifications/SKILL.md` | SSRF defense against loopback/metadata/private subnets, platform schemas (Discord/Slack), and rate limiting. |
| **TDD & Security Testing** | `.agents/skills/tdd-and-security-testing/SKILL.md` | Test-driven development methodologies, automated security regression suites, and pre-deploy verification. |

---

## 🧪 Test-Driven Development (TDD) Test Suites

The project includes 5 automated test suites located in `/tests/` executed via a unified runner:

```bash
# Run all TDD test suites
npm test

# Run comprehensive security & static analysis audit
npm run test:security
```

### Automated Test Coverage:
1. **SSRF Defense (`tests/security-ssrf.test.ts`)**: Tests rejection of HTTP protocol, loopback (`localhost`, `127.0.0.1`), cloud metadata (`169.254.169.254`), and private subnets (`10.x.x.x`, `192.168.x.x`).
2. **Coordinates Validation (`tests/coordinates-validation.test.ts`)**: Tests boundary enforcement on latitude and longitude, precision formatting, and string parsing.
3. **RBAC & Audits (`tests/rbac-auth.test.ts`)**: Tests fail-closed behavior for unauthorized users and verifies schema compliance on audit log entries.
4. **Payload Hygiene (`tests/payload-hygiene.test.ts`)**: Tests recursive undefined-stripping on nested objects and arrays for zero-crash database persistence.
5. **Gemini Fallback Ladder (`tests/gemini-fallback.test.ts`)**: Tests resilience and sequential failover across all 5 model tiers (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.8-flash` &rarr; `gemini-3.7-flash`).

---

## 🪝 Automated Pre-Deploy Git Hooks

Git hooks are configured under `.githooks/` to automatically run security tests before redeploying to Google Cloud Run:

### 1. Setup / Enable Git Hooks
```bash
npm run prepare:hooks
# or: git config core.hooksPath .githooks
```

### 2. Hook Execution Triggers
- **`pre-commit`**: Automatically scans staged changes for leaked API keys, runs `tsc --noEmit` typechecking, and runs the fast TDD test suites before allowing a commit.
- **`pre-push`**: Runs the complete pre-deployment verification script (`scripts/pre-deploy-check.sh`), validating security rules, running full regression tests, and compiling the production bundle (`npm run build`) before allowing a push or redeploy.

### 3. Manual Pre-Deploy Verification
```bash
npm run predeploy
```


