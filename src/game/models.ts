/**
 * Procedural low-poly 3D models for desert driving sandbox.
 * Composite 3-12 part THREE.Group models with flat shading and PBR roughness variation.
 */

import * as THREE from 'three';

// Shared materials cache for performance and batching
export const materials = {
  sand: new THREE.MeshStandardMaterial({
    color: 0xdfab6f,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
  }),
  rock: new THREE.MeshStandardMaterial({
    color: 0xb26b48,
    roughness: 0.9,
    metalness: 0.1,
    flatShading: true,
  }),
  cliff: new THREE.MeshStandardMaterial({
    color: 0x934f32,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
  }),
  cactus: new THREE.MeshStandardMaterial({
    color: 0x3d7a44,
    roughness: 0.75,
    metalness: 0.05,
    flatShading: true,
  }),
  cactusFlower: new THREE.MeshStandardMaterial({
    color: 0xe63946,
    roughness: 0.6,
    metalness: 0.1,
    flatShading: true,
  }),
  woodPlank: new THREE.MeshStandardMaterial({
    color: 0xa87147,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  }),
  woodDark: new THREE.MeshStandardMaterial({
    color: 0x6e4528,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
  }),
  metalDark: new THREE.MeshStandardMaterial({
    color: 0x2b2d30,
    roughness: 0.45,
    metalness: 0.8,
    flatShading: true,
  }),
  metalChrome: new THREE.MeshStandardMaterial({
    color: 0xd0d5dd,
    roughness: 0.25,
    metalness: 0.9,
    flatShading: true,
  }),
  tireRubber: new THREE.MeshStandardMaterial({
    color: 0x1f2124,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
  }),
  rimSilver: new THREE.MeshStandardMaterial({
    color: 0xdcdfe4,
    roughness: 0.3,
    metalness: 0.85,
    flatShading: true,
  }),
  glassTinted: new THREE.MeshStandardMaterial({
    color: 0x1a2634,
    roughness: 0.15,
    metalness: 0.4,
    flatShading: true,
  }),
  headlightLens: new THREE.MeshStandardMaterial({
    color: 0xfff0b3,
    emissive: 0xffd166,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.1,
    flatShading: true,
  }),
  taillightLens: new THREE.MeshStandardMaterial({
    color: 0xd90429,
    emissive: 0xef233c,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.1,
    flatShading: true,
  }),
  adobeWall: new THREE.MeshStandardMaterial({
    color: 0xdeaa78,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
  }),
  adobeTrim: new THREE.MeshStandardMaterial({
    color: 0xc87d4a,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
  }),
  barrelRed: new THREE.MeshStandardMaterial({
    color: 0xc13e2d,
    roughness: 0.5,
    metalness: 0.35,
    flatShading: true,
  }),
  signYellow: new THREE.MeshStandardMaterial({
    color: 0xf4a261,
    roughness: 0.6,
    metalness: 0.2,
    flatShading: true,
  }),
  tumbleweedTwig: new THREE.MeshStandardMaterial({
    color: 0xa98c68,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
  }),
  donkeyHide: new THREE.MeshStandardMaterial({
    color: 0x736c64,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
  }),
  donkeyMuzzle: new THREE.MeshStandardMaterial({
    color: 0xded8ce,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  }),
};

export const CAR_COLORS = [
  { name: 'Desert Ochre', hex: 0xe09f3e },
  { name: 'Baja Cyan', hex: 0x06d6a0 },
  { name: 'Rust Orange', hex: 0xd9531e },
  { name: 'Sandstorm Red', hex: 0xb5179e },
  { name: 'Outlaw Black', hex: 0x222228 },
  { name: 'Vaquero Blue', hex: 0x118ab2 },
];

/**
 * Creates the hero player car.
 * A composite 11-part low-poly desert cruiser buggy.
 */
export function createPlayerCar(colorHex = 0xe09f3e) {
  const root = new THREE.Group();
  root.name = 'player_car';

  // Body paint material
  const paintMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.35,
    metalness: 0.45,
    flatShading: true,
  });

  // 1. Main chassis / lower hull
  const chassisGeom = new THREE.BoxGeometry(2.1, 0.65, 4.2);
  const chassis = new THREE.Mesh(chassisGeom, paintMat);
  chassis.position.y = 0.65;
  chassis.castShadow = true;
  root.add(chassis);

  // 2. Cabin / Cockpit with angled roof
  const cabinGeom = new THREE.BoxGeometry(1.8, 0.7, 2.0);
  const cabin = new THREE.Mesh(cabinGeom, paintMat);
  cabin.position.set(0, 1.25, -0.3);
  cabin.castShadow = true;
  root.add(cabin);

  // 3. Windshield and side windows
  const windshieldGeom = new THREE.BoxGeometry(1.7, 0.55, 0.1);
  const windshield = new THREE.Mesh(windshieldGeom, materials.glassTinted);
  windshield.position.set(0, 1.22, 0.72);
  windshield.rotation.x = 0.25;
  root.add(windshield);

  const rearGlassGeom = new THREE.BoxGeometry(1.7, 0.45, 0.1);
  const rearGlass = new THREE.Mesh(rearGlassGeom, materials.glassTinted);
  rearGlass.position.set(0, 1.22, -1.32);
  rearGlass.rotation.x = -0.25;
  root.add(rearGlass);

  // 4. Front brush guard / bull bar
  const brushBarGeom = new THREE.BoxGeometry(2.0, 0.45, 0.35);
  const brushBar = new THREE.Mesh(brushBarGeom, materials.metalDark);
  brushBar.position.set(0, 0.65, 2.2);
  brushBar.castShadow = true;
  root.add(brushBar);

  // 5. Dual round headlights
  const headlightGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.2, 8);
  headlightGeom.rotateX(Math.PI / 2);

  const leftLight = new THREE.Mesh(headlightGeom, materials.headlightLens);
  leftLight.position.set(-0.7, 0.8, 2.12);
  root.add(leftLight);

  const rightLight = new THREE.Mesh(headlightGeom, materials.headlightLens);
  rightLight.position.set(0.7, 0.8, 2.12);
  root.add(rightLight);

  // 6. Dual red taillights
  const taillightGeom = new THREE.BoxGeometry(0.35, 0.16, 0.1);
  const leftTail = new THREE.Mesh(taillightGeom, materials.taillightLens);
  leftTail.position.set(-0.8, 0.8, -2.12);
  root.add(leftTail);

  const rightTail = new THREE.Mesh(taillightGeom, materials.taillightLens);
  rightTail.position.set(0.8, 0.8, -2.12);
  root.add(rightTail);

  // 7. Roll cage roof rack
  const rackGeom = new THREE.BoxGeometry(1.6, 0.08, 1.8);
  const rack = new THREE.Mesh(rackGeom, materials.metalDark);
  rack.position.set(0, 1.65, -0.3);
  root.add(rack);

  // 8. Dual side exhaust pipes
  const pipeGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6);
  pipeGeom.rotateX(Math.PI / 2);

  const leftPipe = new THREE.Mesh(pipeGeom, materials.metalChrome);
  leftPipe.position.set(-1.12, 0.45, -0.8);
  root.add(leftPipe);

  const rightPipe = new THREE.Mesh(pipeGeom, materials.metalChrome);
  rightPipe.position.set(1.12, 0.45, -0.8);
  root.add(rightPipe);

  // 9. Wheels & Suspension Struts
  // Create 4 distinct wheel groups so front wheels can steer and spin
  function createWheelMesh() {
    const wheelGroup = new THREE.Group();
    // Knobby tire
    const tireGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.42, 10);
    tireGeom.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeom, materials.tireRubber);
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Silver rim
    const rimGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.44, 8);
    rimGeom.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeom, materials.rimSilver);
    wheelGroup.add(rim);

    // Center hub cap
    const capGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.46, 6);
    capGeom.rotateZ(Math.PI / 2);
    const cap = new THREE.Mesh(capGeom, materials.metalDark);
    wheelGroup.add(cap);

    return { wheelGroup, tire };
  }

  // Front-Left
  const fl = createWheelMesh();
  const frontLeftPivot = new THREE.Group();
  frontLeftPivot.position.set(-1.18, 0.48, 1.35);
  frontLeftPivot.add(fl.wheelGroup);
  root.add(frontLeftPivot);

  // Front-Right
  const fr = createWheelMesh();
  const frontRightPivot = new THREE.Group();
  frontRightPivot.position.set(1.18, 0.48, 1.35);
  frontRightPivot.add(fr.wheelGroup);
  root.add(frontRightPivot);

  // Rear-Left
  const rl = createWheelMesh();
  rl.wheelGroup.position.set(-1.18, 0.48, -1.35);
  root.add(rl.wheelGroup);

  // Rear-Right
  const rr = createWheelMesh();
  rr.wheelGroup.position.set(1.18, 0.48, -1.35);
  root.add(rr.wheelGroup);

  // 10. Contact Shadow Disc
  const shadowGeom = new THREE.CircleGeometry(2.2, 12);
  shadowGeom.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x1a0f08,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeom, shadowMat);
  shadow.position.y = 0.05;
  root.add(shadow);

  return {
    group: root,
    paintMaterial: paintMat,
    frontLeftPivot,
    frontRightPivot,
    wheelMeshes: [fl.tire, fr.tire, rl.tire, rr.tire],
  };
}

/**
 * Creates a low-poly Saguaro cactus
 */
export function createCactusMesh() {
  const group = new THREE.Group();
  group.name = 'cactus';

  // Main trunk
  const trunkGeom = new THREE.CylinderGeometry(0.35, 0.42, 3.4, 8);
  const trunk = new THREE.Mesh(trunkGeom, materials.cactus);
  trunk.position.y = 1.7;
  trunk.castShadow = true;
  group.add(trunk);

  // Trunk top cap
  const capGeom = new THREE.SphereGeometry(0.35, 8, 6);
  const topCap = new THREE.Mesh(capGeom, materials.cactus);
  topCap.position.y = 3.4;
  topCap.castShadow = true;
  group.add(topCap);

  // Left arm (horizontal branch + vertical rise)
  const arm1HGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.8, 6);
  arm1HGeom.rotateZ(Math.PI / 2);
  const arm1H = new THREE.Mesh(arm1HGeom, materials.cactus);
  arm1H.position.set(-0.6, 1.8, 0);
  arm1H.castShadow = true;
  group.add(arm1H);

  const arm1VGeom = new THREE.CylinderGeometry(0.24, 0.24, 1.4, 6);
  const arm1V = new THREE.Mesh(arm1VGeom, materials.cactus);
  arm1V.position.set(-0.95, 2.4, 0);
  arm1V.castShadow = true;
  group.add(arm1V);

  // Right arm (lower)
  const arm2HGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.7, 6);
  arm2HGeom.rotateZ(-Math.PI / 2);
  const arm2H = new THREE.Mesh(arm2HGeom, materials.cactus);
  arm2H.position.set(0.55, 1.3, 0);
  arm2H.castShadow = true;
  group.add(arm2H);

  const arm2VGeom = new THREE.CylinderGeometry(0.22, 0.22, 1.1, 6);
  const arm2V = new THREE.Mesh(arm2VGeom, materials.cactus);
  arm2V.position.set(0.85, 1.75, 0);
  arm2V.castShadow = true;
  group.add(arm2V);

  // Desert cactus red bloom flower on top
  const flowerGeom = new THREE.ConeGeometry(0.18, 0.25, 5);
  const flower = new THREE.Mesh(flowerGeom, materials.cactusFlower);
  flower.position.set(0, 3.8, 0);
  group.add(flower);

  return group;
}

/**
 * Creates a wooden crate with reinforced corner brackets
 */
export function createCrateMesh() {
  const group = new THREE.Group();
  group.name = 'crate';

  // Main wooden box
  const boxGeom = new THREE.BoxGeometry(1.4, 1.4, 1.4);
  const box = new THREE.Mesh(boxGeom, materials.woodPlank);
  box.position.y = 0.7;
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);

  // Cross brace planks
  const braceGeom = new THREE.BoxGeometry(1.44, 0.2, 0.1);
  const brace1 = new THREE.Mesh(braceGeom, materials.woodDark);
  brace1.position.set(0, 0.7, 0.71);
  brace1.rotation.z = Math.PI / 4;
  group.add(brace1);

  const brace2 = new THREE.Mesh(braceGeom, materials.woodDark);
  brace2.position.set(0, 0.7, -0.71);
  brace2.rotation.z = -Math.PI / 4;
  group.add(brace2);

  // Metal corner brackets
  const bracketGeom = new THREE.BoxGeometry(0.25, 0.25, 0.25);
  const b1 = new THREE.Mesh(bracketGeom, materials.metalDark);
  b1.position.set(0.65, 1.35, 0.65);
  group.add(b1);
  const b2 = new THREE.Mesh(bracketGeom, materials.metalDark);
  b2.position.set(-0.65, 1.35, 0.65);
  group.add(b2);

  return group;
}

/**
 * Creates a wooden fence segment
 */
export function createFenceMesh() {
  const group = new THREE.Group();
  group.name = 'fence';

  // 2 Vertical posts
  const postGeom = new THREE.BoxGeometry(0.25, 1.4, 0.25);
  const post1 = new THREE.Mesh(postGeom, materials.woodDark);
  post1.position.set(-1.1, 0.7, 0);
  post1.castShadow = true;
  group.add(post1);

  const post2 = new THREE.Mesh(postGeom, materials.woodDark);
  post2.position.set(1.1, 0.7, 0);
  post2.castShadow = true;
  group.add(post2);

  // 2 Horizontal fence rails
  const railGeom = new THREE.BoxGeometry(2.4, 0.2, 0.12);
  const railTop = new THREE.Mesh(railGeom, materials.woodPlank);
  railTop.position.set(0, 1.05, 0.05);
  railTop.castShadow = true;
  group.add(railTop);

  const railBottom = new THREE.Mesh(railGeom, materials.woodPlank);
  railBottom.position.set(0, 0.45, 0.05);
  railBottom.castShadow = true;
  group.add(railBottom);

  return group;
}

/**
 * Creates a road warning sign
 */
export function createRoadSignMesh(type: 'CURVE' | 'SPEED' | 'CAUTION' = 'CAUTION') {
  const group = new THREE.Group();
  group.name = 'road_sign';

  // Metal post
  const poleGeom = new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6);
  const pole = new THREE.Mesh(poleGeom, materials.metalDark);
  pole.position.y = 1.2;
  pole.castShadow = true;
  group.add(pole);

  // Diamond warning sign plate
  const signGeom = new THREE.BoxGeometry(1.0, 1.0, 0.06);
  const signMat = type === 'SPEED' ? materials.adobeTrim : materials.signYellow;
  const plate = new THREE.Mesh(signGeom, signMat);
  plate.position.set(0, 2.0, 0.06);
  plate.rotation.z = type === 'SPEED' ? 0 : Math.PI / 4;
  plate.castShadow = true;
  group.add(plate);

  // Sign icon marking
  const markGeom = new THREE.BoxGeometry(0.4, 0.4, 0.08);
  const mark = new THREE.Mesh(markGeom, materials.metalDark);
  mark.position.set(0, 2.0, 0.08);
  group.add(mark);

  return group;
}

/**
 * Creates an industrial metal barrel
 */
export function createBarrelMesh() {
  const group = new THREE.Group();
  group.name = 'barrel';

  // Main cylinder drum
  const drumGeom = new THREE.CylinderGeometry(0.48, 0.48, 1.3, 10);
  const drum = new THREE.Mesh(drumGeom, materials.barrelRed);
  drum.position.y = 0.65;
  drum.castShadow = true;
  group.add(drum);

  // Reinforcing rings
  const ringGeom = new THREE.TorusGeometry(0.49, 0.04, 6, 12);
  ringGeom.rotateX(Math.PI / 2);

  const ring1 = new THREE.Mesh(ringGeom, materials.metalDark);
  ring1.position.y = 0.45;
  group.add(ring1);

  const ring2 = new THREE.Mesh(ringGeom, materials.metalDark);
  ring2.position.y = 0.85;
  group.add(ring2);

  return group;
}

/**
 * Creates a swinging gate with post and hinged door panel
 */
export function createSwingingGate() {
  const root = new THREE.Group();
  root.name = 'swinging_gate';

  // Static post (Hinge anchor)
  const postGeom = new THREE.BoxGeometry(0.35, 1.8, 0.35);
  const post = new THREE.Mesh(postGeom, materials.woodDark);
  post.position.set(-1.2, 0.9, 0);
  post.castShadow = true;
  root.add(post);

  // Swinging door panel anchored at hinge pivot
  const gatePivot = new THREE.Group();
  gatePivot.position.set(-1.2, 0, 0); // hinge at post

  const doorGeom = new THREE.BoxGeometry(2.3, 1.2, 0.12);
  const door = new THREE.Mesh(doorGeom, materials.woodPlank);
  door.position.set(1.15, 0.9, 0); // centered offset from hinge
  door.castShadow = true;
  gatePivot.add(door);

  // Gate diagonal brace
  const braceGeom = new THREE.BoxGeometry(2.4, 0.15, 0.14);
  const brace = new THREE.Mesh(braceGeom, materials.woodDark);
  brace.position.set(1.15, 0.9, 0);
  brace.rotation.z = 0.35;
  gatePivot.add(brace);

  root.add(gatePivot);

  return { root, gatePivot };
}

/**
 * Creates a rolling tumbleweed
 */
export function createTumbleweedMesh() {
  const group = new THREE.Group();
  group.name = 'tumbleweed';

  const geom = new THREE.DodecahedronGeometry(0.65, 1);
  const mesh = new THREE.Mesh(geom, materials.tumbleweedTwig);
  mesh.castShadow = true;
  group.add(mesh);

  // Few wire-like protruding twigs
  for (let i = 0; i < 4; i++) {
    const twigGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 4);
    twigGeom.rotateX(Math.random() * Math.PI);
    twigGeom.rotateY(Math.random() * Math.PI);
    const twig = new THREE.Mesh(twigGeom, materials.tumbleweedTwig);
    group.add(twig);
  }

  return group;
}

/**
 * Creates an animated desert donkey / mule moving target
 */
export function createDonkeyMesh() {
  const root = new THREE.Group();
  root.name = 'donkey';

  // Torso
  const bodyGeom = new THREE.BoxGeometry(0.9, 0.9, 1.6);
  const body = new THREE.Mesh(bodyGeom, materials.donkeyHide);
  body.position.y = 1.2;
  body.castShadow = true;
  root.add(body);

  // Neck & Head
  const neckGeom = new THREE.BoxGeometry(0.5, 0.8, 0.5);
  neckGeom.rotateX(-0.4);
  const neck = new THREE.Mesh(neckGeom, materials.donkeyHide);
  neck.position.set(0, 1.7, 0.85);
  neck.castShadow = true;
  root.add(neck);

  const headGeom = new THREE.BoxGeometry(0.55, 0.55, 0.8);
  const head = new THREE.Mesh(headGeom, materials.donkeyHide);
  head.position.set(0, 2.05, 1.1);
  head.castShadow = true;
  root.add(head);

  // White muzzle
  const muzzleGeom = new THREE.BoxGeometry(0.48, 0.45, 0.35);
  const muzzle = new THREE.Mesh(muzzleGeom, materials.donkeyMuzzle);
  muzzle.position.set(0, 1.95, 1.55);
  root.add(muzzle);

  // Long donkey ears
  const earGeom = new THREE.BoxGeometry(0.12, 0.65, 0.18);
  const leftEar = new THREE.Mesh(earGeom, materials.donkeyHide);
  leftEar.position.set(-0.25, 2.5, 0.95);
  leftEar.rotation.z = -0.25;
  root.add(leftEar);

  const rightEar = new THREE.Mesh(earGeom, materials.donkeyHide);
  rightEar.position.set(0.25, 2.5, 0.95);
  rightEar.rotation.z = 0.25;
  root.add(rightEar);

  // 4 Legs
  const legGeom = new THREE.BoxGeometry(0.22, 1.0, 0.22);
  const flLeg = new THREE.Mesh(legGeom, materials.donkeyHide);
  flLeg.position.set(-0.35, 0.5, 0.6);
  flLeg.castShadow = true;
  root.add(flLeg);

  const frLeg = new THREE.Mesh(legGeom, materials.donkeyHide);
  frLeg.position.set(0.35, 0.5, 0.6);
  frLeg.castShadow = true;
  root.add(frLeg);

  const rlLeg = new THREE.Mesh(legGeom, materials.donkeyHide);
  rlLeg.position.set(-0.35, 0.5, -0.6);
  rlLeg.castShadow = true;
  root.add(rlLeg);

  const rrLeg = new THREE.Mesh(legGeom, materials.donkeyHide);
  rrLeg.position.set(0.35, 0.5, -0.6);
  rrLeg.castShadow = true;
  root.add(rrLeg);

  return { root, legs: [flLeg, frLeg, rlLeg, rrLeg] };
}

/**
 * Creates a low-poly adobe western village building
 */
export function createAdobeBuilding(width = 7, height = 4.5, depth = 6, hasPorch = false) {
  const group = new THREE.Group();
  group.name = 'adobe_house';

  // Main clay block
  const wallGeom = new THREE.BoxGeometry(width, height, depth);
  const wall = new THREE.Mesh(wallGeom, materials.adobeWall);
  wall.position.y = height / 2;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  // Roof parapet rim
  const parapetGeom = new THREE.BoxGeometry(width + 0.3, 0.4, depth + 0.3);
  const parapet = new THREE.Mesh(parapetGeom, materials.adobeTrim);
  parapet.position.y = height + 0.15;
  parapet.castShadow = true;
  group.add(parapet);

  // Protruding wooden roof vigas (log beams)
  const vigaCount = Math.floor(width / 1.4);
  const vigaGeom = new THREE.CylinderGeometry(0.12, 0.12, depth + 0.8, 6);
  vigaGeom.rotateX(Math.PI / 2);
  for (let i = 0; i < vigaCount; i++) {
    const viga = new THREE.Mesh(vigaGeom, materials.woodDark);
    const xPos = -width / 2 + 0.9 + i * 1.4;
    viga.position.set(xPos, height - 0.4, 0);
    viga.castShadow = true;
    group.add(viga);
  }

  // Wooden door frame & door
  const doorGeom = new THREE.BoxGeometry(1.4, 2.4, 0.15);
  const door = new THREE.Mesh(doorGeom, materials.woodPlank);
  door.position.set(0, 1.2, depth / 2 + 0.08);
  group.add(door);

  // Shuttered window
  const winGeom = new THREE.BoxGeometry(1.2, 1.2, 0.15);
  const win = new THREE.Mesh(winGeom, materials.woodDark);
  win.position.set(-width / 3.2, 2.2, depth / 2 + 0.08);
  group.add(win);

  // Optional front shaded porch
  if (hasPorch) {
    const porchRoofGeom = new THREE.BoxGeometry(width, 0.15, 2.5);
    const porchRoof = new THREE.Mesh(porchRoofGeom, materials.woodPlank);
    porchRoof.position.set(0, 3.2, depth / 2 + 1.25);
    porchRoof.castShadow = true;
    group.add(porchRoof);

    // 2 Wooden porch pillars
    const pillarGeom = new THREE.BoxGeometry(0.2, 3.2, 0.2);
    const p1 = new THREE.Mesh(pillarGeom, materials.woodDark);
    p1.position.set(-width / 2 + 0.4, 1.6, depth / 2 + 2.3);
    p1.castShadow = true;
    group.add(p1);

    const p2 = new THREE.Mesh(pillarGeom, materials.woodDark);
    p2.position.set(width / 2 - 0.4, 1.6, depth / 2 + 2.3);
    p2.castShadow = true;
    group.add(p2);
  }

  return group;
}

/**
 * Creates a tall wooden water tower (landmark silhouette)
 */
export function createWaterTower() {
  const group = new THREE.Group();
  group.name = 'water_tower';

  // 4 Trestle stilts
  const stiltGeom = new THREE.BoxGeometry(0.3, 7, 0.3);
  const s1 = new THREE.Mesh(stiltGeom, materials.woodDark);
  s1.position.set(-1.8, 3.5, -1.8);
  s1.castShadow = true;
  group.add(s1);

  const s2 = new THREE.Mesh(stiltGeom, materials.woodDark);
  s2.position.set(1.8, 3.5, -1.8);
  s2.castShadow = true;
  group.add(s2);

  const s3 = new THREE.Mesh(stiltGeom, materials.woodDark);
  s3.position.set(-1.8, 3.5, 1.8);
  s3.castShadow = true;
  group.add(s3);

  const s4 = new THREE.Mesh(stiltGeom, materials.woodDark);
  s4.position.set(1.8, 3.5, 1.8);
  s4.castShadow = true;
  group.add(s4);

  // Water tank platform
  const platGeom = new THREE.BoxGeometry(4.6, 0.3, 4.6);
  const plat = new THREE.Mesh(platGeom, materials.woodPlank);
  plat.position.y = 7.15;
  plat.castShadow = true;
  group.add(plat);

  // Octagonal wooden water tank
  const tankGeom = new THREE.CylinderGeometry(2.1, 2.1, 3.2, 8);
  const tank = new THREE.Mesh(tankGeom, materials.woodDark);
  tank.position.y = 8.85;
  tank.castShadow = true;
  group.add(tank);

  // Conical roof
  const roofGeom = new THREE.ConeGeometry(2.5, 1.2, 8);
  const roof = new THREE.Mesh(roofGeom, materials.adobeTrim);
  roof.position.y = 11.0;
  roof.castShadow = true;
  group.add(roof);

  return group;
}

/**
 * Creates a desert rock boulder / outcrop
 */
export function createRockMesh(scale = 1.0) {
  const geom = new THREE.DodecahedronGeometry(1.6 * scale, 1);
  const mesh = new THREE.Mesh(geom, materials.rock);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.y = 1.1 * scale;
  return mesh;
}
