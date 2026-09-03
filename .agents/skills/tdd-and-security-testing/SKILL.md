---
name: tdd-and-security-testing
description: Test-driven development methodologies, automated security regression suites, SSRF testing, and pre-deployment verification for Cloud Run.
---

# Test-Driven Development (TDD) & Security Testing Skill

This skill outlines the procedures for implementing, testing, and verifying security controls and application features before deploying to Google Cloud Run.

## 1. The Red-Green-Refactor Cycle for Security
1. **Red**: Write an automated test asserting security criteria (e.g., attempt SSRF targeting `169.254.169.254` or `127.0.0.1`, coordinate out of range, or unauthenticated admin access).
2. **Green**: Implement the minimal validation logic to satisfy the security boundary.
3. **Refactor**: Harden edge cases, performance, and clean code principles.

## 2. Mandatory Test Coverage
Every feature must include tests covering the 5 Threat Zones:
1. **SSRF Defense**: Asserts rejection of HTTP protocols, private IP subnets, loopback, and metadata servers.
2. **Coordinate Sanitization**: Asserts validation of latitude $[-90, 90]$ and longitude $[-180, 180]$.
3. **Role-Based Access Control**: Asserts fail-closed `403 Forbidden` responses for unprivileged callers on admin routes.
4. **Payload Hygiene**: Asserts recursive stripping of `undefined` fields to protect Firestore writes.
5. **Model Fallback**: Asserts recovery across the Gemini model fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.8-flash` &rarr; `gemini-3.7-flash`).

## 3. Git Hooks Integration
- Pre-commit: Verifies TypeScript compilation (`npm run lint`), runs secret scanning for leaked API keys, and runs unit tests.
- Pre-push: Runs full security test suite (`npm test`), builds the production bundle (`npm run build`), and verifies Firestore security rules syntax.
