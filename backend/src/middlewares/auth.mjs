import { clearSessionCookie, getUserFromSession, SESSION_COOKIE } from '../services/platform.service.mjs';

export async function attachUser(req, res, next) {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  req.user = sessionId ? await getUserFromSession(sessionId) : null;
  req.sessionId = sessionId || null;
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    clearSessionCookie(res);
    return res.status(401).json({ message: 'Sesiunea nu este activa.' });
  }

  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    clearSessionCookie(res);
    return res.status(401).json({ message: 'Sesiunea nu este activa.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Nu ai acces in aceasta zona.' });
  }

  next();
}
