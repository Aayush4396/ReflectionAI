#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "   🚀 ReflectAI Pre-Deploy Cloud Run Verification"
echo "=========================================================="

echo "▶ Phase 1: Security Audit & TDD Regression Suite..."
bash ./scripts/security-audit.sh

echo "▶ Phase 2: Production Build Compilation..."
npm run build

echo "▶ Phase 3: Verifying Production Output Artifacts..."
if [ ! -f "dist/index.html" ] || [ ! -f "dist/server.cjs" ]; then
  echo "❌ CRITICAL: Production artifacts dist/index.html or dist/server.cjs missing!"
  exit 1
fi
echo "   ✅ Production bundle verified (dist/index.html & dist/server.cjs present)."

echo "=========================================================="
echo "   🟢 Cloud Run pre-deploy verification: READY TO DEPLOY"
echo "   Command: gcloud run deploy reflect-ai --source ."
echo "=========================================================="
exit 0
