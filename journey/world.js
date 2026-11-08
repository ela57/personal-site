import * as THREE from '../vendor/three.module.min.js';
import { route } from './route.js';

function seeded(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

function canvasTexture(draw, width = 256, height = width) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function earthVariation(material, moss) {
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 earthPosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nearthPosition = (modelMatrix * vec4(position,1.)).xyz;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 earthPosition;
      float earthHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float earthNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(earthHash(i),earthHash(i+vec2(1.,0.)),f.x),
          mix(earthHash(i+vec2(0.,1.)),earthHash(i+vec2(1.,1.)),f.x),f.y);}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        float groundPatch=earthNoise(earthPosition.xz*.075)*.75+earthNoise(earthPosition.xz*.24)*.25;
        ${moss ? `float detail=dot(diffuseColor.rgb,vec3(.299,.587,.114));
          diffuseColor.rgb=mix(diffuseColor.rgb*vec3(.7,1.7,.65),detail*vec3(.75,1.3,.48),.5);` : ''}
        diffuseColor.rgb*=mix(.85,1.65,groundPatch);`);
  };
  material.customProgramCacheKey = () => `earth-${moss}`;
}

export function createWorld(renderer, invalidate) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#c2c5b7');
  scene.fog = new THREE.FogExp2('#a5b4a4', 0.007);
  scene.add(new THREE.HemisphereLight('#f4f0df', '#7c8a67', 2));
  const sunlight = new THREE.DirectionalLight('#f9cf96', 2.4);
  sunlight.position.set(-90, 26, 40);
  scene.add(sunlight);
  const palette = {
    plaster: new THREE.MeshStandardMaterial({ color: '#ddd7c7', roughness: 0.78 }),
    timber: new THREE.MeshStandardMaterial({ color: '#695744', roughness: 0.86 }),
    weathered: new THREE.MeshStandardMaterial({ color: '#cbc3ac', roughness: 0.92 }),
    interior: new THREE.MeshStandardMaterial({ color: '#3b3027', roughness: 0.9, emissive: '#da8e3d', emissiveIntensity: 0.16 }),
    stone: new THREE.MeshStandardMaterial({ color: '#667669', roughness: 1 }),
    bronze: new THREE.MeshStandardMaterial({ color: '#87674a', roughness: 0.6 }),
    glow: new THREE.MeshBasicMaterial({ color: '#e3b677' })
  };
  const grain = canvasTexture((ctx, w, h) => {
    const random = seeded(448);
    ctx.fillStyle = '#9a8b72'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      ctx.strokeStyle = i % 3 ? '#6a604842' : '#ded2b94d'; ctx.lineWidth = 0.3 + random();
      const y = random() * h; ctx.beginPath(); ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * .3, y + random() * 5, w * .7, y - random() * 5, w, y); ctx.stroke();
    }
  }, 256, 128);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping; grain.repeat.set(3, 1);
  palette.weathered.map = grain;
  const profile = new THREE.Shape();
  profile.moveTo(-.48, -.48); profile.lineTo(.48, -.48); profile.lineTo(.48, .48); profile.lineTo(-.48, .48); profile.closePath();
  const boxGeometry = new THREE.ExtrudeGeometry(profile, { depth: .96, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 1, steps: 1 });
  boxGeometry.translate(0, 0, -.48);
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
  box(pier, palette.weathered, -5, 0.1, 0, 17, 0.3, 3.5);
  for (let i = 0; i < 18; i++) box(pier, palette.timber, -13 + i * 0.9, 0.27, 0, 0.035, 0.015, 3.5);
  [-12, 1].forEach(x => box(pier, palette.weathered, x, 0.1, 1.4, 0.22, 2.2, 0.22));
  light(pier, 1, 1.6, 1.4);

  const observatory = groupAt(-5, -22);
  box(observatory, palette.plaster, 0, 0.5, 0, 13, 1, 13);
  const doorAngle = Math.PI * 1.5, halfOpening = .18;
  const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, 2.15, 48, 1, true, doorAngle + halfOpening, Math.PI * 2 - halfOpening * 2), palette.plaster);
  cylinder.position.y = 2.075; observatory.add(cylinder);
  const lintel = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, .35, 48), palette.plaster);
  lintel.position.y = 3.325; observatory.add(lintel);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(4.8, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), palette.plaster);
  dome.position.y = 3.5; observatory.add(dome);
  // A narrow copper meridian makes the dome legible from the orbit.
  const meridian = new THREE.Mesh(new THREE.TorusGeometry(4.84, 0.07, 6, 64, Math.PI), palette.bronze);
  meridian.position.y = 3.5; observatory.add(meridian);
  box(observatory, palette.interior, -3.65, 2.05, 0, .08, 2.1, 1.8);
  box(observatory, palette.weathered, -4.15, 1.025, 0, 1.35, .05, 1.75);
  [-.86, .86].forEach(z => {
    box(observatory, palette.plaster, -4.6, 2.05, z, .32, 2.1, .22);
    box(observatory, palette.interior, -4.1, 2.05, z, 1.15, 2.1, .12);
  });
  light(observatory, -3.85, 2.3, .5);
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
  const roof = box(workshop, palette.timber, 0, 5.7, 0, 33, 0.18, 10);
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

  const groundMaterial = new THREE.MeshStandardMaterial({ color: '#edf1cf', roughness: 1, bumpScale: .12 });
  earthVariation(groundMaterial, true);
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
  const trailMaterial = new THREE.MeshStandardMaterial({ color: '#b7a181', roughness: 1, side: THREE.DoubleSide });
  earthVariation(trailMaterial, false);
  const shoulder = ribbon.clone();
  const shoulderVertices = shoulder.attributes.position;
  for (let i = 0; i <= 320; i++) {
    const p = route.getPoint(i / 320);
    for (let j = 0; j < 2; j++) {
      const n = i * 2 + j;
      shoulderVertices.setXYZ(n, p.x + (shoulderVertices.getX(n) - p.x) * 1.2, -.375, p.z + (shoulderVertices.getZ(n) - p.z) * 1.2);
    }
  }
  shoulder.computeVertexNormals();
  scene.add(new THREE.Mesh(shoulder, new THREE.MeshStandardMaterial({ color: '#d0bf9c', roughness: 1, side: THREE.DoubleSide })));
  scene.add(new THREE.Mesh(ribbon, trailMaterial));

  const shadowMap = canvasTexture((ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, w * .1, w / 2, h / 2, w * .5);
    gradient.addColorStop(0, '#102419b3'); gradient.addColorStop(.55, '#10241975'); gradient.addColorStop(1, '#10241900');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
  });
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false });
  [[-10, 14, 23, 8], [-5, -22, 17, 17], [7, -67, 31, 13], [23, -108, 39, 15], [2, -146, 7, 7], [-18, -185, 29, 14]].forEach(([x, z, w, d]) => {
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w, d), shadowMaterial);
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(x, z < -180 ? -.45 : -.32, z); scene.add(shadow);
  });

  const mistMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `varying vec2 mistUv;varying vec3 mistPosition;
      void main(){mistUv=uv;vec4 p=modelMatrix*instanceMatrix*vec4(position,1.);mistPosition=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
    fragmentShader: `varying vec2 mistUv;varying vec3 mistPosition;
      void main(){vec2 p=mistUv*2.-1.;float edge=pow(max(0.,1.-dot(p,p)),2.);
        float wisps=.65+.35*sin(mistPosition.x*.31+sin(mistPosition.z*.23));
        float d=distance(cameraPosition,mistPosition);float fade=smoothstep(4.,18.,d)*(1.-smoothstep(40.,80.,d));
        gl_FragColor=vec4(.69,.77,.67,edge*wisps*fade*.19);}`
  });
  const mist = new THREE.InstancedMesh(new THREE.PlaneGeometry(24, 30).rotateX(-Math.PI / 2), mistMaterial, 18);
  const mistTransform = new THREE.Object3D();
  for (let i = 0; i < 18; i++) {
    const p = route.getPoint(i / 18);
    mistTransform.position.set(p.x + (i % 2 ? 6 : -6), .15 + (i % 3) * .22, p.z);
    mistTransform.updateMatrix(); mist.setMatrixAt(i, mistTransform.matrix);
  }
  scene.add(mist);

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
    texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping; texture.repeat.set(32, 65);
    groundMaterial.map = texture; groundMaterial.bumpMap = texture; groundMaterial.needsUpdate = true;
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
  const grassMap = canvasTexture((ctx, w, h) => {
    const random = seeded(275);
    for (let i = 0; i < 55; i++) {
      const x = random() * w, tipX = x + (random() - .5) * 70, tipY = h * (.12 + random() * .6);
      ctx.fillStyle = ['#8c9c58', '#667c41', '#a0ac6c', '#586b3c'][i % 4];
      ctx.beginPath(); ctx.moveTo(x - 3, h); ctx.quadraticCurveTo(x + 9, tipY + 30, tipX, tipY);
      ctx.quadraticCurveTo(x + 15, tipY + 50, x + 4, h); ctx.fill();
    }
  });
  const coverRandom = seeded(828);
  const grass = new THREE.InstancedMesh(cardGeometry, cardMaterial(grassMap), 240);
  for (let i = 0; i < 240; i++) {
    const t = coverRandom(), p = route.getPoint(t), tangent = route.getTangent(t);
    const offset = (i % 2 ? -1 : 1) * (2.2 + coverRandom() * 7);
    const height = .3 + coverRandom() * .65;
    const x = p.x - tangent.z * offset, z = p.z + tangent.x * offset;
    dummy.position.set(Math.max(shoreline(z) + .5, x), height / 2 - .4, z);
    dummy.rotation.set(0, coverRandom() * Math.PI, 0); dummy.scale.set(height * 1.6, height, 1);
    dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
  }
  scene.add(grass);
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
    const ferns = new THREE.InstancedMesh(cardGeometry, cardMaterial(texture), 90);
    const fernRandom = seeded(983);
    for (let i = 0; i < 90; i++) {
      const t = i / 90, p = route.getPoint(t), tangent = route.getTangent(t);
      const side = i % 2 ? -1 : 1;
      const offset = 2.8 + fernRandom() * 2, height = 1.2 + fernRandom() * 1.4;
      dummy.position.set(p.x - tangent.z * side * offset, height / 2 - .4, p.z + tangent.x * side * offset);
      if (dummy.position.x < shoreline(dummy.position.z)) dummy.position.x = shoreline(dummy.position.z) + 2;
      dummy.rotation.set(0, Math.atan2(-tangent.x, -tangent.z), 0);
      dummy.scale.set(height * 1.37, height, 1); dummy.updateMatrix(); ferns.setMatrixAt(i, dummy.matrix);
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
