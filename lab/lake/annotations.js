export function imagePoint(point, image, frame) {
  if (!image || !frame || !Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)) return [0, 0];
  return [image.left - frame.left + point[0] * image.width, image.top - frame.top + point[1] * image.height];
}
