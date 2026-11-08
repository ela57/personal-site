import * as THREE from '../vendor/three.module.min.js';
import { route } from './route.js';

function seeded(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

export function createWorld(renderer, invalidate) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#c2c5b7');
  scene.fog = new THREE.FogExp2('#a5b4a4', 0.007);
  scene.add(new THREE.HemisphereLight('#fff0d3', '#334636', 1.8));
  const sunlight = new THREE.DirectionalLight('#ffe1ac', 1.8);
  sunlight.position.set(-80, 90, 30);
  scene.add(sunlight);
  const palette = {
    plaster: new THREE.MeshStandardMaterial({ color: '#d8d3bd', roughness: 0.95 }),
    timber: new THREE.MeshStandardMaterial({ color: '#23392d', roughness: 0.9 }),
    stone: new THREE.MeshStandardMaterial({ color: '#667669', roughness: 1 }),
    bronze: new THREE.MeshStandardMaterial({ color: '#87674a', roughness: 0.6 }),
    glow: new THREE.MeshBasicMaterial({ color: '#e3b677' })
  };
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const box = (group, material, x, y, z, w, h, d) => {
    const mesh = new THREE.Mesh(boxGeometry, material);
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d); group.add(mesh); return mesh;
  };
  const lamps = [];
  const light = (group, x, y, z) => {
    box(group, palette.glow, x, y, z, 0.14, 0.8, 0.14);
    const lamp = new THREE.PointLight('#e3b677', 1.5, 9, 2);
    lamp.position.set(x, y, z); group.add(lamp); lamps.push(lamp);
  };
  const groupAt = (x, z) => {
    const group = new THREE.Group(); group.position.set(x, 0, z); scene.add(group); return group;
  };
  const pier = groupAt(-5, 14);
  box(pier, palette.timber, -5, 0.1, 0, 17, 0.3, 3.5);
  for (let i = 0; i < 18; i++) box(pier, palette.bronze, -13 + i * 0.9, 0.27, 0, 0.04, 0.02, 3.5);
  [-12, 1].forEach(x => box(pier, palette.timber, x, 0.1, 1.4, 0.22, 2.2, 0.22));
  light(pier, 1, 1.6, 1.4);

  const observatory = groupAt(-5, -22);
  box(observatory, palette.plaster, 0, 0.5, 0, 13, 1, 13);
  const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, 2.5, 32), palette.plaster);
  cylinder.position.y = 2.25; observatory.add(cylinder);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(4.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), palette.plaster);
  dome.position.y = 3.5; observatory.add(dome);
  // A narrow copper meridian makes the dome legible from the orbit.
  const meridian = new THREE.Mesh(new THREE.TorusGeometry(4.84, 0.07, 6, 64, Math.PI), palette.bronze);
  meridian.position.y = 3.5; observatory.add(meridian);
  box(observatory, palette.timber, -4.78, 2, 0, 0.15, 2.8, 1.6);
  light(observatory, -4.95, 2.3, -1.3);
  for (let i = 0; i < 3; i++) box(observatory, palette.plaster, -6.5 - i * 0.6, 0.4 - i * 0.15, 0, 0.6, 0.8 - i * 0.3, 4);
  observatory.scale.setScalar(0.72);

  const archive = groupAt(7, -67);
  box(archive, palette.plaster, 0, 0.35, 0, 24, 0.7, 7);
  box(archive, palette.plaster, 0, 5.8, 0, 24, 0.5, 7);
  box(archive, palette.timber, 0, 3, -2.8, 23, 5, 0.35);
  for (let i = -10; i <= 10; i += 4) box(archive, palette.plaster, i, 3, 2.7, 0.65, 5.4, 0.65);
  for (let i = 0; i < 3; i++) box(archive, palette.bronze, 0, 1.4 + i * 1.3, -2.5, 21, 0.12, 0.5);
  light(archive, -10.6, 2.5, 2.85);

  const workshop = groupAt(23, -108);
  box(workshop, palette.plaster, 0, 0.15, 0, 31, 0.3, 8);
  const roof = box(workshop, palette.timber, 0, 5.7, 0, 33, 0.4, 10);
  roof.rotation.z = -0.025;
  for (let x = -14; x <= 14; x += 7) {
    [-3, 3].forEach(z => box(workshop, palette.timber, x, 2.9, z, 0.2, 5.8, 0.2));
    box(workshop, palette.plaster, x, 1.5, 0, 3.4, 0.18, 2);
    [-1.2, 1.2].forEach(dx => box(workshop, palette.timber, x + dx, 0.7, 0, 0.16, 1.4, 1.7));
    const object = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), palette.bronze);
    object.position.set(x, 2.1, 0); workshop.add(object);
  }
  light(workshop, -14, 3, 3.1);

  const clearing = groupAt(2, -146);
  const stoneGeometry = new THREE.DodecahedronGeometry(1, 0);
  const random = seeded(57021);
  for (let i = 0; i < 14; i++) {
    const stone = new THREE.Mesh(stoneGeometry, palette.stone);
    const a = i / 14 * Math.PI * 2;
    stone.position.set(Math.cos(a) * 7, 0.35, Math.sin(a) * 7);
    stone.scale.set(0.9, 0.6, 0.7); stone.rotation.set(random(), random(), random()); clearing.add(stone);
  }
  box(clearing, palette.plaster, 0, 0.8, 0, 2.6, 0.25, 2.6);
  box(clearing, palette.timber, 0, 0.35, 0, 0.6, 0.8, 0.6);
  light(clearing, 6, 1, 0);

  const overlook = groupAt(-18, -185);
  box(overlook, palette.plaster, 0, 0.25, 0, 24, 0.5, 9);
  for (let x = -11; x <= 11; x += 2) box(overlook, palette.timber, x, 1.1, -4, 0.08, 1.7, 0.08);
  box(overlook, palette.timber, 0, 1.9, -4, 23, 0.1, 0.1);
  const brace = box(overlook, palette.timber, 5, -1.8, 0, 0.5, 6, 0.5);
  brace.rotation.z = -0.65;
  light(overlook, 10, 1.3, 3.7);

  const groundMaterial = new THREE.MeshStandardMaterial({ color: '#69755a', roughness: 1 });
  const shoreline = z => -7 - 26 * Math.exp(-(((z + 25) / 43) ** 2)) - 10 * Math.exp(-(((z + 105) / 48) ** 2));
  const groundGeometry = new THREE.PlaneGeometry(1, 1, 1, 120);
  const vertices = groundGeometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const z = -vertices.getY(i) * 330 - 95;
    const shoreX = shoreline(z);
    vertices.setXYZ(i, vertices.getX(i) < 0 ? shoreX : 110, -0.4, z);
  }
  groundGeometry.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeometry, groundMaterial); scene.add(ground);

  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: { phase: { value: 0 } },
    vertexShader: `varying vec3 p; void main(){p=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec3 p; uniform float phase;
      void main(){float d=clamp((-p.z+35.)/300.,0.,1.);
        float ripple=sin(p.x*2.4+sin(p.z*.75)+phase)*sin(p.z*2.8+phase*.4)*.018;
        vec3 col=mix(vec3(.19,.31,.27),vec3(.67,.71,.63),d);
        float sun=exp(-pow((p.x+65.+sin(p.z*.7)*1.2)/7.,2.))*.19;
        gl_FragColor=vec4(col+ripple+sun*vec3(1.,.76,.43),1.);}`
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(320, 500, 1, 1), waterMaterial);
  water.rotation.x = -Math.PI / 2; water.position.set(-95, -0.48, -100); scene.add(water);

  const trailPoints = [], uvs = [], indices = [];
  for (let i = 0; i <= 320; i++) {
    const t = i / 320, p = route.getPoint(t), tangent = route.getTangent(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(1.8);
    [-1, 1].forEach((side, j) => { trailPoints.push(p.x + normal.x * side, -0.35, p.z + normal.z * side); uvs.push(j, t * 80); });
    if (i < 320) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const ribbon = new THREE.BufferGeometry();
  ribbon.setAttribute('position', new THREE.Float32BufferAttribute(trailPoints, 3));
  ribbon.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); ribbon.setIndex(indices); ribbon.computeVertexNormals();
  const trailMaterial = new THREE.MeshStandardMaterial({ color: '#aaa087', roughness: 1, side: THREE.DoubleSide });
  scene.add(new THREE.Mesh(ribbon, trailMaterial));

  // Reused simple geometry keeps the shoreline inexpensive and avoids scenic rock sprites.
  const shore = new THREE.InstancedMesh(stoneGeometry, palette.stone, 90);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 90; i++) {
    const z = 40 - i * 3;
    dummy.position.set(shoreline(z) + (random() - 0.5) * 3, -0.25, z);
    dummy.scale.set(0.7 + random() * 1.6, 0.4 + random(), 0.6 + random());
    dummy.rotation.set(random(), random() * 6, random()); dummy.updateMatrix(); shore.setMatrixAt(i, dummy.matrix);
  }
  scene.add(shore);

  // Batch architectural parts by shared material instead of one draw per beam.
  scene.updateMatrixWorld(true);
  for (const material of Object.values(palette)) {
    const parts = [];
    scene.traverse(object => { if (object.geometry === boxGeometry && object.material === material) parts.push(object); });
    if (!parts.length) continue;
    const batch = new THREE.InstancedMesh(boxGeometry, material, parts.length);
    parts.forEach((part, i) => { batch.setMatrixAt(i, part.matrixWorld); part.removeFromParent(); });
    scene.add(batch);
  }

  const loader = new THREE.TextureLoader();
  const jobs = [];
  const load = (name, apply) => {
    jobs.push(new Promise(resolve => {
      loader.load(`assets/journey/${name}.webp`, texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        apply(texture); invalidate(); resolve({ name, loaded: true });
      }, undefined, () => resolve({ name, loaded: false }));
    }));
  };
  load('sky-mountains', texture => {
    texture.wrapS = THREE.MirroredRepeatWrapping; texture.repeat.x = 2;
    const material = new THREE.MeshBasicMaterial({ map: texture, fog: false, depthWrite: false, transparent: true });
    material.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        diffuseColor.a *= 1.-smoothstep(.87,1.,vMapUv.y);`);
    };
    material.side = THREE.BackSide;
    const sky = new THREE.Mesh(new THREE.CylinderGeometry(800, 800, 520, 64, 1, true), material);
    sky.position.set(0, 135, -80); scene.add(sky);
  });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(1000, 24, 12), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 p;void main(){float h=clamp(normalize(p).y*2.,0.,1.);gl_FragColor=vec4(mix(vec3(.72,.75,.67),vec3(.81,.77,.65),h),1.);}'
  }));
  skyDome.position.z = -80; scene.add(skyDome);
  load('moss-ground', texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(28, 55);
    groundMaterial.map = texture; groundMaterial.needsUpdate = true;
    const trailMap = texture.clone(); trailMap.needsUpdate = true; trailMap.repeat.set(1, 1);
    trailMaterial.map = trailMap; trailMaterial.needsUpdate = true;
  });
  const cardGeometry = new THREE.PlaneGeometry(1, 1);
  const cardMaterial = texture => {
    const material = new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.22, side: THREE.DoubleSide, color: '#d5dfcd' });
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
        #ifdef USE_INSTANCING
          vec3 center = (modelMatrix * instanceMatrix * vec4(0.,0.,0.,1.)).xyz;
          vec3 direction = cameraPosition - center;
          vec3 right = normalize(vec3(direction.z,0.,-direction.x));
          vec3 billboard = center + right * position.x * length(instanceMatrix[0].xyz)
            + vec3(0.,position.y * length(instanceMatrix[1].xyz),0.);
          vec4 mvPosition = viewMatrix * vec4(billboard,1.);
          gl_Position = projectionMatrix * mvPosition;
        #else
          #include <project_vertex>
        #endif`);
    };
    return material;
  };
  const protectedArea = (x, z) => [
    [-5, -22, 12], [7, -67, 17], [23, -108, 22], [2, -146, 12], [-18, -185, 17]
  ].some(([cx, cz, radius]) => Math.hypot(x - cx, z - cz) < radius);
  ['trees-spruce', 'trees-mixed', 'trees-pine'].forEach((name, kind) => load(name, texture => {
    const transforms = [];
    const rng = seeded(110 + kind);
    for (let i = 0; i < 55; i++) {
      const t = rng(), p = route.getPoint(t), tangent = route.getTangent(t);
      const side = i % 2 ? -1 : 1;
      const distance = 7 + rng() * 22;
      const x = p.x - tangent.z * side * distance, z = p.z + tangent.x * side * distance;
      if (x < shoreline(z) + 2 || (z > -2 && x < 3) || protectedArea(x, z)) continue;
      const height = 9 + rng() * 9;
      // Some mixed/pine art has a scenic base; bury that portion below the ground.
      const buried = name === 'trees-mixed' ? 0.22 : 0.08;
      dummy.position.set(x, height * (0.5 - buried) - 0.4, z);
      dummy.rotation.set(0, (rng() - 0.5) * 0.9, 0);
      dummy.scale.set(height * texture.image.width / texture.image.height, height, 1);
      dummy.updateMatrix(); transforms.push(dummy.matrix.clone());
    }
    const cards = new THREE.InstancedMesh(cardGeometry, cardMaterial(texture), transforms.length);
    transforms.forEach((matrix, i) => cards.setMatrixAt(i, matrix)); scene.add(cards);
  }));
  load('ridge-treeline', texture => {
    for (let i = 0; i < 5; i++) {
      const ridge = new THREE.Mesh(new THREE.PlaneGeometry(100, 38), cardMaterial(texture));
      ridge.position.set(-200 + i * 90, 4, -280); scene.add(ridge);
    }
  });
  load('foreground-ferns', texture => {
    const ferns = new THREE.InstancedMesh(cardGeometry, cardMaterial(texture), 40);
    for (let i = 0; i < 40; i++) {
      const t = i / 40, p = route.getPoint(t), tangent = route.getTangent(t);
      const side = i % 2 ? -1 : 1;
      dummy.position.set(p.x - tangent.z * side * 3.7, 0.5, p.z + tangent.x * side * 3.7);
      if (dummy.position.x < shoreline(dummy.position.z)) dummy.position.x = shoreline(dummy.position.z) + 2;
      dummy.rotation.set(0, Math.atan2(-tangent.x, -tangent.z), 0);
      dummy.scale.set(3.7, 2.7, 1); dummy.updateMatrix(); ferns.setMatrixAt(i, dummy.matrix);
    }
    scene.add(ferns);
  });
  load('foreground-branch', texture => {
    [0.39, 0.79].forEach(t => {
      const p = route.getPoint(t), tangent = route.getTangent(t);
      const branch = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), cardMaterial(texture));
      branch.position.set(p.x - tangent.z * 7, 6.5, p.z + tangent.x * 7);
      branch.rotation.y = Math.atan2(-tangent.x, -tangent.z); scene.add(branch);
    });
  });
  return { scene, ready: Promise.all(jobs), update(progress) {
    waterMaterial.uniforms.phase.value = progress * 12;
    const active = Math.min(lamps.length - 1, Math.floor(progress * lamps.length));
    lamps.forEach((lamp, i) => { lamp.visible = i === active; });
  } };
}
