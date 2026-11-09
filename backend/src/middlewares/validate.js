/**
 * Kiểm tra params/query/body bằng schema Zod.
 * Kết quả đã chuẩn hóa nằm ở req.valid.{params,query,body} (Express 5 không cho ghi đè req.query).
 */
module.exports = (schemas) => (req, _res, next) => {
  req.valid = req.valid || {};
  for (const key of ['params', 'query', 'body']) {
    if (schemas[key]) req.valid[key] = schemas[key].parse(req[key] ?? {});
  }
  next();
};
