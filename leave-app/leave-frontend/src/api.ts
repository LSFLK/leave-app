// Central API helper to prefix all requests with a base URL.
// In production, set VITE_API_BASE to your deployed backend base URL
// (WITHOUT trailing slash). Example:
// https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/lsf-leave-app/backend/v1.0

const rawBase = import.meta.env.VITE_API_BASE as string | undefined;
// Normalize: empty string when undefined, and drop any trailing slash
export const API_BASE = (rawBase ?? '').replace(/\/$/, '');

// Optional timeout (ms) via env; defaults to 15000
const TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000);

// Enable verbose logging when VITE_DEBUG_API=true or in dev mode
const DEBUG = (import.meta.env.VITE_DEBUG_API === 'true') || import.meta.env.DEV;

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`; // API_BASE may be '' in dev (proxy)
}

interface ApiError extends Error {
  status?: number;
  url?: string;
  cause?: unknown;
  network?: boolean; // true if likely network / CORS / timeout
  timeout?: boolean;
}

function buildError(message: string, props: Partial<ApiError>): ApiError {
  const err = new Error(message) as ApiError;
  Object.assign(err, props);
  return err;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = apiUrl(path);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = Date.now();
  try {
    if (DEBUG) console.debug('[apiFetch] →', url, init);
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (DEBUG) console.debug('[apiFetch] ←', url, res.status, res.ok ? 'OK' : 'ERR', `${Date.now() - started}ms`);
    return res;
  } catch (e: any) {
    const aborted = e?.name === 'AbortError';
    const network = aborted || (e instanceof TypeError); // Fetch network/cors errors surface as TypeError
    const err = buildError(`API request failed: ${aborted ? 'timeout' : e?.message || 'network error'}`, {
      url,
      network,
      timeout: aborted,
      cause: e
    });
    if (DEBUG) console.error('[apiFetch] ✖', url, err);
    throw err;
  } finally {
    clearTimeout(id);
  }
}

// Small helper to safely parse JSON and always return an object
export async function parseJsonSafe<T = any>(res: Response): Promise<T & { _httpStatus: number } | { _httpStatus: number; status: 'error'; message: string }> {
  try {
    const data = await res.json();
    return { ...data, _httpStatus: res.status };
  } catch {
    return { _httpStatus: res.status, status: 'error', message: 'Invalid JSON response' } as any;
  }
}
