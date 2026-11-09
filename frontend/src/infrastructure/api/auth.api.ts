import type { User } from '@/domain/entities';
import { http, unwrap } from '../http/client';

export const authApi = {
  me: () => unwrap<User>(http.get('/auth/me')),
  loginWithGoogle: (credential: string) => unwrap<User>(http.post('/auth/google', { credential })),
  login: (input: { email: string; password: string }) => unwrap<User>(http.post('/auth/login', input)),
  register: (input: { fullName: string; email: string; password: string }) =>
    unwrap<User>(http.post('/auth/register', input)),
  forgotPassword: (email: string) => http.post('/auth/forgot-password', { email }).then(() => undefined),
  resetPassword: (input: { token: string; password: string }) => unwrap<User>(http.post('/auth/reset-password', input)),
  changePassword: (input: { currentPassword?: string; newPassword: string }) =>
    unwrap<User>(http.post('/auth/password', input)),
  devLogin: (email: string) => unwrap<User>(http.post('/auth/dev-login', { email })),
  logout: () => http.post('/auth/logout').then(() => undefined),
};
