export function createPhysics(Matter, canvas, width, height) {
  const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Query, Sleeping, Events } = Matter;
  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = 1.15;
  const chips = [];
  let walls = [], pending = 0, elapsed = 0, color = 0;
  const mobile = () => width < 600;
  const cap = () => mobile() ? 50 : 120;
  const mouse = Mouse.create(canvas);
  for (const [type, handler] of [["wheel", mouse.mousewheel], ["mousewheel", mouse.mousewheel], ["DOMMouseScroll", mouse.mousewheel], ["mousemove", mouse.mousemove], ["mousedown", mouse.mousedown], ["mouseup", mouse.mouseup], ["touchstart", mouse.mousedown], ["touchmove", mouse.mousemove], ["touchend", mouse.mouseup]]) canvas.removeEventListener(type, handler);
  const drag = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.15, damping: 0.15, render: { visible: false } } });
  Composite.add(engine.world, drag);
  function release() { mouse.button = -1; drag.body = drag.constraint.bodyB = null; }
  function resize(w, h) {
    release();
    const sx = w / width, sy = h / height;
    width = w; height = h;
    Composite.remove(engine.world, walls);
    walls = [Bodies.rectangle(width / 2, height + 25, width + 160, 100, { isStatic: true }), Bodies.rectangle(-40, height / 2, 80, height * 4, { isStatic: true }), Bodies.rectangle(width + 40, height / 2, 80, height * 4, { isStatic: true })];
    Composite.add(engine.world, walls);
    while (chips.length > cap()) Composite.remove(engine.world, chips.shift());
    for (const chip of chips) {
      Body.setPosition(chip, { x: Math.max(chip.circleRadius, Math.min(width - chip.circleRadius, chip.position.x * sx)), y: Math.min(height - 25 - chip.circleRadius, chip.position.y * sy) });
      Sleeping.set(chip, false);
    }
  }
  function spawn() {
    if (chips.length >= cap()) Composite.remove(engine.world, chips.shift());
    const radius = mobile() ? 15 : Math.max(19, Math.min(26, width / 48));
    const chip = Bodies.circle(width * (.32 + Math.random() * .36), -radius * (1 + Math.random() * 2), radius, { restitution: .35, friction: .65, frictionStatic: 1, frictionAir: .025, sleepThreshold: 45 });
    chip.plugin.color = color++ % 4;
    Body.setAngle(chip, Math.random() * Math.PI * 2);
    Body.setVelocity(chip, { x: (Math.random() - .5) * 1.6, y: 0 });
    Body.setAngularVelocity(chip, (Math.random() - .5) * .04);
    chips.push(chip); Composite.add(engine.world, chip);
  }
  resize(width, height);
  return {
    chips,
    resize,
    wave() { pending = Math.min(cap(), pending + (mobile() ? 18 : 40)); },
    reset() { release(); pending = 0; elapsed = 0; Composite.remove(engine.world, chips); chips.length = 0; Engine.clear(engine); },
    step(delta) {
      elapsed += delta;
      if (pending && elapsed >= 45) { spawn(); pending--; elapsed = 0; }
      Engine.update(engine, delta);
    },
    hit(point) { return Query.point(chips, point).at(-1); },
    pointer(point, down = false) {
      Object.assign(mouse.position, point); Object.assign(mouse.absolute, point);
      if (down) mouse.button = 0;
    },
    release,
    disturb(point, dx, dy) {
      const speed = Math.min(12, Math.hypot(dx, dy));
      if (speed < 1) return;
      for (const chip of chips) {
        const distance = Math.hypot(chip.position.x - point.x, chip.position.y - point.y);
        if (distance > chip.circleRadius * 3) continue;
        Sleeping.set(chip, false);
        Body.applyForce(chip, chip.position, { x: dx / (speed || 1) * .000025 * chip.mass, y: Math.min(0, dy) / (speed || 1) * .000025 * chip.mass });
      }
    },
    dispose() { release(); Events.off(engine); Composite.clear(engine.world, false); Engine.clear(engine); Mouse.clearSourceEvents(mouse); }
  };
}
