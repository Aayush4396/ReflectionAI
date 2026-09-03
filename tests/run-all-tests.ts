/**
 * Master Test Runner for ReflectAI Security & Functional TDD Suites
 * Executes all tests and outputs formatted results with proper exit codes.
 */

import { runSsrfTests } from './security-ssrf.test';
import { runCoordinateTests } from './coordinates-validation.test';
import { runRbacTests } from './rbac-auth.test';
import { runPayloadHygieneTests } from './payload-hygiene.test';
import { runGeminiFallbackTests } from './gemini-fallback.test';

async function main() {
  console.log('\n======================================================');
  console.log('   🛡️  ReflectAI Automated TDD & Security Test Suite');
  console.log('======================================================\n');

  let totalPassed = 0;
  let totalFailed = 0;

  const suites: { name: string; run: () => any }[] = [
    { name: 'Suite 1: SSRF Defense & Webhook Sanitization', run: runSsrfTests },
    { name: 'Suite 2: Google Maps Coordinates Validation', run: runCoordinateTests },
    { name: 'Suite 3: Role-Based Access Control (RBAC) & Audits', run: runRbacTests },
    { name: 'Suite 4: Payload Hygiene & Undefined Stripping', run: runPayloadHygieneTests },
    { name: 'Suite 5: Gemini Model Fallback Ladder Resilience', run: runGeminiFallbackTests },
  ];

  for (const suite of suites) {
    console.log(`▶ Running ${suite.name}...`);
    const result = await suite.run();
    totalPassed += result.passed;
    totalFailed += result.failed;

    for (const r of result.results) {
      if (r.ok) {
        console.log(`   ✅ PASS: ${r.name}`);
      } else {
        console.log(`   ❌ FAIL: ${r.name} - ${r.message || 'assertion failed'}`);
      }
    }
    console.log(`   Summary: ${result.passed} passed, ${result.failed} failed\n`);
  }

  console.log('------------------------------------------------------');
  console.log(`TOTAL RESULTS: ${totalPassed} passed, ${totalFailed} failed across ${suites.length} suites.`);
  console.log('------------------------------------------------------\n');

  if (totalFailed > 0) {
    console.error(`❌ Security/TDD tests failed with ${totalFailed} errors. Pre-deploy verification BLOCKED.`);
    process.exit(1);
  } else {
    console.log('🎉 All security & functional TDD tests passed cleanly! Ready for Cloud Run deployment.\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
