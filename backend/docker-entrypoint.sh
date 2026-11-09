#!/bin/sh
# Chạy migration (và seeder lần đầu — seeder được ghi nhận nên không chạy lại) rồi khởi động API.
set -e

echo "Đang chạy migration..."
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

exec node src/server.js
