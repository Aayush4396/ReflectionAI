---
name: rbac-and-security
description: Enforce strict, fail-closed role-based access control, user data isolation, immutable audit logging, and zero hardcoding standards.
---

# Role-Based Access Control (RBAC) & Security Architecture Skill

This skill governs authorization boundaries, administrative controls, immutable audit logging, and zero-trust credential hygiene.

## 1. Role Taxonomy & Boundaries
- **`user`** (Default): Access is strictly confined to `/users/{request.auth.uid}`. Users can never view other users' entries or system telemetry.
- **`moderator`**: Authorized to inspect anonymized moderation alerts, triage safety queues, and review system error patterns without accessing personal reflection text or user PII.
- **`admin`**: Elevated operational privileges. Authorized to inspect system metrics, token usage, Gemini API fallback status, and audit logs.

## 2. Fail-Closed Server Boundaries
All administrative API endpoints (e.g., `/api/admin/*`) MUST verify user roles before serving data:
```typescript
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const userRole = req.headers['x-user-role'];
  const adminSecret = req.headers['x-admin-secret'];

  // Check admin secret header if configured
  if (process.env.ADMIN_SECRET_KEY && adminSecret === process.env.ADMIN_SECRET_KEY) {
    return next();
  }

  // Check user role claims
  if (userRole === 'admin') {
    return next();
  }

  // Fail closed
  return res.status(403).json({
    error: 'Access denied: caller does not possess administrative credentials.',
    code: 'PERMISSION_DENIED'
  });
}
```

## 3. Immutable Audit Logging
Privileged administrative actions and sensitive event dispatches must generate an immutable structured log:
```typescript
interface AuditLogEntry {
  id: string;
  timestamp: string;
  operatorUid: string;
  actionType: 'ROLE_UPDATE' | 'SETTING_TOGGLE' | 'WEBHOOK_DISPATCH' | 'HEALTH_PROBE' | 'DATA_EXPORT';
  targetEntity: string;
  clientIp: string;
  details?: Record<string, unknown>;
}
```

## 4. Zero Hardcoding Hygiene
- Prohibit any hardcoded tokens or secrets in the codebase.
- Retrieve all secrets from Google Cloud Secret Manager or runtime environment variables.
- Run automated git pre-commit hooks to scan for regex patterns like `AIzaSy...`, `sk-...`, and secret tokens.
