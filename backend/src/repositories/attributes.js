// Các tập trường dùng chung khi trả dữ liệu liên kết, tránh lộ trường nhạy cảm.
const USER_PUBLIC_ATTRIBUTES = ['id', 'email', 'fullName', 'avatarUrl', 'title', 'status'];
const USER_BRIEF_ATTRIBUTES = ['id', 'fullName', 'avatarUrl', 'email'];
const LABEL_ATTRIBUTES = ['id', 'name', 'color'];

module.exports = { USER_PUBLIC_ATTRIBUTES, USER_BRIEF_ATTRIBUTES, LABEL_ATTRIBUTES };
