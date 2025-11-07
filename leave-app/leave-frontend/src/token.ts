
export async function getToken() {
  const inHost = typeof window.nativebridge?.requestToken === 'function';
  if (inHost) {
    try {
      const token = await window.nativebridge.requestToken();
      //log.info('Token from requestToken():', token);
      return token;
    } catch {
      // ignore and fall through to other options
    }
  }
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

