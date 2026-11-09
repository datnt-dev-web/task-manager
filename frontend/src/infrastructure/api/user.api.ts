import type { EmailSettings, Paginated, ThemePreference, User } from '@/domain/entities';
import { http, unwrap } from '../http/client';

export interface UpdateProfileInput {
  fullName?: string;
  title?: string | null;
  theme?: ThemePreference;
  emailSettings?: Partial<EmailSettings>;
}

export const userApi = {
  list: async (params: { q?: string; page?: number; pageSize?: number } = {}): Promise<Paginated<User>> => {
    const { data } = await http.get('/users', { params });
    return { items: data.data, meta: data.meta };
  },
  updateMe: (input: UpdateProfileInput) => unwrap<User>(http.patch('/users/me', input)),
  invite: (emails: string[]) => unwrap<{ created: User[]; skipped: string[] }>(http.post('/users', { emails })),
  adminUpdate: (userId: string, input: { status?: 'active' | 'disabled'; isAdmin?: boolean }) =>
    unwrap<User>(http.patch(`/users/${userId}`, input)),
};
