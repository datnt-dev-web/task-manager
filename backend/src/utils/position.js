// Thứ tự kéo thả dùng số thực: chèn giữa 2 phần tử = trung bình cộng vị trí của chúng,
// chỉ cập nhật đúng 1 dòng. Khi khoảng cách quá nhỏ thì đánh số lại cả cột.

const GAP = 1024;
const MIN_GAP = 1e-6;

function positionBetween(prev, next) {
  if (prev == null && next == null) return GAP;
  if (prev == null) return next - GAP;
  if (next == null) return prev + GAP;
  return (prev + next) / 2;
}

const needsRebalance = (prev, next) => prev != null && next != null && next - prev < MIN_GAP;

module.exports = { GAP, positionBetween, needsRebalance };
