import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: "STUDENT" | "TRAINER" | "ADMIN";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
}

export async function login(credentials: LoginRequest): Promise<AuthUser> {
  const response = await apiRequest("POST", "/api/auth/login", credentials);
  const data = await response.json();
  return data.user;
}

export async function register(userData: RegisterRequest): Promise<AuthUser> {
  const response = await apiRequest("POST", "/api/auth/register", userData);
  const data = await response.json();
  return data.user;
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await apiRequest("GET", "/api/me");
    const data = await response.json();
    return data.user;
  } catch (error) {
    return null;
  }
}
