import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialCarState,
  updateCarPhysics,
  getTerrainHeight,
  getTerrainNormal,
  resolveCircleCollision,
  updatePropsAndCollisions,
  updateDebris,
  type CarInputs,
  type DestructibleProp,
  type GameScoreState,
  type DebrisPiece,
} from './physics.ts';

test('Terrain height calculation produces finite values', () => {
  const h1 = getTerrainHeight(0, 0);
  const h2 = getTerrainHeight(20, -15);
  const h3 = getTerrainHeight(55, 55);

  assert.equal(typeof h1, 'number');
  assert.equal(isNaN(h1), false);
  assert.equal(typeof h2, 'number');
  assert.equal(isNaN(h2), false);
  // Outer borders have elevation
  assert.ok(h3 > h1, 'outer rim should be elevated');
});

test('Terrain normal returns normalized 3D vector', () => {
  const normal = getTerrainNormal(10, 10);
  const len = Math.hypot(normal.nx, normal.ny, normal.nz);
  assert.ok(Math.abs(len - 1.0) < 0.01, 'normal vector must be unit length');
  assert.ok(normal.ny > 0, 'normal upward vector must be positive');
});

test('Car accelerates forward and updates velocity and speed', () => {
  const car = createInitialCarState(0, -26);
  const inputs: CarInputs = {
    forward: 1,
    steer: 0,
    handbrake: false,
    boost: false,
    horn: false,
  };

  const initialZ = car.z;
  // Step simulation for 0.5 seconds
  for (let i = 0; i < 10; i++) {
    updateCarPhysics(car, inputs, 0.05);
  }

  assert.ok(car.speed > 0, 'speed should be greater than 0');
  assert.ok(car.vz > 0, 'vz forward direction should be positive');
  assert.ok(car.z > initialZ, 'car should have advanced along Z axis');
});

test('Steering updates car heading and rolls suspension', () => {
  const car = createInitialCarState(0, -26);
  car.speed = 15;
  car.vz = 15;

  const inputs: CarInputs = {
    forward: 1,
    steer: 1, // steer right
    handbrake: false,
    boost: false,
    horn: false,
  };

  updateCarPhysics(car, inputs, 0.1);

  assert.ok(car.steerAngle > 0, 'steer angle should turn right');
  assert.ok(car.heading !== 0, 'car heading should change when moving and steering');
});

test('Handbrake triggers drift condition when at speed', () => {
  const car = createInitialCarState(0, -26);
  car.speed = 18;
  car.vz = 18;

  const inputs: CarInputs = {
    forward: 0,
    steer: 0.8,
    handbrake: true,
    boost: false,
    horn: false,
  };

  const result = updateCarPhysics(car, inputs, 0.05);

  assert.equal(car.isDrifting, true, 'car should be drifting');
  assert.ok(result.skidIntensity > 0, 'skid intensity should be positive during drift');
});

test('Prop collision damages prop, transfers impulse, and triggers destruction', () => {
  const car = createInitialCarState(0, -26);
  car.speed = 20;
  car.vx = 0;
  car.vz = 20;

  const cactus: DestructibleProp = {
    id: 'cactus_1',
    type: 'CACTUS',
    x: 0,
    y: 0,
    z: -25.0, // within collision radius
    vx: 0,
    vz: 0,
    rotationY: 0,
    angularV: 0,
    radius: 0.8,
    mass: 80,
    isBroken: false,
    health: 20,
    maxHealth: 50,
    points: 100,
    name: 'Saguaro Cactus',
  };

  const scoreState: GameScoreState = {
    score: 0,
    mayhemMultiplier: 1,
    mayhemMeter: 0,
    comboCount: 0,
    comboTimer: 0,
    cactiSmashed: 0,
    cratesSmashed: 0,
    fencesSmashed: 0,
    totalDriftDistance: 0,
    maxAirTime: 0,
    donkeysBumped: 0,
    lastSmashText: '',
    lastSmashTimer: 0,
  };

  let destroyedCallbackFired = false;
  const result = updatePropsAndCollisions(
    car,
    [cactus],
    0.05,
    scoreState,
    () => {
      destroyedCallbackFired = true;
    }
  );

  assert.equal(result.hitOccurred, true, 'collision should be detected');
  assert.equal(cactus.isBroken, true, 'cactus should be destroyed');
  assert.equal(destroyedCallbackFired, true, 'destruction callback should fire');
  assert.ok(scoreState.score >= 100, 'score should increase');
  assert.equal(scoreState.cactiSmashed, 1, 'cacti smashed count should increment');
  assert.ok(cactus.vz > 0, 'prop should receive impulse in crash direction');
});

test('Debris pieces bounce with gravity and dissipate life', () => {
  const debris: DebrisPiece[] = [
    {
      id: 1,
      x: 0,
      y: 10,
      z: 0,
      vx: 2,
      vy: 0,
      vz: 1,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      vRotX: 1,
      vRotY: 1,
      vRotZ: 1,
      size: 0.4,
      color: 0x8b5a2b,
      type: 'WOOD',
      life: 1.0,
      maxLife: 2.0,
    },
  ];

  updateDebris(debris, 0.1);

  assert.ok(debris[0].vy < 0, 'vy should become negative due to gravity');
  assert.ok(debris[0].life < 1.0, 'debris life should decrease');
});

test('Circle collision separates bodies and conserves momentum direction', () => {
  const b1 = { x: 0, z: 0, vx: 5, vz: 0, radius: 1, mass: 10 };
  const b2 = { x: 1.5, z: 0, vx: 0, vz: 0, radius: 1, mass: 10 };

  const res = resolveCircleCollision(b1, b2);
  assert.equal(res.collided, true);
  assert.ok(b2.vx > 0, 'target body should gain positive velocity along impact');
});
