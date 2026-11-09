// Smoke test end-to-end cho API. Yêu cầu API đang chạy với ALLOW_DEV_LOGIN=true
// và đã seed INITIAL_ADMIN_EMAIL=admin@example.com.
//   API_URL=http://localhost:4000/api/v1 node tests/smoke.mjs
// Mỗi lần chạy dùng mã dự án và email riêng nên chạy lặp được trên cùng database.

const BASE = process.env.API_URL ?? 'http://localhost:4000/api/v1';
const ADMIN = process.env.SMOKE_ADMIN_EMAIL ?? 'admin@example.com';
const RUN = Math.random().toString(36).slice(2, 6).toUpperCase().replace(/^\d/, 'Q');
const KEY = `S${RUN}`.slice(0, 5);
const email = (name) => `${name}.${RUN.toLowerCase()}@example.com`;
const doc = (...content) => ({ type: 'doc', content });
const para = (...content) => ({ type: 'paragraph', content });
const text = (t) => ({ type: 'text', text: t });
const mention = (id, label) => ({ type: 'mention', attrs: { id, label } });

function client() {
  const jar = {};
  const request = async (method, path, body, { raw = false } = {}) => {
    const isForm = body instanceof FormData;
    const res = await fetch(BASE + path, {
      method,
      headers: {
        ...(isForm || !body ? {} : { 'content-type': 'application/json' }),
        cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; '),
      },
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(';');
      const [k, v] = pair.split('=');
      jar[k] = v;
    }
    if (raw) return { status: res.status, headers: res.headers, buffer: Buffer.from(await res.arrayBuffer()) };
    const t = await res.text();
    return { status: res.status, body: t ? JSON.parse(t) : null };
  };
  return request;
}

let failures = 0;
const check = (name, cond, extra) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + JSON.stringify(extra)?.slice(0, 400)}`);
  if (!cond) failures++;
};
const signIn = async (address) => {
  const c = client();
  const r = await c('POST', '/auth/dev-login', { email: address });
  if (r.status !== 200) throw new Error(`Không đăng nhập được ${address}: ${JSON.stringify(r.body)}`);
  return c;
};

// ---------- Tài khoản & dự án ----------
const admin = client();
let r = await admin('POST', '/auth/dev-login', { email: ADMIN });
check('admin dev-login', r.status === 200 && r.body.data.status === 'active', r);
const adminId = r.body.data.id;
r = await admin('GET', '/auth/me');
check('me', r.status === 200 && r.body.data.isAdmin === true, r);

r = await admin('POST', '/users', { emails: [email('lan'), email('minh'), ADMIN.toUpperCase()] });
check('invite users (skip existing)', r.status === 201 && r.body.data.created.length === 2 && r.body.data.skipped.length === 1, r);
const lanId = r.body.data.created.find((u) => u.email === email('lan')).id;
const minhId = r.body.data.created.find((u) => u.email === email('minh')).id;

r = await admin('POST', '/projects', { name: `Smoke ${RUN}`, key: KEY.toLowerCase() });
check('create project', r.status === 201 && r.body.data.key === KEY && r.body.data.role === 'manager', r);
const projectId = r.body.data.id;
r = await admin('POST', '/projects', { name: 'Dup', key: KEY });
check('duplicate key -> 409', r.status === 409, r);

r = await admin('GET', `/projects/${projectId}/board`);
check('board has 4 default columns', r.status === 200 && r.body.data.columns.length === 4 && r.body.data.columns[3].isDone, r);
const board = r.body.data;
const [todo, doing, review, done] = board.columns;

r = await admin('PATCH', `/boards/${board.id}`, { name: 'Bảng thử nghiệm' });
check('rename board', r.status === 200 && r.body.data.name === 'Bảng thử nghiệm', r);
r = await admin('PATCH', `/columns/${doing.id}`, { name: 'cần làm' });
check('duplicate column name -> 409', r.status === 409, r);
r = await admin('POST', `/boards/${board.id}/columns`, { name: 'Tạm hoãn' });
check('add column before done', r.status === 201 && r.body.data.position === 3, r);
const paused = r.body.data;

r = await admin('POST', `/projects/${projectId}/members`, { userId: lanId, role: 'member' });
check('add member Lan', r.status === 201 && r.body.data.role === 'member', r);
r = await admin('POST', `/projects/${projectId}/members`, { userId: minhId, role: 'viewer' });
check('viewer role no longer exists -> 400', r.status === 400, r);
r = await admin('POST', `/projects/${projectId}/members`, { userId: minhId, role: 'member' });
check('add member Minh (no tasks assigned)', r.status === 201, r);

r = await admin('POST', `/projects/${projectId}/labels`, { name: 'Gấp', color: '#ef4444' });
check('create label', r.status === 201, r);
const labelId = r.body.data.id;

// ---------- Công việc ----------
const t = [];
for (const title of ['Viết bài blog', 'Thiết kế banner', 'Chạy quảng cáo']) {
  r = await admin('POST', `/projects/${projectId}/tasks`, { title });
  t.push(r.body.data);
}
check('create tasks with sequential keys', t.map((x) => x.key).join(',') === `${KEY}-1,${KEY}-2,${KEY}-3`, t.map((x) => x?.key));
const [k1, k2, k3] = t.map((x) => x.key);


r = await admin('PATCH', `/tasks/${k1.toLowerCase()}`, {
  assigneeId: lanId,
  priority: 'urgent',
  dueDate: '2026-11-10',
  labelIds: [labelId],
  description: doc(para(text('Nội dung bài viết'))),
});
check('update task fields', r.status === 200 && r.body.data.assignee?.id === lanId && r.body.data.labels.length === 1, r);

r = await admin('POST', `/tasks/${k3}/move`, { columnId: todo.id, prevTaskId: t[0].id, nextTaskId: t[1].id });
r = await admin('GET', `/projects/${projectId}/board`);
const order = r.body.data.tasks.filter((x) => x.columnId === todo.id).map((x) => x.key).join(',');
check('reorder within column', order === `${k1},${k3},${k2}`, order);

r = await admin('POST', `/tasks/${k2}/move`, { columnId: done.id });
check('move to done sets completedAt', r.status === 200 && r.body.data.completedAt, r);
r = await admin('POST', `/tasks/${k2}/move`, { columnId: doing.id });
check('move out of done clears completedAt', r.status === 200 && r.body.data.completedAt === null, r);

r = await admin('GET', `/projects/${projectId}/tasks?q=blog&priorities=urgent,high`);
check('list + search + filter', r.status === 200 && r.body.meta.total === 1 && r.body.data[0].key === k1, r);

r = await admin('PATCH', `/tasks/${k1}`, {
  description: doc(para(text('Xem '), { type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }), {
    type: 'image',
    attrs: { src: 'https://evil.example/x.png' },
  }),
});
const descJson = JSON.stringify(r.body.data.description);
check('sanitize rich text (bad link + foreign image removed)', !descJson.includes('javascript:') && !descJson.includes('evil.example'), descJson);

// ---------- Thành viên & Người xem ----------
const lan = await signIn(email('lan'));
r = await lan('GET', '/my-tasks');
check('Lan sees my tasks', r.status === 200 && r.body.data.length === 1 && r.body.data[0].project.key === KEY, r);
r = await lan('GET', '/notifications');
check('Lan got "task_assigned" notification', r.body.data.some((n) => n.type === 'task_assigned' && n.task?.key === k1), r.body);

r = await lan('POST', `/tasks/${k1}/comments`, { body: doc(para(text('Em làm ngay, nhờ anh '), mention(adminId, 'admin'), text(' duyệt'))) });
check('member comments with mention', r.status === 201 && r.body.data.author.id === lanId, r);
const commentId = r.body.data.id;
r = await admin('GET', '/notifications?unreadOnly=true');
check('admin got "mentioned" (not duplicated as comment_added)',
  r.body.data.filter((n) => n.task?.key === k1 && ['mentioned', 'comment_added'].includes(n.type)).map((n) => n.type).join() === 'mentioned',
  r.body.data.map((n) => n.type));
r = await admin('GET', '/notifications/unread-count');
const unreadBefore = r.body.data.count;
r = await admin('POST', '/notifications/read', { all: true });
r = await admin('GET', '/notifications/unread-count');
check('mark all read', unreadBefore > 0 && r.body.data.count === 0, { unreadBefore, after: r.body });

// Quyền: Thành viên chỉ xem, bình luận và đổi trạng thái việc được giao cho mình; mọi tạo/sửa do Quản lý dự án.
r = await lan('POST', '/projects', { name: 'Dự án của Lan', key: `L${RUN}`.slice(0, 5) });
check('member cannot create project -> 403', r.status === 403, r);
r = await lan('POST', `/tasks/${k2}/comments`, { body: doc(para(text('Xen ngang'))) });
check("member cannot comment on someone else's task -> 403", r.status === 403, r);
r = await lan('POST', `/tasks/${k2}/move`, { columnId: todo.id });
check("member cannot move someone else's task -> 403", r.status === 403 && r.body.error.message.includes('được giao cho mình'), r);
r = await lan('PATCH', `/tasks/${k2}`, { columnId: todo.id });
check("member cannot change status of someone else's task -> 403", r.status === 403, r);
r = await lan('PATCH', `/tasks/${k2}`, { priority: 'high' });
check("member cannot edit others' task fields -> 403", r.status === 403, r);
r = await lan('PATCH', `/tasks/${k1}`, { priority: 'high' });
check('member cannot edit fields of own task -> 403', r.status === 403, r);
r = await lan('POST', `/tasks/${k1}/move`, { columnId: doing.id });
check('member moves own assigned task', r.status === 200 && r.body.data.columnId === doing.id, r);
r = await lan('POST', `/tasks/${k1}/move`, { columnId: done.id });
check('member cannot move own task to Done -> 403', r.status === 403 && r.body.error.message.includes('Chờ duyệt'), r);
r = await lan('PATCH', `/tasks/${k1}`, { columnId: review.id });
check('member moves own task to review', r.status === 200 && r.body.data.columnId === review.id, r);
r = await lan('POST', `/projects/${projectId}/tasks`, { title: 'Việc Lan tự tạo' });
check('member cannot create task -> 403', r.status === 403, r);
r = await admin('POST', `/tasks/${k1}/move`, { columnId: done.id });
check('manager approves task into Done', r.status === 200 && !!r.body.data.completedAt, r);
r = await lan('POST', `/tasks/${k1}/move`, { columnId: todo.id });
check('member cannot reopen Done task -> 403', r.status === 403, r);
r = await admin('POST', `/tasks/${k2}/move`, { columnId: todo.id });
check('manager/admin moves anyone\'s task', r.status === 200, r);
await admin('POST', `/tasks/${k1}/move`, { columnId: todo.id, prevTaskId: null, nextTaskId: t[2].id });

r = await lan('PATCH', `/boards/${board.id}`, { name: 'Hack' });
check('member cannot rename board -> 403', r.status === 403, r);
r = await lan('DELETE', `/tasks/${k1}`);
check('member cannot delete task -> 403', r.status === 403, r);

const minh = await signIn(email('minh'));
r = await minh('GET', `/projects/${projectId}/board`);
check('member can view whole board', r.status === 200 && r.body.meta.role === 'member', r);
r = await minh('GET', `/tasks/${k1}/comments`);
check('member can read comments on others task', r.status === 200 && r.body.data.length === 1, r);
r = await minh('PATCH', `/tasks/${k1}`, { title: 'x' });
check('non-assignee member cannot edit -> 403', r.status === 403, r);
r = await minh('POST', `/tasks/${k1}/comments`, { body: doc() });
check('non-assignee member cannot comment -> 403', r.status === 403, r);
r = await minh('PATCH', `/comments/${commentId}`, { body: doc() });
check('member cannot edit others comments -> 403', r.status === 403, r);
r = await minh('POST', `/tasks/${k1}/watch`);
check('member can watch any task', r.status === 200 && r.body.data.watching === true, r);
r = await minh('GET', `/tasks/${k1}`);
check('task detail reports watching', r.body.meta.watching === true, r.body.meta);

// ---------- Việc con ----------
r = await lan('POST', `/tasks/${k1}/subtasks`, { title: 'Lan tự thêm' });
check('member cannot create subtask -> 403', r.status === 403, r);
r = await admin('POST', `/tasks/${k1}/subtasks`, { title: 'Viết dàn ý' });
check('create subtask', r.status === 201 && r.body.data.isDone === false, r);
const subtaskId = r.body.data.id;
r = await admin('PATCH', `/subtasks/${subtaskId}`, { isDone: true });
check('tick subtask done', r.status === 200 && r.body.data.isDone === true, r);
await admin('POST', `/tasks/${k1}/subtasks`, { title: 'Chọn ảnh minh họa' });
r = await admin('GET', `/projects/${projectId}/board`);
const card = r.body.data.tasks.find((x) => x.key === k1);
check('board card shows subtask progress 1/2', card.subtaskCount === 2 && card.subtaskDoneCount === 1, card);
r = await admin('GET', `/tasks/${k1}`);
check('task detail lists subtasks in order', r.body.data.subtasks.map((s) => s.title).join('|') === 'Viết dàn ý|Chọn ảnh minh họa', r.body.data.subtasks);
r = await minh('PATCH', `/subtasks/${subtaskId}`, { isDone: false });
check('member cannot edit subtask -> 403', r.status === 403, r);

// ---------- Tệp đính kèm ----------
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const form = (name, buffer, type = 'application/octet-stream') => {
  const f = new FormData();
  f.append('files', new Blob([buffer], { type }), name);
  return f;
};
r = await lan('POST', `/tasks/${k1}/attachments`, form('ảnh bìa.png', png, 'image/png'));
check('upload png (Vietnamese filename)', r.status === 201 && r.body.data[0].fileName === 'ảnh bìa.png' && r.body.data[0].mimeType === 'image/png', r);
const attachment = r.body.data[0];
r = await lan('POST', `/tasks/${k1}/attachments`, form('virus.png', Buffer.from('MZ\x90\x00 not a png')));
check('reject fake png (magic bytes) -> 400', r.status === 400, r);
r = await lan('POST', `/tasks/${k1}/attachments`, form('script.exe', Buffer.from('MZ')));
check('reject .exe -> 400', r.status === 400, r);
try {
  r = await lan('POST', `/tasks/${k1}/attachments`, form('big.txt', Buffer.alloc(11 * 1024 * 1024, 'a')));
  check('reject > 10MB -> 400', r.status === 400 && r.body.error.code === 'UPLOAD_ERROR', r);
} catch (err) {
  // Server có thể trả 400 rồi đóng kết nối khi client vẫn đang gửi → client thấy ECONNRESET: vẫn là từ chối.
  check('reject > 10MB (connection closed early)', err.cause?.code === 'ECONNRESET' || err.cause?.code === 'EPIPE', err.cause?.code);
}
r = await minh('POST', `/tasks/${k1}/attachments`, form('note.txt', Buffer.from('hello')));
check('non-assignee member cannot upload -> 403', r.status === 403, r);
r = await minh('GET', `${attachment.url.replace('/api/v1', '')}?inline=1`, null, { raw: true });
check('member can download inline', r.status === 200 && r.buffer.equals(png) && r.headers.get('content-disposition').startsWith('inline'), r.status);
r = await admin('GET', attachment.url.replace('/api/v1', ''), null, { raw: true });
check('download as attachment with UTF-8 filename', r.headers.get('content-disposition').includes("filename*=UTF-8''%E1%BA%A3nh"), r.headers.get('content-disposition'));
const outsider = await signIn((await admin('POST', '/users', { emails: [email('out')] }), email('out')));
r = await outsider('GET', attachment.url.replace('/api/v1', ''), null, { raw: true });
check('outsider cannot download -> 404', r.status === 404, r.status);
r = await admin('PATCH', `/tasks/${k1}`, { description: doc({ type: 'image', attrs: { src: `${attachment.url}?inline=1` } }) });
check('rich text keeps image pointing to own attachment', JSON.stringify(r.body.data.description).includes(attachment.id), r.body.data.description);
r = await lan('GET', `/tasks/${k1}/attachments`);
check('list attachments', r.status === 200 && r.body.data.length === 1, r);
r = await lan('DELETE', `/attachments/${attachment.id}`);
check('uploader deletes attachment', r.status === 204, r);

// ---------- Nhắc hạn ----------
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const tomorrow = new Date(`${today}T00:00:00Z`);
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
r = await admin('POST', `/projects/${projectId}/tasks`, { title: 'Nộp báo cáo', assigneeId: lanId, dueDate: tomorrow.toISOString().slice(0, 10) });
const dueKey = r.body.data.key;
r = await admin('POST', '/notifications/run-due-reminders');
check('admin runs due reminders', r.status === 200 && r.body.data.dueSoon >= 1, r);
await admin('POST', '/notifications/run-due-reminders');
r = await lan('GET', '/notifications?pageSize=50');
check('Lan got exactly one "due_soon" (dedupe)', r.body.data.filter((n) => n.type === 'due_soon' && n.task?.key === dueKey).length === 1, r.body.data.map((n) => n.type));
r = await lan('POST', '/notifications/run-due-reminders');
check('member cannot run reminders -> 403', r.status === 403, r);

r = await lan('PATCH', '/users/me', { emailSettings: { dueSoon: false } });
check('update email settings (merge)', r.status === 200 && r.body.data.emailSettings.dueSoon === false && r.body.data.emailSettings.mentioned === true, r);

// ---------- Kho tệp tập trung ----------
const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');
r = await lan('POST', `/tasks/${k2}/attachments`, form('lén.pdf', pdf, 'application/pdf'));
check("member cannot upload to someone else's task -> 403", r.status === 403, r);
await lan('POST', `/tasks/${k1}/attachments`, form('Hợp đồng quý 4.pdf', pdf, 'application/pdf'));
await admin('POST', `/tasks/${k3}/attachments`, form('logo.png', png, 'image/png'));
r = await lan('GET', `/attachments?projectId=${projectId}`);
const libNames = r.body.data.map((a) => a.fileName);
check('file library lists files of all tasks in project', r.status === 200 && libNames.includes('Hợp đồng quý 4.pdf') && libNames.includes('logo.png'), libNames);
const contract = r.body.data.find((a) => a.fileName === 'Hợp đồng quý 4.pdf');
check('file library shows which task/project a file belongs to', contract.task.key === k1 && contract.task.project.id === projectId && contract.uploadedBy.id === lanId, contract.task);
r = await lan('GET', `/attachments?projectId=${projectId}&kind=pdf`);
check('filter by kind', r.body.data.every((a) => a.mimeType === 'application/pdf') && r.body.meta.total >= 1, r.body.data.map((a) => a.mimeType));
r = await lan('GET', `/attachments?projectId=${projectId}&mine=true`);
check('filter "my uploads"', r.body.data.every((a) => a.uploadedBy.id === lanId) && r.body.meta.total >= 1, r.body.meta);
r = await lan('GET', `/attachments?q=${encodeURIComponent('hợp đồng')}`);
check('search by file name across my projects', r.body.data.some((a) => a.id === contract.id), r.body.data.map((a) => a.fileName));
r = await minh('GET', `/attachments?projectId=${projectId}`);
check('member sees project files', r.status === 200 && r.body.meta.total >= 2, r.body.meta);
r = await outsider('GET', '/attachments');
check('outsider sees no files of this project', r.status === 200 && !r.body.data.some((a) => a.task.projectId === projectId), r.body.meta);
r = await outsider('GET', `/attachments?projectId=${projectId}`);
check('outsider filtering by project -> 404', r.status === 404, r.status);

// ---------- Lịch sử thay đổi ----------
r = await admin('GET', `/tasks/${k1}/activity`);
const actions = r.body.data.map((a) => `${a.action}:${a.field ?? ''}`);
check('activity has created + field changes', r.status === 200 && actions.includes('created:') && actions.includes('updated:assignee') && actions.includes('updated:priority') && actions.includes('updated:labels'), actions);
check('activity has subtask + attachment events', actions.includes('subtask_added:') && actions.includes('subtask_completed:') && actions.includes('attachment_added:') && actions.includes('attachment_removed:'), actions);
const assigneeLog = r.body.data.find((a) => a.field === 'assignee');
check('activity stores display values (old → new)', assigneeLog.oldValue === null && assigneeLog.newValue.startsWith('lan.') && assigneeLog.actor.id === adminId, assigneeLog);
r = await admin('GET', `/tasks/${k2}/activity`);
check('status change logged on move', r.body.data.some((a) => a.field === 'status' && a.newValue === 'Hoàn thành'), r.body.data);
r = await minh('GET', `/tasks/${k1}/activity`);
check('member can read activity', r.status === 200, r.status);
r = await outsider('GET', `/tasks/${k1}/activity`);
check('outsider cannot read activity -> 404', r.status === 404, r.status);

// ---------- Nhãn ----------
r = await admin('PATCH', `/labels/${labelId}`, { name: 'Khẩn', color: '#f97316' });
check('rename label', r.status === 200 && r.body.data.name === 'Khẩn', r);
r = await lan('POST', `/projects/${projectId}/labels`, { name: 'Hack', color: '#000000' });
check('member cannot create label -> 403', r.status === 403, r);
r = await admin('POST', `/projects/${projectId}/labels`, { name: 'Khẩn', color: '#000000' });
check('duplicate label name -> 409', r.status === 409, r);

// ---------- Sắp xếp cột ----------
r = await admin('GET', `/projects/${projectId}/board`);
const colIds = [...r.body.data.columns].sort((a, b) => a.position - b.position).map((c) => c.id);
r = await admin('PUT', `/boards/${board.id}/columns/order`, { columnIds: [colIds[1], colIds[0], ...colIds.slice(2)] });
check('reorder columns', r.status === 200 && r.body.data[0].id === colIds[1], r);
r = await lan('PUT', `/boards/${board.id}/columns/order`, { columnIds: colIds });
check('member cannot reorder columns -> 403', r.status === 403, r);

// ---------- Backlog & Sprint ----------
r = await admin('POST', `/projects/${projectId}/sprints`, {});
check('create sprint with default name', r.status === 201 && r.body.data.name === `${KEY} Sprint 1` && r.body.data.state === 'planned', r);
const sprint1 = r.body.data;
r = await admin('POST', `/projects/${projectId}/sprints`, { name: 'Sprint 2', startDate: '2026-12-10', endDate: '2026-12-01' });
check('end before start -> 400', r.status === 400, r);
r = await admin('POST', `/projects/${projectId}/sprints`, { name: 'Sprint 2' });
const sprint2 = r.body.data;
r = await lan('POST', `/projects/${projectId}/sprints`, {});
check('member cannot create sprint -> 403', r.status === 403, r);

r = await admin('GET', `/projects/${projectId}/backlog`);
const backlogKeysBefore = r.body.data.backlog.map((x) => x.key);
check('backlog lists open tasks without sprint', r.status === 200 && r.body.data.sprints.length === 2 && backlogKeysBefore.includes(k1), r.body.data);

r = await lan('POST', `/tasks/${k1}/plan`, { sprintId: sprint1.id });
check('member cannot plan sprint -> 403', r.status === 403, r);
r = await admin('POST', `/tasks/${k1}/plan`, { sprintId: sprint1.id });
check('manager plans task into sprint', r.status === 200 && r.body.data.sprintId === sprint1.id && r.body.data.sprint.name === sprint1.name, r);
r = await admin('POST', `/tasks/${k3}/plan`, { sprintId: sprint1.id, prevTaskId: null, nextTaskId: t[0].id });
r = await admin('GET', `/projects/${projectId}/backlog`);
const s1 = r.body.data.sprints.find((s) => s.id === sprint1.id);
check('plan with position (k3 above k1)', s1.tasks.map((x) => x.key).join(',') === `${k3},${k1}`, s1.tasks.map((x) => x.key));
r = await admin('GET', `/tasks/${k1}/activity`);
check('sprint change logged', r.body.data.some((a) => a.field === 'sprint' && a.newValue === sprint1.name), r.body.data.slice(0, 3));
r = await minh('POST', `/tasks/${k1}/plan`, { sprintId: null });
check('member cannot plan -> 403', r.status === 403, r);

r = await admin('POST', `/sprints/${sprint1.id}/start`, {});
check('start sprint (default 2 weeks)', r.status === 200 && r.body.data.state === 'active' && r.body.data.startDate && r.body.data.endDate, r);
r = await admin('POST', `/sprints/${sprint2.id}/start`, {});
check('only one active sprint -> 409', r.status === 409, r);
r = await admin('GET', `/projects/${projectId}/board`);
check('board shows only active sprint tasks', r.body.data.activeSprint?.id === sprint1.id && r.body.data.tasks.map((x) => x.key).sort().join() === [k1, k3].sort().join(), r.body.data.tasks.map((x) => x.key));
r = await admin('POST', `/projects/${projectId}/tasks`, { title: 'Thêm vào sprint', sprintId: sprint1.id });
check('create task directly into sprint', r.status === 201 && r.body.data.sprintId === sprint1.id, r);
const inSprintKey = r.body.data.key;
await admin('POST', `/tasks/${inSprintKey}/move`, { columnId: done.id });
r = await admin('DELETE', `/sprints/${sprint1.id}`);
check('cannot delete active sprint -> 400', r.status === 400, r);

r = await admin('POST', `/sprints/${sprint1.id}/complete`, { moveToSprintId: sprint2.id });
check('complete sprint moves unfinished to next sprint', r.status === 200 && r.body.data.moved === 2 && r.body.data.completed === 1 && r.body.data.movedTo === 'Sprint 2', r.body.data);
r = await admin('GET', `/projects/${projectId}/board`);
check('board shows all tasks when no active sprint', r.body.data.activeSprint === null && r.body.data.tasks.length >= 5, r.body.data.activeSprint);
r = await admin('GET', `/projects/${projectId}/sprints`);
check('completed sprints listed', r.body.data.some((s) => s.id === sprint1.id && s.state === 'completed'), r.body.data);
r = await admin('POST', `/tasks/${k1}/plan`, { sprintId: sprint1.id });
check('cannot plan into completed sprint -> 400', r.status === 400, r);
r = await admin('DELETE', `/sprints/${sprint2.id}`);
r = await admin('GET', `/tasks/${k1}`);
check('deleting planned sprint returns tasks to backlog', r.body.data.sprintId === null, r.body.data.sprintId);

// ---------- Lịch ----------
r = await admin('GET', `/projects/${projectId}/calendar?from=2026-11-01&to=2026-12-15`);
check('calendar returns tasks in range', r.status === 200 && r.body.data.some((x) => x.key === k1) && typeof r.body.meta.withoutDueDate === 'number', r.body);
r = await admin('GET', `/projects/${projectId}/calendar?from=2026-01-01&to=2026-12-31`);
check('calendar range too large -> 400', r.status === 400, r);

// ---------- Quy tắc khác ----------
r = await client()('POST', '/auth/dev-login', { email: 'stranger@example.com' });
check('unknown email cannot login -> 403', r.status === 403, r);
r = await outsider('GET', `/projects/${projectId}/board`);
check('outsider gets 404', r.status === 404, r);

r = await admin('DELETE', `/projects/${projectId}/members/${lanId}`);
r = await admin('GET', `/tasks/${k1}`);
check('removing member unassigns open tasks', r.body.data.assignee === null, r.body.data.assignee);

r = await admin('PATCH', `/projects/${projectId}/members/${adminId}`, { role: 'member' });
check('cannot demote last manager -> 400', r.status === 400, r);

await admin('POST', `/tasks/${k3}/move`, { columnId: paused.id });
r = await admin('DELETE', `/columns/${paused.id}`);
check('delete column with tasks needs moveTo -> 400', r.status === 400, r);
r = await admin('DELETE', `/columns/${paused.id}?moveTo=${todo.id}`);
check('delete column moving tasks', r.status === 204, r);
r = await admin('DELETE', `/columns/${done.id}?moveTo=${todo.id}`);
check('cannot delete done column -> 400', r.status === 400, r);

r = await admin('POST', '/users', { emails: [email('temp')] });
const tempId = r.body.data.created[0].id;
const temp = await signIn(email('temp'));
await admin('PATCH', `/users/${tempId}`, { status: 'disabled' });
r = await temp('GET', '/auth/me');
check('disabled user blocked immediately', r.status === 401, r);
r = await temp('POST', '/auth/refresh');
check('disabled user refresh rejected', r.status === 401, r);

r = await admin('POST', '/auth/refresh');
check('refresh rotates tokens', r.status === 200, r);

r = await admin('POST', `/projects/${projectId}/tasks`, { title: '   ' });
check('empty title -> 400 with Vietnamese message', r.status === 400 && r.body.error.details[0].message.includes('không được để trống'), r);

await admin('PATCH', `/projects/${projectId}`, { archived: true });
r = await admin('POST', `/projects/${projectId}/tasks`, { title: 'Sau lưu trữ' });
check('archived project is read-only -> 403', r.status === 403, r);
r = await admin('PATCH', `/projects/${projectId}`, { archived: false });
check('restore archived project', r.status === 200 && r.body.data.archivedAt === null, r);

// ---------- Tổng quan dự án (DSH-02) ----------
await admin('POST', `/projects/${projectId}/tasks`, { title: 'Việc trễ hạn', assigneeId: adminId, dueDate: '2020-01-01' });
r = await admin('GET', `/projects/${projectId}/overview`);
const ov = r.body.data;
check('overview totals are consistent',
  r.status === 200 && ov.total === ov.done + ov.open && ov.byColumn.reduce((s, c) => s + c.count, 0) === ov.total &&
  ov.byAssignee.reduce((s, a) => s + a.open + a.done, 0) === ov.total, ov);
check('overview counts overdue task per assignee', ov.overdue >= 1 && ov.byAssignee.find((a) => a.user?.id === adminId)?.overdue >= 1, ov.byAssignee);
r = await outsider('GET', `/projects/${projectId}/overview`);
check('outsider cannot view overview -> 404', r.status === 404, r);

console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
