import type { User } from '@/domain/entities';
import { http, unwrap } from '../http/client';

export const authApi = {
  me: () => unwrap<User>(http.get('/auth/me')),
  loginWithGoogle: (credential: string) => unwrap<User>(http.post('/auth/google', { credential })),
  devLogin: (email: string) => unwrap<User>(http.post('/auth/dev-login', { email })),
  logout: () => http.post('/auth/logout').then(() => undefined),
};
