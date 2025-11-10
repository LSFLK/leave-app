export async function getToken() {
  // 1) Preferred: token from host native bridge (if running in container)
  const inHost = typeof window.nativebridge?.requestToken === 'function';
  if (inHost) {
    try {
      const token = await (window.nativebridge as any).requestToken();
      if (token) return token as string;
    } catch {
      // fall through
    }
  }

  // 2) Dev fallback: env-provided static token
  const envToken = import.meta.env.VITE_STATIC_TOKEN as string | undefined;
  if (envToken && envToken.trim().length > 0) return envToken.trim();

  // 3) Dev fallback: token from localStorage key 'jwt'
  try {
    const ls = typeof window !== 'undefined' ? window.localStorage.getItem('jwt') : null;
    if (ls && ls.trim().length > 0) return ls.trim();
  } catch {
    // ignore
  }

  // 4) Dev fallback: token from URL (?token=... or #token=...)
  try {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const qp = searchParams.get('token');
    if (qp && qp.trim().length > 0) return qp.trim();
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace(/^#/, '');
      const hp = new URLSearchParams(hash).get('token');
      if (hp && hp.trim().length > 0) return hp.trim();
    }
  } catch {
    // ignore
  }

  // 5) No token available
  return undefined;
}

export function getEmailFromJWT(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    //log.info('Decoded JWT payload:', decoded);
    return decoded.email || null;

  } catch {
    return null;
  }
}

