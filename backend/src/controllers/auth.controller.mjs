import {
  buildSafeUser,
  clearSessionCookie,
  confirmEmail,
  getClientIp,
  getUserFromSession,
  isRateLimited,
  loginUser,
  logoutSession,
  requestPasswordReset,
  registerUser,
  resetPassword,
  SESSION_COOKIE,
  setSessionCookie,
} from '../services/platform.service.mjs';

export async function register(req, res) {
  if (isRateLimited(`register:${getClientIp(req)}`, 8, 10 * 60 * 1000)) {
    return res.status(429).json({ message: 'Prea multe incercari. Incearca din nou in cateva minute.' });
  }

  const result = await registerUser(req.body);
  return res.status(result.status).json(result.body);
}

export async function login(req, res) {
  if (isRateLimited(`login:${getClientIp(req)}`, 10, 15 * 60 * 1000)) {
    return res.status(429).json({ message: 'Prea multe incercari de autentificare. Incearca din nou mai tarziu.' });
  }

  const result = await loginUser(req.body, getClientIp(req), req.headers['user-agent']);
  if (result.sessionId) {
    setSessionCookie(res, result.sessionId, result.remember);
  }

  return res.status(result.status).json(result.body);
}

export async function adminLogin(req, res) {
  if (isRateLimited(`admin-login:${getClientIp(req)}`, 8, 15 * 60 * 1000)) {
    return res.status(429).json({ message: 'Prea multe incercari de autentificare admin. Incearca din nou mai tarziu.' });
  }

  const result = await loginUser(req.body, getClientIp(req), req.headers['user-agent'], { requiredRole: 'admin' });
  if (result.sessionId) {
    setSessionCookie(res, result.sessionId, result.remember);
  }

  return res.status(result.status).json(result.body);
}

export async function logout(req, res) {
  await logoutSession(req.cookies?.[SESSION_COOKIE]);
  clearSessionCookie(res);
  res.status(200).json({ message: 'Te-ai deconectat cu succes.' });
}

export async function me(req, res) {
  const user = await getUserFromSession(req.cookies?.[SESSION_COOKIE]);
  if (!user) {
    clearSessionCookie(res);
    return res.status(401).json({ message: 'Sesiunea nu este activa.' });
  }

  return res.status(200).json({ user: buildSafeUser(user) });
}

export async function forgotPassword(req, res) {
  if (isRateLimited(`forgot:${getClientIp(req)}`, 5, 10 * 60 * 1000)) {
    return res.status(429).json({ message: 'Prea multe cereri. Incearca din nou mai tarziu.' });
  }

  const result = await requestPasswordReset(req.body);
  return res.status(result.status).json(result.body);
}

export async function resetPasswordController(req, res) {
  const result = await resetPassword(req.body);
  return res.status(result.status).json(result.body);
}

export async function confirmEmailController(req, res) {
  const html = await confirmEmail(req.query.token || '');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
