export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function coverMapping(width, height, imageWidth, imageHeight, positionX = .72, positionY = .5) {
  if (![width, height, imageWidth, imageHeight].every(value => Number.isFinite(value) && value > 0)) return null;
  const scale = Math.max(width / imageWidth, height / imageHeight);
  const x = width / (imageWidth * scale), y = height / (imageHeight * scale);
  return { scale: [x, y], offset: [(1 - x) * positionX, (1 - y) * positionY] };
}

export function scrollState(scroll, height, aboutTop) {
  const progress = clamp(scroll / Math.max(1, height));
  const later = clamp((scroll - height) / Math.max(1, height, aboutTop - height));
  return { scale: 1 + progress * .06, lift: progress * -.025 * height,
    opacity: 1 - clamp(scroll / Math.max(1, height * .55)), veil: .72 * clamp(progress / .45) + .18 * later };
}

export function waterline(x, portrait) {
  return portrait ? .534 + .008 * x : .52 + .027 * x;
}
