#!/bin/sh
# NFR-04: sao lưu CSDL hằng ngày (giữ 30 ngày) và tệp đính kèm hằng tuần (Chủ nhật).
# Cron (sudo crontab -e -u deploy):  0 2 * * * /opt/task-manager/deploy/backup.sh >> /opt/task-manager/backups/backup.log 2>&1
# Nên đồng bộ thư mục backups ra ngoài máy chủ (rclone/Google Drive/máy khác).
set -eu

APP_DIR=/opt/task-manager
BACKUP_DIR="$APP_DIR/backups"
COMPOSE="docker compose -f $APP_DIR/deploy/docker-compose.prod.yml --env-file $APP_DIR/deploy/.env.production"
STAMP=$(date +%F)

mkdir -p "$BACKUP_DIR"

$COMPOSE exec -T postgres pg_dump -U taskmanager -d taskmanager --clean --if-exists | gzip > "$BACKUP_DIR/db-$STAMP.sql.gz"
echo "$(date -Is) Đã sao lưu CSDL: db-$STAMP.sql.gz"

if [ "$(date +%u)" = "7" ]; then
  $COMPOSE exec -T api tar -czf - -C /app uploads > "$BACKUP_DIR/uploads-$STAMP.tar.gz"
  echo "$(date -Is) Đã sao lưu tệp đính kèm: uploads-$STAMP.tar.gz"
fi

find "$BACKUP_DIR" -name 'db-*.sql.gz' -mtime +30 -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime +60 -delete
