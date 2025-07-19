const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface SignInData {
  username: string;
  password: string;
}

export interface SignUpData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface Document {
  createElement(arg0: string): unknown;
  id: number;
  title: string;
  owner: string;
  uploaded_at: string;
  file_doc: string;
  file_size?: string;
  is_signed: boolean;
  signed_by?: string;
  signed_at?: string;
}

export interface UploadDocumentData {
  title: string;
  file: File;
}

export interface SignDocumentData {
  document_id: number;
  signer_name: string;
}

export interface ErrorResponse {
  detail?: string;
  username?: string[];
  email?: string[];
  password?: string[];
  password_confirm?: string[];
  non_field_errors?: string[];
  title?: string[];
  file?: string[];
}

// Token management utilities
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
};

export const setAuthTokens = (access: string, refresh: string) => {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
};

export const clearAuthTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};

export const getCurrentUser = () => {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

// API request helper with token handling
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Add auth header if token exists and not for auth endpoints
  if (token && !endpoint.includes("/auth/")) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Add content type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle token refresh if needed
  if (response.status === 401 && !endpoint.includes("/auth/")) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(
          `${API_BASE_URL}/auth/token/refresh/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken }),
          }
        );

        if (refreshResponse.ok) {
          const { access } = await refreshResponse.json();
          setAuthTokens(access, refreshToken);

          // Retry original request with new token
          headers.Authorization = `Bearer ${access}`;
          return fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
        }
      } catch (error) {
        clearAuthTokens();
        throw new Error("Session expired. Please login again.");
      }
    }
  }

  return response;
};

// Authentication APIs
export async function signIn(data: SignInData): Promise<AuthResponse> {
  const response = await apiRequest("/auth/login/", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.detail || "Sign in failed");
  }

  const result = await response.json();

  // Store tokens and user info
  setAuthTokens(result.access, result.refresh);
  localStorage.setItem("user", JSON.stringify(result.user));

  return result;
}

export async function signUp(data: SignUpData): Promise<AuthResponse> {
  const response = await apiRequest("/auth/register/", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw error;
  }

  const result = await response.json();

  // Store tokens and user info
  setAuthTokens(result.access, result.refresh);
  localStorage.setItem("user", JSON.stringify(result.user));

  return result;
}

// Document APIs
export async function getDocuments(): Promise<Document[]> {
  const response = await apiRequest("/documents/");

  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }

  return response.json();
}

export async function uploadDocument(
  data: UploadDocumentData
): Promise<Document> {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("file_doc", data.file);

  const response = await apiRequest("/documents/", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw error;
  }

  return response.json();
}

export async function signDocument(data: SignDocumentData): Promise<Document> {
  const response = await apiRequest(`/documents/${data.document_id}/sign/`, {
    method: "POST",
    body: JSON.stringify({ signer_name: data.signer_name }),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.detail || "Permission Denied!");
  }

  return response.json();
}

export async function downloadDocument(documentId: number): Promise<Blob> {
  const response = await apiRequest(`/documents/${documentId}/download/`);

  if (!response.ok) {
    throw new Error("Failed to download document");
  }

  return response.blob();
}

export async function deleteDocument(documentId: number): Promise<void> {
  const response = await apiRequest(`/documents/${documentId}/`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete document");
  }
}
