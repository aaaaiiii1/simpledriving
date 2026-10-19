/**
 * Desert sandbox world construction:
 * Sculpted dune terrain, surrounding canyon mesas, village architecture,
 * destructible props, moving targets, and lighting rig.
 */

import * as THREE from 'three';
import {
  getTerrainHeight,
  type DestructibleProp,
  type PropType,
} from './physics';
import {
  materials,
  createCactusMesh,
  createCrateMesh,
  createFenceMesh,
  createRoadSignMesh,
  createBarrelMesh,
  createSwingingGate,
  createTumbleweedMesh,
  createDonkeyMesh,
  createAdobeBuilding,
  createWaterTower,
  createRockMesh,
} from './models';

export interface WorldObjects {
  terrainMesh: THREE.Mesh;
  props: DestructibleProp[];
  propMeshes: Map<string, THREE.Group | THREE.Mesh>;
  gates: { prop: DestructibleProp; pivot: THREE.Group }[];
  donkeyLegs?: THREE.Mesh[];
  donkeyMesh?: THREE.Group;
  windmillBlades?: THREE.Group;
  sunLight: THREE.DirectionalLight;
}

export function buildDesertWorld(scene: THREE.Scene): WorldObjects {
  const props: DestructibleProp[] = [];
  const propMeshes = new Map<string, THREE.Group | THREE.Mesh>();
  const gates: { prop: DestructibleProp; pivot: THREE.Group }[] = [];

  // 1. Procedural Sculpted Dune Terrain
  const terrainSize = 160;
  const segments = 70;
  const terrainGeom = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
  terrainGeom.rotateX(-Math.PI / 2);

  const posAttr = terrainGeom.attributes.position;
  const colorAttr = new Float32Array(posAttr.count * 3);

  const sandColor = new THREE.Color(0xe6b37a);
  const duneCrestColor = new THREE.Color(0xf4c896);
  const roadColor = new THREE.Color(0xd29d63);

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = getTerrainHeight(x, z);
    posAttr.setY(i, y);

    // Color gradient based on elevation and road proximity
    const distToCenter = Math.hypot(x, z);
    const isRoad = Math.abs(x) < 4.5 && Math.abs(z) < 45;

    let vertexColor = sandColor.clone();
    if (isRoad) {
      vertexColor.lerp(roadColor, 0.7);
    } else if (y > 2.5) {
      vertexColor.lerp(duneCrestColor, Math.min(1, (y - 2.5) / 4));
    }

    colorAttr[i * 3] = vertexColor.r;
    colorAttr[i * 3 + 1] = vertexColor.g;
    colorAttr[i * 3 + 2] = vertexColor.b;
  }

  terrainGeom.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));
  terrainGeom.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
  });

  const terrainMesh = new THREE.Mesh(terrainGeom, terrainMat);
  terrainMesh.receiveShadow = true;
  terrainMesh.name = 'desert_terrain';
  scene.add(terrainMesh);

  // 2. Encircling Red Rock Bluffs / Mesas (Natural Perimeters)
  const cliffCount = 22;
  for (let i = 0; i < cliffCount; i++) {
    const angle = (i / cliffCount) * Math.PI * 2;
    const dist = 60 + Math.sin(i * 3) * 6;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const scale = 3.5 + Math.random() * 2.5;

    const rock = createRockMesh(scale);
    rock.position.set(x, getTerrainHeight(x, z) - 1.0, z);
    rock.rotation.y = Math.random() * Math.PI * 2;
    rock.rotation.z = (Math.random() - 0.5) * 0.2;
    scene.add(rock);
  }

  // 3. Desert Village (Dust Creek)
  // Adobe houses arranged around town street
  const townCenter = { x: 8, z: 8 };

  // Building 1: Saloon with shaded porch
  const saloon = createAdobeBuilding(8.5, 4.8, 6.5, true);
  saloon.position.set(townCenter.x - 9, getTerrainHeight(townCenter.x - 9, townCenter.z - 4), townCenter.z - 4);
  saloon.rotation.y = Math.PI / 2;
  scene.add(saloon);

  // Building 2: General Store
  const store = createAdobeBuilding(7, 4.2, 5.5, true);
  store.position.set(townCenter.x + 9, getTerrainHeight(townCenter.x + 9, townCenter.z - 4), townCenter.z - 4);
  store.rotation.y = -Math.PI / 2;
  scene.add(store);

  // Building 3: Adobe Residence
  const house = createAdobeBuilding(6.5, 3.8, 5, false);
  house.position.set(townCenter.x - 9, getTerrainHeight(townCenter.x - 9, townCenter.z + 8), townCenter.z + 8);
  house.rotation.y = Math.PI / 2;
  scene.add(house);

  // Landmark: Tall Water Tower
  const waterTower = createWaterTower();
  waterTower.position.set(townCenter.x + 10, getTerrainHeight(townCenter.x + 10, townCenter.z + 9), townCenter.z + 9);
  scene.add(waterTower);

  // Landmark: Windmill
  const windmillBase = new THREE.Group();
  const mastGeom = new THREE.CylinderGeometry(0.3, 0.7, 7, 6);
  const mast = new THREE.Mesh(mastGeom, materials.woodDark);
  mast.position.y = 3.5;
  mast.castShadow = true;
  windmillBase.add(mast);

  const windmillBlades = new THREE.Group();
  windmillBlades.position.set(0, 7, 0.4);
  for (let b = 0; b < 4; b++) {
    const bladeGeom = new THREE.BoxGeometry(0.3, 2.2, 0.04);
    const blade = new THREE.Mesh(bladeGeom, materials.woodPlank);
    blade.position.y = 1.1;
    blade.rotation.z = (b * Math.PI) / 2;
    windmillBlades.add(blade);
  }
  windmillBase.add(windmillBlades);
  windmillBase.position.set(townCenter.x - 14, getTerrainHeight(townCenter.x - 14, townCenter.z - 12), townCenter.z - 12);
  scene.add(windmillBase);

  // 4. Swinging Ranch Entrance Gate
  const gateX = townCenter.x;
  const gateZ = townCenter.z - 14;
  const gateY = getTerrainHeight(gateX, gateZ);
  const { root: gateRoot, gatePivot } = createSwingingGate();
  gateRoot.position.set(gateX, gateY, gateZ);
  scene.add(gateRoot);

  const gateProp: DestructibleProp = {
    id: 'town_gate_1',
    type: 'GATE',
    x: gateX,
    y: gateY,
    z: gateZ,
    vx: 0,
    vz: 0,
    rotationY: 0,
    angularV: 0,
    radius: 1.8,
    mass: 120,
    isBroken: false,
    health: 999,
    maxHealth: 999,
    hingeX: gateX - 1.2,
    hingeZ: gateZ,
    gateAngle: 0,
    gateAngularV: 0,
    points: 150,
    name: 'Ranch Gate',
  };
  props.push(gateProp);
  propMeshes.set(gateProp.id, gateRoot);
  gates.push({ prop: gateProp, pivot: gatePivot });

  // 5. Destructible Saguaro Cacti (Scattered & in clusters)
  const cactusPositions: [number, number][] = [
    [-18, 12], [-22, 16], [-14, 25], [-28, 5], [-32, -10],
    [-24, -22], [-12, -30], [-5, -24], [18, -26], [28, -18],
    [32, -4], [25, 18], [22, 28], [12, 34], [-6, 38],
    [-35, 20], [38, 12], [-20, -12], [4, -36], [35, -28],
    [-8, 18], [15, 12], [-18, 30], [28, 8], [36, 28],
  ];

  cactusPositions.forEach((pos, idx) => {
    const x = pos[0];
    const z = pos[1];
    const y = getTerrainHeight(x, z);

    const mesh = createCactusMesh();
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    const scale = 0.85 + Math.random() * 0.35;
    mesh.scale.set(scale, scale, scale);
    scene.add(mesh);

    const prop: DestructibleProp = {
      id: `cactus_${idx}`,
      type: 'CACTUS',
      x,
      y,
      z,
      vx: 0,
      vz: 0,
      rotationY: mesh.rotation.y,
      angularV: 0,
      radius: 0.9 * scale,
      mass: 90,
      isBroken: false,
      health: 35,
      maxHealth: 35,
      points: 100,
      name: 'Saguaro Cactus',
    };
    props.push(prop);
    propMeshes.set(prop.id, mesh);
  });

  // 6. Wooden Crates
  const cratePositions: [number, number][] = [
    [townCenter.x - 4, townCenter.z + 1],
    [townCenter.x - 3.2, townCenter.z + 2.5],
    [townCenter.x + 5, townCenter.z + 2],
    [townCenter.x + 4.5, townCenter.z + 3.6],
    [-10, 2], [14, -6], [-5, 14], [-16, -8],
    [20, 4], [24, 2], [-22, 10], [6, 22],
  ];

  cratePositions.forEach((pos, idx) => {
    const x = pos[0];
    const z = pos[1];
    const y = getTerrainHeight(x, z);

    const mesh = createCrateMesh();
    mesh.position.set(x, y, z);
    mesh.rotation.y = (Math.random() - 0.5) * 0.6;
    scene.add(mesh);

    const prop: DestructibleProp = {
      id: `crate_${idx}`,
      type: 'CRATE',
      x,
      y,
      z,
      vx: 0,
      vz: 0,
      rotationY: mesh.rotation.y,
      angularV: 0,
      radius: 1.0,
      mass: 60,
      isBroken: false,
      health: 25,
      maxHealth: 25,
      points: 75,
      name: 'Wooden Crate',
    };
    props.push(prop);
    propMeshes.set(prop.id, mesh);
  });

  // 7. Wooden Fences
  const fencePositions: { pos: [number, number]; rot: number }[] = [
    { pos: [townCenter.x - 6, townCenter.z - 12], rot: 0 },
    { pos: [townCenter.x - 3.6, townCenter.z - 12], rot: 0 },
    { pos: [townCenter.x + 3.6, townCenter.z - 12], rot: 0 },
    { pos: [townCenter.x + 6, townCenter.z - 12], rot: 0 },
    { pos: [-12, -18], rot: 0.4 },
    { pos: [-9.8, -19], rot: 0.4 },
    { pos: [14, 18], rot: -0.3 },
    { pos: [16.2, 17.3], rot: -0.3 },
  ];

  fencePositions.forEach((item, idx) => {
    const [x, z] = item.pos;
    const y = getTerrainHeight(x, z);

    const mesh = createFenceMesh();
    mesh.position.set(x, y, z);
    mesh.rotation.y = item.rot;
    scene.add(mesh);

    const prop: DestructibleProp = {
      id: `fence_${idx}`,
      type: 'FENCE',
      x,
      y,
      z,
      vx: 0,
      vz: 0,
      rotationY: item.rot,
      angularV: 0,
      radius: 1.2,
      mass: 80,
      isBroken: false,
      health: 30,
      maxHealth: 30,
      points: 60,
      name: 'Ranch Fence',
    };
    props.push(prop);
    propMeshes.set(prop.id, mesh);
  });

  // 8. Road Warning Signs
  const signPositions: { pos: [number, number]; type: 'CURVE' | 'SPEED' | 'CAUTION' }[] = [
    { pos: [0, -18], type: 'CAUTION' },
    { pos: [3.5, -5], type: 'SPEED' },
    { pos: [-3.5, 24], type: 'CURVE' },
    { pos: [18, -12], type: 'CAUTION' },
    { pos: [-24, 8], type: 'SPEED' },
  ];

  signPositions.forEach((item, idx) => {
    const [x, z] = item.pos;
    const y = getTerrainHeight(x, z);

    const mesh = createRoadSignMesh(item.type);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    const prop: DestructibleProp = {
      id: `sign_${idx}`,
      type: 'SIGN',
      x,
      y,
      z,
      vx: 0,
      vz: 0,
      rotationY: 0,
      angularV: 0,
      radius: 0.7,
      mass: 40,
      isBroken: false,
      health: 20,
      maxHealth: 20,
      points: 90,
      name: 'Road Sign',
    };
    props.push(prop);
    propMeshes.set(prop.id, mesh);
  });

  // 9. Metal Barrels (Pushable / Destructible)
  const barrelPositions: [number, number][] = [
    [townCenter.x - 2, townCenter.z + 4],
    [townCenter.x - 1, townCenter.z + 4.8],
    [townCenter.x + 6, townCenter.z - 1],
    [-8, 8], [12, -14], [-14, -4],
  ];

  barrelPositions.forEach((pos, idx) => {
    const x = pos[0];
    const z = pos[1];
    const y = getTerrainHeight(x, z);

    const mesh = createBarrelMesh();
    mesh.position.set(x, y, z);
    scene.add(mesh);

    const prop: DestructibleProp = {
      id: `barrel_${idx}`,
      type: 'BARREL',
      x,
      y,
      z,
      vx: 0,
      vz: 0,
      rotationY: 0,
      angularV: 0,
      radius: 0.65,
      mass: 50,
      isBroken: false,
      health: 45,
      maxHealth: 45,
      points: 80,
      name: 'Oil Drum',
    };
    props.push(prop);
    propMeshes.set(prop.id, mesh);
  });

  // 10. Rolling Tumbleweeds (Moving Targets)
  for (let i = 0; i < 5; i++) {
    const startX = -35 + i * 15;
    const startZ = -30 + (i % 3) * 20;
    const mesh = createTumbleweedMesh();
    const y = getTerrainHeight(startX, startZ) + 0.6;
    mesh.position.set(startX, y, startZ);
    scene.add(mesh);

    const prop: DestructibleProp = {
      id: `tumbleweed_${i}`,
      type: 'TUMBLEWEED',
      x: startX,
      y,
      z: startZ,
      vx: 1.5 + Math.random() * 2,
      vz: 0.8 + Math.random() * 1.5,
      rotationY: 0,
      angularV: 2,
      radius: 0.7,
      mass: 8,
      isBroken: false,
      health: 15,
      maxHealth: 15,
      points: 120,
      name: 'Tumbleweed',
    };
    props.push(prop);
    propMeshes.set(prop.id, mesh);
  }

  // 11. Desert Donkey / Mule (Moving Critter Target)
  const donkeyStart = { x: -6, z: -10 };
  const { root: donkeyRoot, legs: donkeyLegs } = createDonkeyMesh();
  donkeyRoot.position.set(donkeyStart.x, getTerrainHeight(donkeyStart.x, donkeyStart.z), donkeyStart.z);
  scene.add(donkeyRoot);

  const donkeyProp: DestructibleProp = {
    id: 'desert_donkey',
    type: 'DONKEY',
    x: donkeyStart.x,
    y: getTerrainHeight(donkeyStart.x, donkeyStart.z),
    z: donkeyStart.z,
    vx: 0,
    vz: 0,
    rotationY: 0,
    angularV: 0,
    radius: 1.4,
    mass: 250,
    isBroken: false,
    health: 999, // Doesn't die, gives bonus points on rodeo bump!
    maxHealth: 999,
    aiTimer: 2.0,
    aiTargetAngle: 0,
    points: 250,
    name: 'Wild Desert Donkey',
  };
  props.push(donkeyProp);
  propMeshes.set(donkeyProp.id, donkeyRoot);

  // 12. Lighting Setup
  const sunLight = new THREE.DirectionalLight(0xffecd0, 1.8);
  sunLight.position.set(45, 60, 35);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 140;
  const d = 45;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight);

  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0xdfab6f, 0.7);
  scene.add(hemiLight);

  // Horizon warm fog
  scene.fog = new THREE.Fog(0xeac094, 55, 145);

  return {
    terrainMesh,
    props,
    propMeshes,
    gates,
    donkeyLegs,
    donkeyMesh: donkeyRoot,
    windmillBlades,
    sunLight,
  };
}
