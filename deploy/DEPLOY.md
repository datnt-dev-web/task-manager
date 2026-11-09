# Triển khai lên beta.hopphu.vn

```
Internet ──HTTPS──► Nginx máy chủ (TLS, certbot) ──► 127.0.0.1:8090 web (Nginx container: SPA + /api)
                                                            └──► api:4000 (Node.js) ──► postgres:5432
```

PostgreSQL và API không mở cổng ra ngoài. Tệp đính kèm nằm trong volume `uploads`, CSDL trong volume `pgdata`.

## 0. Bảo mật trước tiên

Mật khẩu `root` của VPS đã từng được gửi dạng văn bản → **đổi ngay** (`passwd`) trước khi làm tiếp.
Không ghi mật khẩu máy chủ, secret, mật khẩu CSDL vào repo hay chat.

## 1. Chuẩn bị máy chủ (một lần, Ubuntu 22.04/24.04)

Đăng nhập lần cuối bằng root rồi:

```bash
# Người dùng deploy dùng SSH key
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh && nano /home/deploy/.ssh/authorized_keys   # dán public key của bạn và của CI
chown -R deploy:deploy /home/deploy/.ssh && chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys
passwd deploy   # đặt mật khẩu cho sudo

# Kiểm tra đăng nhập được bằng key ở cửa sổ khác:  ssh deploy@103.175.146.251
# Rồi mới tắt đăng nhập root và đăng nhập bằng mật khẩu:
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/; s/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

# Tường lửa: chỉ 22, 80, 443
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable

# Docker + Nginx + certbot
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy
apt install -y nginx certbot python3-certbot-nginx git
```

## 2. DNS

Tạo bản ghi **A**: `beta.hopphu.vn → 103.175.146.251`. Kiểm tra: `nslookup beta.hopphu.vn`.

## 3. Mã nguồn và cấu hình (đăng nhập bằng `deploy`)

```bash
sudo mkdir -p /opt/task-manager && sudo chown deploy:deploy /opt/task-manager
git clone <URL repo> /opt/task-manager      # repo riêng; nếu private: thêm deploy key (read-only) trên GitHub
cd /opt/task-manager
cp deploy/.env.production.example deploy/.env.production
nano deploy/.env.production                  # điền POSTGRES_PASSWORD, JWT_ACCESS_SECRET, GOOGLE_CLIENT_ID, INITIAL_ADMIN_EMAIL, SMTP_*
chmod 600 deploy/.env.production
chmod +x deploy/*.sh
```

## 4. Nginx + HTTPS

```bash
sudo cp deploy/nginx/beta.hopphu.vn.conf /etc/nginx/sites-available/beta.hopphu.vn
sudo ln -s /etc/nginx/sites-available/beta.hopphu.vn /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
# Lần đầu chưa có chứng chỉ: tạm bỏ khối "listen 443" hoặc chạy certbot trước với --nginx
sudo certbot --nginx -d beta.hopphu.vn --redirect -m <email-quản-trị> --agree-tos
sudo nginx -t && sudo systemctl reload nginx
```

certbot tự gia hạn (systemd timer `certbot.timer`).

## 5. Chạy ứng dụng

```bash
./deploy/deploy.sh
```

Lần đầu API tự chạy migration và tạo Quản trị viên từ `INITIAL_ADMIN_EMAIL`. Mở https://beta.hopphu.vn, đăng nhập Google bằng email đó, vào **Quản lý nhân viên** để thêm Gmail của mọi người.

## 6. Sao lưu

```bash
crontab -e
# 0 2 * * * /opt/task-manager/deploy/backup.sh >> /opt/task-manager/backups/backup.log 2>&1
```

Nên đồng bộ `/opt/task-manager/backups` ra ngoài máy chủ (rclone lên Google Drive...).

Khôi phục CSDL: `gunzip -c backups/db-YYYY-MM-DD.sql.gz | docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production exec -T postgres psql -U taskmanager -d taskmanager`

## 7. Deploy tự động (GitHub Actions)

Workflow `.github/workflows/ci.yml` chạy kiểm thử cho mọi push/PR; push lên `main` thì SSH vào máy chủ và chạy `deploy.sh`.

1. Đưa thư mục `task-manager` thành **repo riêng** (thư mục `.github` phải nằm ở gốc repo).
2. Tạo cặp key riêng cho CI: `ssh-keygen -t ed25519 -f ci_deploy -N ""` → thêm `ci_deploy.pub` vào `~deploy/.ssh/authorized_keys`.
3. Trên GitHub: Settings → Secrets → Actions: `DEPLOY_HOST=103.175.146.251`, `DEPLOY_USER=deploy`, `DEPLOY_SSH_KEY=<nội dung ci_deploy>`.
4. Settings → Environments → tạo `production` (có thể bật "Required reviewers" để duyệt trước khi deploy).

## Lệnh hữu ích

```bash
C="docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production"
$C ps                    # trạng thái
$C logs -f --tail=100 api
$C exec api npx sequelize-cli db:migrate:status
# Chạy nhắc hạn thủ công: đăng nhập Quản trị viên rồi POST /api/v1/notifications/run-due-reminders
```

Quay lui bản trước: `git reset --hard <commit cũ> && $C up -d --build` (nếu migration mới đã chạy, khôi phục CSDL từ bản sao lưu tạo ngay trước lần deploy).
