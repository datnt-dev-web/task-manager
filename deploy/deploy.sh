#!/bin/sh
# Cập nhật bản mới trên máy chủ. CI gọi script này qua SSH; cũng có thể chạy tay.
#   /opt/task-manager/deploy/deploy.sh
set -eu

APP_DIR=/opt/task-manager
cd "$APP_DIR"
COMPOSE="docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production"

echo "==> Sao lưu CSDL trước khi cập nhật (spec 8.1: sao lưu trước migration)"
if $COMPOSE ps --status running postgres >/dev/null 2>&1; then
  ./deploy/backup.sh
fi

echo "==> Lấy mã nguồn mới"
git fetch --prune origin
git reset --hard origin/main

echo "==> Build và khởi động lại (migration chạy tự động khi API khởi động)"
$COMPOSE up -d --build --remove-orphans

echo "==> Chờ API sẵn sàng"
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8090/api/v1/health >/dev/null; then
    echo "API OK"
    docker image prune -f >/dev/null
    exit 0
  fi
  sleep 2
done

echo "API không phản hồi sau 60 giây — xem log: $COMPOSE logs --tail=100 api" >&2
exit 1
