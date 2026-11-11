// Single place for talking to the KR5 API.
// The token saved in localStorage is the same token the server stores in its
// UserToken collection at login, so a request is only treated as "logged out"
// when the server answers 401 — never because the server is briefly unreachable.

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export interface SessionUser {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: string; // role name shown in the UI, e.g. "Owner", "Photographer"
  permissions?: string[];
  isOwner?: boolean;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const getToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);

export const getStoredUser = (): SessionUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveSession = (token: string, user: SessionUser) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Removes only auth data, so preferences like the theme survive a logout
export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function api<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        ...(isFormData || body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    // Network failure (server down or restarting): keep the session
    throw new ApiError("Cannot reach the server. Check that it is running.", 0);
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearSession();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  if (!response.ok) {
    throw new ApiError(data.message || `Request failed (${response.status})`, response.status);
  }
  return data as T;
}

// fetch() can't report upload progress, so file uploads use XMLHttpRequest
export function uploadWithProgress<T = any>(
  path: string,
  formData: FormData,
  onProgress: (fraction: number) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}${path}`);
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onerror = () => reject(new ApiError("Cannot reach the server. Check that it is running.", 0));
    xhr.onload = () => {
      let data: any = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status === 401) {
        clearSession();
        window.location.href = "/login";
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as T);
      else reject(new ApiError(data.message || `Upload failed (${xhr.status})`, xhr.status));
    };
    xhr.send(formData);
  });
}
