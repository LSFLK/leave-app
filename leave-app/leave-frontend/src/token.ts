// Centralized JWT handling for the leave app (bridge-first)

const TOKEN_KEY = 'jwt';
let cachedToken: string | null = null;

function getBridge(): any | undefined {
  return typeof window !== 'undefined' ? (window as any).nativebridge : undefined;
}

async function readFromHostStorage(): Promise<string | null> {
  const nb = getBridge();
  if (nb?.requestGetLocalData) {
    try {
      const res = await nb.requestGetLocalData({ key: TOKEN_KEY });
      if (res && typeof res.value === 'string' && res.value) return res.value;
    } catch {}
  }
  return null;
}

async function writeToHostStorage(token: string): Promise<void> {
  const nb = getBridge();
  if (nb?.requestSaveLocalData) {
    try {
      await nb.requestSaveLocalData({ key: TOKEN_KEY, value: token });
    } catch {}
  }
}

function readFromWebStorage(): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
  } catch {
    return null;
  }
}

function writeToWebStorage(token: string): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export async function getToken(): Promise<string> {
  // 1) Return cached if available
  if (cachedToken) return cachedToken;

  const nb = getBridge();

  // 2) In host: prefer scoped token from requestToken()
  if (nb && typeof nb.requestToken === 'function') {
    try {
      const t: unknown = await nb.requestToken();
      if (typeof t === 'string' && t) {
        cachedToken = t;
        // Best-effort persist in host storage for subsequent loads
        writeToHostStorage(t);
        return t;
      }
    } catch {
      // ignore and fall through to other options
    }

    // Fallback to previously saved token in host storage
    const fromHost = await readFromHostStorage();
    if (fromHost) {
      cachedToken = fromHost;
      return fromHost;
    }
  }

  // 3) Backward-compat: older bridge method name
  if (nb && typeof nb.requestMicroAppToken === 'function') {
    const t = await nb.requestMicroAppToken();
    const val = typeof t === 'string' ? t : (t && typeof t.token === 'string' ? t.token : '');
    if (val) {
      cachedToken = val;
      writeToHostStorage(val);
      writeToWebStorage(val);
      return val;
    }
  }

  // 4) Dev/browser fallback: try web storage
  const fromWeb = readFromWebStorage();
  if (fromWeb) {
    cachedToken = fromWeb;
    return fromWeb;
  }

  throw new Error('JWT token unavailable: host bridge not available and no local token set');
}

// Centralized JWT handling for the leave app

// export const JWT_TOKEN: string = ((): string => {
//   // Try from localStorage first
//   const fromStorage = typeof window !== 'undefined' ? window.localStorage.getItem('jwt') : null;
//   if (fromStorage) return fromStorage;
//   // Fallback to existing hard-coded token used in the app (replace in production)
//   return 'eyJ4NXQiOiI2aktpSGh0LXhXMlFVclVTQzJsM2Z1dFF3X2ciLCJraWQiOiJNV1F5TkRnNE1tSm1OR1EwTkRVeU1HSXlZbUZtWWpkaFpUY3pNamxsTXpWaU9UUmxNRGhqWlRVeVlURmpaREZtWmpBMU1tRXlPRFF6TVdGaFl6QmhNQV9SUzI1NiIsInR5cCI6ImF0K2p3dCIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJhMzhmZTMyOS0zNzYwLTRlODgtYTlmZS1lYmFlNGU0MTkyM2EiLCJhdXQiOiJBUFBMSUNBVElPTl9VU0VSIiwiYmluZGluZ190eXBlIjoic3NvLXNlc3Npb24iLCJpc3MiOiJodHRwczpcL1wvYXBpLmFzZ2FyZGVvLmlvXC90XC9sc2Zwcm9qZWN0XC9vYXV0aDJcL3Rva2VuIiwiZ3JvdXBzIjpbInN1cGVyYXBwX2FkbWluIiwiaHItc3RhZmYiXSwiZ2l2ZW5fbmFtZSI6IlNhcmFoIiwiY2xpZW50X2lkIjoiYVZybzNBVGY1WlNnbFpISXRFRGowS2Q3TTR3YSIsImF1ZCI6ImFWcm8zQVRmNVpTZ2xaSEl0RURqMEtkN000d2EiLCJuYmYiOjE3NjE4ODMwNzAsImF6cCI6ImFWcm8zQVRmNVpTZ2xaSEl0RURqMEtkN000d2EiLCJvcmdfaWQiOiJhNTJiZTU0NC04NmQ4LTRkMzctYTA2ZC02YjE5ZGExM2ZkMTQiLCJzY29wZSI6ImVtYWlsIGdyb3VwcyBvcGVuaWQgcHJvZmlsZSIsImV4cCI6MTc2MzA5MjY3MCwib3JnX25hbWUiOiJsc2Zwcm9qZWN0IiwiaWF0IjoxNzYxODgzMDcwLCJmYW1pbHlfbmFtZSI6IkxlZSIsImJpbmRpbmdfcmVmIjoiOGJjODYzYTllZTRiODk5MjFiMzZlMTgwZjdkODI0MmMiLCJqdGkiOiI3NWQwNWRkMi04Y2EzLTRjMzctOGI1Zi01YzY4NTY5ZDljYzQiLCJlbWFpbCI6InNhcmFoQGdvdi5jb20iLCJvcmdfaGFuZGxlIjoibHNmcHJvamVjdCJ9.RGLX40Bvxo_nX-ocrLzjZ-LP2pureufEtmJFwvgZjh5-w-khVTcQDDab-srZM5-c-xRZzbO6gB5WoqaCZLCjMoUcEKIrJn2X-IbDsp8ggYjH0ED4Au4_KOwxWcoSS_1NvhXW5PRzDRfmchH6PMUT-6r5YxnhozQXtxbO5h3KnTW7-Q3mfiQ4Oa7GlkWszAru0MN2hZqWlOPC0u_TksmwKkQ7qhQZTaBJsuaySyMF2yB6sT5l3KyquylRj809aYuDblyWc8CJSiJFGXrp4SbB103o27naWFvNjI3Ku0n36UjgDX0ruqggCWbSbSTkH3d4UiC0UpMXzB_t06rZ0q_aNQ';
// })();

export function getEmailFromJWT(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.email || null;
  } catch {
    return null;
  }
}

// Optional helpers for dev/logout flows
export async function setToken(token: string): Promise<void> {
  cachedToken = token;
  writeToWebStorage(token);
  await writeToHostStorage(token);
}

export async function clearToken(): Promise<void> {
  cachedToken = null;
  try { if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY); } catch {}
  const nb = getBridge();
  if (nb?.requestSaveLocalData) {
    try { await nb.requestSaveLocalData({ key: TOKEN_KEY, value: '' }); } catch {}
  }
}
