const palette = [
  { face: "#252521", rim: "#11110F", inlay: "#F2EFE7" },
  { face: "#E9E5DA", rim: "#BDB6A5", inlay: "#3B3A36" },
  { face: "#8E1F1F", rim: "#5C1616", inlay: "#F2EFE7" },
  { face: "#3F5E4A", rim: "#263C2E", inlay: "#F2EFE7" }
];

function face(ctx, chip, y, rim) {
  const { position, circleRadius: r, angle, plugin } = chip, colors = palette[plugin.color];
  ctx.save(); ctx.translate(position.x, y); ctx.rotate(angle); ctx.scale(1, .78);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = rim ? colors.rim : colors.face; ctx.fill();
  if (!rim) {
    for (let i = 0; i < 8; i++) {
      ctx.save(); ctx.rotate(i * Math.PI / 4);
      ctx.fillStyle = colors.inlay; ctx.fillRect(r * .76, -r * .09, r * .24, r * .18); ctx.restore();
    }
    ctx.strokeStyle = colors.inlay; ctx.globalAlpha = .48; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, r * .64, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = .2; ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, r * .9, Math.PI * 1.1, Math.PI * 1.65); ctx.stroke();
  }
  ctx.restore();
}

export function drawScene(ctx, width, height, chips) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#E9E5DA"; ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(21,21,19,.16)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, height - 25); ctx.lineTo(width, height - 25); ctx.stroke();
  const sorted = [...chips].sort((a, b) => a.position.y - b.position.y);
  for (const chip of sorted) {
    const { position: p, circleRadius: r } = chip;
    for (let i = 2; i >= 0; i--) {
      ctx.fillStyle = `rgba(21,21,19,${.025 + (2 - i) * .012})`;
      ctx.beginPath(); ctx.ellipse(p.x, p.y + r * .7, r * (.95 + i * .08), r * (.18 + i * .04), 0, 0, Math.PI * 2); ctx.fill();
    }
    face(ctx, chip, chip.position.y + chip.circleRadius * .2, true);
    face(ctx, chip, chip.position.y, false);
  }
}

export function staticPile(width, height) {
  const r = width < 600 ? 15 : 24, chips = [];
  for (let row = 0; row < 3; row++) {
    const count = 9 - row * 2;
    for (let i = 0; i < count; i++) chips.push({ position: { x: width / 2 + (i - (count - 1) / 2) * r * 2.02, y: height - 25 - r - row * r * 1.75 }, circleRadius: r, angle: (i + row) * .35, plugin: { color: (i + row) % 4 } });
  }
  return chips;
}
