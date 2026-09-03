#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "   🛡️  ReflectAI Security & Static Analysis Audit"
echo "=========================================================="

echo "▶ Step 1: Checking for hardcoded secrets or API keys in source files..."
# Check for common Google API key or private key patterns in codebase
LEAKS=$(grep -rnEI --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude=firebase-applet-config.json \
  "AIza[0-9A-Za-z_-]{35}|sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}" . || true)

if [ -n "$LEAKS" ]; then
  echo "❌ CRITICAL SECURITY ALERT: Potential hardcoded API keys detected:"
  echo "$LEAKS"
  exit 1
fi
echo "   ✅ Secret scan clean: No hardcoded API keys detected."

echo "▶ Step 2: Auditing Firestore Security Rules (Zero-Insecure-Defaults)..."
if grep -q "allow read, write: if true" firestore.rules; then
  echo "❌ CRITICAL: Insecure default 'allow read, write: if true;' found in firestore.rules!"
  exit 1
fi

if ! grep -q "request.auth != null && request.auth.uid == userId" firestore.rules; then
  echo "❌ WARNING: Owner-bound isolation pattern not detected in firestore.rules!"
  exit 1
fi
echo "   ✅ Firestore security rules verified: User data isolation enforced."

echo "▶ Step 3: Running TypeScript Linting & Type Validation..."
npm run lint
echo "   ✅ TypeScript compilation clean with zero errors."

echo "▶ Step 4: Running Automated TDD Security Test Suites..."
npx tsx tests/run-all-tests.ts

echo "=========================================================="
echo "   🎉 All security audit gates PASSED successfully!"
echo "=========================================================="
exit 0
