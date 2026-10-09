// Staff login token for this device. Sent with every /api request (see staff-auth.ts on the server).
const TOKEN_KEY = 'pos_staff_token';
const USER_KEY = 'resto_active_user';

export function getStaffToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export const LOGIN_EVENT = 'pos-staff-login';

export function saveStaffSession(token: string, user: any) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(LOGIN_EVENT)); // branch list and settings load after login
}

export function clearStaffSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

let installed = false;

/**
 * Adds "Authorization: Bearer <token>" to same-site /api requests (not the customer app's routes).
 * If the server says the login is no longer valid, the device returns to the login screen.
 */
export function installStaffFetch() {
  if (installed) return;
  installed = true;
  const original = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const path = url.startsWith(window.location.origin) ? url.slice(window.location.origin.length) : url;
    const isOurApi = path.startsWith('/api/') && !path.startsWith('/api/customer');
    const token = getStaffToken();

    if (isOurApi && token) {
      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
      if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
      init = { ...init, headers };
    }

    const res = await original(input, init);
    if (isOurApi && res.status === 401 && !path.startsWith('/api/auth/login') && getStaffToken() !== null) {
      clearStaffSession();
      window.location.replace('/');
    }
    return res;
  };
}
