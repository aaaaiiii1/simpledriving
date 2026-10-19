/**
 * Pure physics, vehicle kinematics, collision math, and game rules
 * for the isometric desert driving sandbox.
 */

export interface Vector2D {
  x: number;
  z: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface CarInputs {
  forward: number; // -1 to 1 (throttle / brake / reverse)
  steer: number;   // -1 (left) to 1 (right)
  handbrake: boolean;
  boost: boolean;
  horn: boolean;
}

export interface CarState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  heading: number;       // radians (0 = +Z, PI/2 = +X)
  steerAngle: number;    // current wheel steer angle
  speed: number;         // scalar forward speed
  angularVelocity: number;
  pitch: number;         // suspension pitch (accel / brake lean)
  roll: number;          // suspension roll (cornering lean)
  isDrifting: boolean;
  driftDuration: number;
  airborne: boolean;
  airTime: number;
  collisionCooldown: number;
  width: number;
  length: number;
}

export type PropType = 'CACTUS' | 'CRATE' | 'FENCE' | 'SIGN' | 'BARREL' | 'GATE' | 'TUMBLEWEED' | 'CART' | 'DONKEY';

export interface DestructibleProp {
  id: string;
  type: PropType;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  rotationY: number;
  angularV: number;
  radius: number;
  mass: number;
  isBroken: boolean;
  health: number;
  maxHealth: number;
  // Special props:
  hingeX?: number;
  hingeZ?: number;
  gateAngle?: number;
  gateAngularV?: number;
  // Moving targets:
  aiTimer?: number;
  aiTargetAngle?: number;
  points: number;
  name: string;
}

export interface DebrisPiece {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  vRotX: number;
  vRotY: number;
  vRotZ: number;
  size: number;
  color: number;
  type: 'WOOD' | 'CACTUS_PULP' | 'METAL' | 'STONE' | 'TWIG';
  life: number;
  maxLife: number;
}

export interface GameScoreState {
  score: number;
  mayhemMultiplier: number;
  mayhemMeter: number; // 0 to 1
  comboCount: number;
  comboTimer: number;
  cactiSmashed: number;
  cratesSmashed: number;
  fencesSmashed: number;
  totalDriftDistance: number;
  maxAirTime: number;
  donkeysBumped: number;
  lastSmashText: string;
  lastSmashTimer: number;
}

/**
 * Procedural desert terrain height function.
 * Smooth undulating dunes, flat central village plaza and roads, raised bluffs at edges.
 */
export function getTerrainHeight(x: number, z: number): number {
  const distFromCenter = Math.hypot(x, z);

  // Village clearing around (0, 0) to (20, 20)
  const villageInfluence = Math.max(0, 1 - Math.hypot(x - 5, z - 5) / 28);
  
  // Rolling dunes with multiple wave frequencies
  const dune1 = Math.sin(x * 0.04 + z * 0.02) * 1.8;
  const dune2 = Math.cos(x * 0.025 - z * 0.05) * 1.4;
  const dune3 = Math.sin((x + z) * 0.08) * 0.5;

  let h = (dune1 + dune2 + dune3) * (1 - villageInfluence * 0.85);

  // Raised canyon rim / dunes at outer borders (> 55 units)
  if (distFromCenter > 50) {
    const edgeRatio = Math.min(1, (distFromCenter - 50) / 20);
    h += edgeRatio * edgeRatio * 8;
  }

  return h;
}

/**
 * Get ground normal slope vector at (x, z)
 */
export function getTerrainNormal(x: number, z: number): { nx: number; ny: number; nz: number } {
  const eps = 0.5;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);

  const dx = (hR - hL) / (2 * eps);
  const dz = (hU - hD) / (2 * eps);

  // Normal is normalized (-dx, 1, -dz)
  const len = Math.hypot(dx, 1, dz);
  return {
    nx: -dx / len,
    ny: 1 / len,
    nz: -dz / len,
  };
}

/**
 * Initialize default car state on open desert road
 */
export function createInitialCarState(startX = 0, startZ = -26): CarState {
  const y = getTerrainHeight(startX, startZ);
  return {
    x: startX,
    y,
    z: startZ,
    vx: 0,
    vy: 0,
    vz: 0,
    heading: 0, // facing +Z towards town
    steerAngle: 0,
    speed: 0,
    angularVelocity: 0,
    pitch: 0,
    roll: 0,
    isDrifting: false,
    driftDuration: 0,
    airborne: false,
    airTime: 0,
    collisionCooldown: 0,
    width: 2.2,
    length: 4.2,
  };
}

/**
 * Update car kinematics and physics simulation step
 */
export function updateCarPhysics(
  car: CarState,
  inputs: CarInputs,
  dt: number,
  boundaryRadius = 68
): {
  impactSound?: boolean;
  driftSound?: boolean;
  skidIntensity: number;
} {
  const clampedDt = Math.min(dt, 0.05);

  // Vehicle tuning
  const maxForwardSpeed = inputs.boost ? 34 : 26;
  const maxReverseSpeed = -10;
  const accelerationRate = inputs.boost ? 28 : 20;
  const brakingRate = 32;
  const maxSteer = 0.58; // radians (~33 degrees)
  const steerSpeed = 4.2;

  // 1. Steering interpolation
  const targetSteer = inputs.steer * maxSteer;
  car.steerAngle += (targetSteer - car.steerAngle) * Math.min(1, steerSpeed * clampedDt);

  // 2. Ground detection and terrain height
  const groundY = getTerrainHeight(car.x, car.z);
  const heightAboveGround = car.y - groundY;

  if (heightAboveGround > 0.3) {
    car.airborne = true;
    car.airTime += clampedDt;
    car.vy -= 24 * clampedDt; // gravity
  } else {
    car.airborne = false;
    car.airTime = 0;
    // Ground snapping with springiness
    car.y += (groundY - car.y) * Math.min(1, 18 * clampedDt);
    if (car.vy < 0) car.vy = 0;
  }

  // 3. Acceleration / Braking
  const forwardX = Math.sin(car.heading);
  const forwardZ = Math.cos(car.heading);
  const rightX = Math.cos(car.heading);
  const rightZ = -Math.sin(car.heading);

  // Calculate current velocity in car local space
  let localForwardV = car.vx * forwardX + car.vz * forwardZ;
  let localLateralV = car.vx * rightX + car.vz * rightZ;

  if (!car.airborne) {
    if (inputs.forward > 0) {
      if (localForwardV < 0) {
        // Braking while reversing
        localForwardV += brakingRate * inputs.forward * clampedDt;
      } else {
        // Accelerating forward
        localForwardV += accelerationRate * inputs.forward * clampedDt;
        if (localForwardV > maxForwardSpeed) localForwardV = maxForwardSpeed;
      }
    } else if (inputs.forward < 0) {
      if (localForwardV > 0) {
        // Braking while going forward
        localForwardV += brakingRate * inputs.forward * clampedDt;
      } else {
        // Reversing
        localForwardV += (accelerationRate * 0.6) * inputs.forward * clampedDt;
        if (localForwardV < maxReverseSpeed) localForwardV = maxReverseSpeed;
      }
    } else {
      // Natural rolling resistance
      localForwardV *= Math.pow(0.88, clampedDt * 30);
    }

    // 4. Drift and Lateral Grip
    let lateralGrip = 0.12; // base lateral resistance (higher = sticky)
    let isDrifting = false;

    if (inputs.handbrake) {
      lateralGrip = 0.015; // low grip during handbrake
      localForwardV *= Math.pow(0.92, clampedDt * 30); // braking from handbrake
      if (Math.abs(localForwardV) > 4) {
        isDrifting = true;
      }
    } else if (Math.abs(car.steerAngle) > 0.35 && Math.abs(localForwardV) > 13) {
      // Dynamic power slide when turning hard at speed
      lateralGrip = 0.04;
      isDrifting = true;
    }

    // Damp lateral velocity according to grip
    localLateralV *= Math.pow(lateralGrip, clampedDt * 30);

    car.isDrifting = isDrifting;
    if (isDrifting) {
      car.driftDuration += clampedDt;
    } else {
      car.driftDuration = 0;
    }

    // 5. Turning rate
    const speedRatio = Math.min(1, Math.abs(localForwardV) / 8);
    const reverseMultiplier = localForwardV < -0.1 ? -1 : 1;
    const driftTurnMultiplier = isDrifting ? 1.7 : 1.0;
    const turnRate = car.steerAngle * 2.8 * speedRatio * reverseMultiplier * driftTurnMultiplier;
    car.heading += turnRate * clampedDt;

    // Convert local velocities back to world space
    car.vx = forwardX * localForwardV + rightX * localLateralV;
    car.vz = forwardZ * localForwardV + rightZ * localLateralV;

    // Pitch & roll suspension tilt
    const targetPitch = (inputs.forward * 0.08) - (inputs.handbrake ? 0.05 : 0);
    const targetRoll = -car.steerAngle * Math.min(1, Math.abs(localForwardV) / 15) * 0.16;
    car.pitch += (targetPitch - car.pitch) * Math.min(1, 10 * clampedDt);
    car.roll += (targetRoll - car.roll) * Math.min(1, 10 * clampedDt);
  } else {
    // In air: preserve horizontal velocity with slight air drag
    car.vx *= Math.pow(0.98, clampedDt * 30);
    car.vz *= Math.pow(0.98, clampedDt * 30);
    car.pitch += (0 - car.pitch) * Math.min(1, 4 * clampedDt);
    car.roll += (0 - car.roll) * Math.min(1, 4 * clampedDt);
  }

  // 6. Update position
  car.x += car.vx * clampedDt;
  car.y += car.vy * clampedDt;
  car.z += car.vz * clampedDt;
  car.speed = Math.hypot(car.vx, car.vz);

  // 7. World boundaries (canyon walls)
  const distFromCenter = Math.hypot(car.x, car.z);
  if (distFromCenter > boundaryRadius) {
    const nx = car.x / distFromCenter;
    const nz = car.z / distFromCenter;
    car.x = nx * boundaryRadius;
    car.z = nz * boundaryRadius;

    // Bounce off boundary wall
    const dot = car.vx * nx + car.vz * nz;
    if (dot > 0) {
      car.vx -= 1.6 * dot * nx;
      car.vz -= 1.6 * dot * nz;
    }
  }

  // 8. Solid Building Obstacle Collisions
  const buildings = [
    { x: -1, z: 4, hw: 4.8, hd: 3.8 }, // Saloon
    { x: 17, z: 4, hw: 4.0, hd: 3.2 }, // Store
    { x: -1, z: 16, hw: 3.8, hd: 3.0 }, // House
    { x: 18, z: 17, hw: 2.4, hd: 2.4 }, // Water Tower
  ];

  for (const b of buildings) {
    const dx = car.x - b.x;
    const dz = car.z - b.z;
    const overlapX = (b.hw + 1.2) - Math.abs(dx);
    const overlapZ = (b.hd + 1.2) - Math.abs(dz);

    if (overlapX > 0 && overlapZ > 0) {
      // Resolve along minimum penetration axis
      if (overlapX < overlapZ) {
        const sign = dx > 0 ? 1 : -1;
        car.x = b.x + sign * (b.hw + 1.2);
        car.vx = -car.vx * 0.4;
      } else {
        const sign = dz > 0 ? 1 : -1;
        car.z = b.z + sign * (b.hd + 1.2);
        car.vz = -car.vz * 0.4;
      }
    }
  }

  // Cooldown timers
  if (car.collisionCooldown > 0) {
    car.collisionCooldown -= clampedDt;
  }

  // Skid intensity for audio / particles
  const skidIntensity = car.isDrifting
    ? Math.min(1, (Math.abs(localLateralV) + Math.abs(car.steerAngle) * 6) / 10)
    : 0;

  return {
    driftSound: car.isDrifting && car.speed > 6,
    skidIntensity,
  };
}

/**
 * Circle-to-Circle collision check and response
 */
export function resolveCircleCollision(
  c1: { x: number; z: number; vx: number; vz: number; radius: number; mass: number },
  c2: { x: number; z: number; vx: number; vz: number; radius: number; mass: number },
  elasticity = 0.6
): { collided: boolean; impactSpeed: number } {
  const dx = c2.x - c1.x;
  const dz = c2.z - c1.z;
  const dist = Math.hypot(dx, dz);
  const minDist = c1.radius + c2.radius;

  if (dist >= minDist || dist === 0) {
    return { collided: false, impactSpeed: 0 };
  }

  // Normal vector
  const nx = dx / dist;
  const nz = dz / dist;

  // Separate overlapping bodies
  const overlap = minDist - dist;
  const totalMass = c1.mass + c2.mass;
  const m1Ratio = c2.mass / totalMass;
  const m2Ratio = c1.mass / totalMass;

  c1.x -= nx * overlap * m1Ratio;
  c1.z -= nz * overlap * m1Ratio;
  c2.x += nx * overlap * m2Ratio;
  c2.z += nz * overlap * m2Ratio;

  // Relative velocity
  const rvx = c2.vx - c1.vx;
  const rvz = c2.vz - c1.vz;
  const velAlongNormal = rvx * nx + rvz * nz;

  if (velAlongNormal > 0) {
    return { collided: true, impactSpeed: 0 };
  }

  const impulseScalar = -(1 + elasticity) * velAlongNormal / (1 / c1.mass + 1 / c2.mass);
  c1.vx -= (impulseScalar / c1.mass) * nx;
  c1.vz -= (impulseScalar / c1.mass) * nz;
  c2.vx += (impulseScalar / c2.mass) * nx;
  c2.vz += (impulseScalar / c2.mass) * nz;

  return {
    collided: true,
    impactSpeed: Math.abs(velAlongNormal),
  };
}

/**
 * Handle collision between the car and destructible / dynamic props.
 */
export function updatePropsAndCollisions(
  car: CarState,
  props: DestructibleProp[],
  dt: number,
  scoreState: GameScoreState,
  onPropDestroyed?: (prop: DestructibleProp, hitVelocity: Vector3D) => void
): {
  hitOccurred: boolean;
  hitWeight: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  hitPos?: Vector3D;
} {
  const clampedDt = Math.min(dt, 0.05);
  let hitOccurred = false;
  let maxHitWeight: 'LIGHT' | 'MEDIUM' | 'HEAVY' = 'LIGHT';
  let hitPos: Vector3D | undefined;

  const carRadius = 1.4;
  const carMass = 1200; // kg

  for (const prop of props) {
    // Update gate hinge spring physics
    if (prop.type === 'GATE' && prop.hingeX !== undefined && prop.hingeZ !== undefined) {
      if (prop.gateAngle === undefined) prop.gateAngle = 0;
      if (prop.gateAngularV === undefined) prop.gateAngularV = 0;

      // Spring back to 0 angle with damping
      const springK = 22.0;
      const damping = 4.0;
      const accel = -springK * prop.gateAngle - damping * prop.gateAngularV;
      prop.gateAngularV += accel * clampedDt;
      prop.gateAngle += prop.gateAngularV * clampedDt;

      // Gate angle limits (-80 to +80 deg)
      if (prop.gateAngle > 1.4) {
        prop.gateAngle = 1.4;
        prop.gateAngularV = -prop.gateAngularV * 0.3;
      } else if (prop.gateAngle < -1.4) {
        prop.gateAngle = -1.4;
        prop.gateAngularV = -prop.gateAngularV * 0.3;
      }

      // Check collision between car and gate panel
      const dx = car.x - prop.x;
      const dz = car.z - prop.z;
      const dist = Math.hypot(dx, dz);
      if (dist < carRadius + prop.radius) {
        // Push gate!
        const pushImpulse = (car.speed + 4) * 1.5;
        prop.gateAngularV += (dx > 0 ? 1 : -1) * pushImpulse;
        car.vx *= 0.85;
        car.vz *= 0.85;
        hitOccurred = true;
        hitPos = { x: prop.x, y: prop.y + 0.8, z: prop.z };
      }
      continue;
    }

    // Update moving targets AI / Physics
    if (prop.type === 'TUMBLEWEED') {
      // Wind blowing tumbleweeds softly across the desert
      prop.vx += 1.8 * clampedDt;
      prop.vz += 0.8 * clampedDt;
      // Friction
      prop.vx *= Math.pow(0.96, clampedDt * 30);
      prop.vz *= Math.pow(0.96, clampedDt * 30);
      prop.x += prop.vx * clampedDt;
      prop.z += prop.vz * clampedDt;
      prop.rotationY += (Math.hypot(prop.vx, prop.vz) * 3) * clampedDt;
      prop.y = getTerrainHeight(prop.x, prop.z) + prop.radius * 0.9;

      // Wrap around map boundary
      if (prop.x > 60) prop.x = -60;
      if (prop.z > 60) prop.z = -60;
    } else if (prop.type === 'DONKEY') {
      // Desert mule / donkey wanders around
      if (prop.aiTimer === undefined) prop.aiTimer = 0;
      if (prop.aiTargetAngle === undefined) prop.aiTargetAngle = 0;

      prop.aiTimer -= clampedDt;
      if (prop.aiTimer <= 0) {
        prop.aiTimer = 2.5 + Math.random() * 3.5;
        prop.aiTargetAngle = Math.random() * Math.PI * 2;
      }

      // Wander forward slowly
      const wanderSpeed = 2.2;
      prop.vx = Math.sin(prop.aiTargetAngle) * wanderSpeed;
      prop.vz = Math.cos(prop.aiTargetAngle) * wanderSpeed;
      prop.x += prop.vx * clampedDt;
      prop.z += prop.vz * clampedDt;
      prop.rotationY = prop.aiTargetAngle;
      prop.y = getTerrainHeight(prop.x, prop.z);
    } else if (prop.type === 'BARREL' || prop.type === 'CART') {
      // Roll physics if pushed
      prop.x += prop.vx * clampedDt;
      prop.z += prop.vz * clampedDt;
      prop.vx *= Math.pow(0.92, clampedDt * 30);
      prop.vz *= Math.pow(0.92, clampedDt * 30);
      prop.rotationY += prop.angularV * clampedDt;
      prop.angularV *= Math.pow(0.90, clampedDt * 30);
      prop.y = getTerrainHeight(prop.x, prop.z);
    }

    if (prop.isBroken) continue;

    // Check collision with car
    const dx = prop.x - car.x;
    const dz = prop.z - car.z;
    const dist = Math.hypot(dx, dz);
    const minDist = carRadius + prop.radius;

    if (dist < minDist) {
      hitOccurred = true;
      hitPos = { x: prop.x, y: prop.y + 0.8, z: prop.z };

      // Normal vector
      const nx = dist > 0.001 ? dx / dist : Math.sin(car.heading);
      const nz = dist > 0.001 ? dz / dist : Math.cos(car.heading);

      const impactSpeed = car.speed;
      const damage = Math.max(15, impactSpeed * 12);
      prop.health -= damage;

      // Transfer impulse to prop
      const impulse = impactSpeed * 0.8;
      prop.vx += nx * impulse;
      prop.vz += nz * impulse;
      prop.angularV = (Math.random() - 0.5) * 8;

      // Prop destruction check
      if (prop.health <= 0) {
        prop.isBroken = true;

        // Scoring & Mayhem
        scoreState.score += prop.points * scoreState.mayhemMultiplier;
        scoreState.comboCount += 1;
        scoreState.comboTimer = 2.5; // combo reset timer
        scoreState.mayhemMeter = Math.min(1, scoreState.mayhemMeter + 0.18);
        scoreState.mayhemMultiplier = Math.min(5, Math.floor(scoreState.mayhemMeter * 4) + 1);

        if (prop.type === 'CACTUS') scoreState.cactiSmashed += 1;
        if (prop.type === 'CRATE') scoreState.cratesSmashed += 1;
        if (prop.type === 'FENCE') scoreState.fencesSmashed += 1;
        if (prop.type === 'DONKEY') scoreState.donkeysBumped += 1;

        scoreState.lastSmashText = `${prop.name} DESTROYED! +${prop.points * scoreState.mayhemMultiplier}`;
        scoreState.lastSmashTimer = 1.6;

        if (onPropDestroyed) {
          onPropDestroyed(prop, {
            x: car.vx * 1.2 + nx * 5,
            y: 4 + Math.random() * 4,
            z: car.vz * 1.2 + nz * 5,
          });
        }
      }

      // Slow down car on impact
      if (impactSpeed > 16) {
        maxHitWeight = 'HEAVY';
        car.vx *= 0.65;
        car.vz *= 0.65;
      } else if (impactSpeed > 8) {
        maxHitWeight = 'MEDIUM';
        car.vx *= 0.82;
        car.vz *= 0.82;
      } else {
        maxHitWeight = 'LIGHT';
        car.vx *= 0.92;
        car.vz *= 0.92;
      }
    }
  }

  // Decay combo timer
  if (scoreState.comboTimer > 0) {
    scoreState.comboTimer -= clampedDt;
    if (scoreState.comboTimer <= 0) {
      scoreState.comboCount = 0;
    }
  }

  // Decay mayhem meter
  if (scoreState.mayhemMeter > 0) {
    scoreState.mayhemMeter = Math.max(0, scoreState.mayhemMeter - 0.05 * clampedDt);
    scoreState.mayhemMultiplier = Math.min(5, Math.floor(scoreState.mayhemMeter * 4) + 1);
  }

  if (scoreState.lastSmashTimer > 0) {
    scoreState.lastSmashTimer -= clampedDt;
  }

  return {
    hitOccurred,
    hitWeight: maxHitWeight,
    hitPos,
  };
}

/**
 * Update bouncing physics debris pieces
 */
export function updateDebris(debrisList: DebrisPiece[], dt: number): void {
  const clampedDt = Math.min(dt, 0.05);

  for (let i = debrisList.length - 1; i >= 0; i--) {
    const p = debrisList[i];
    p.life -= clampedDt;
    if (p.life <= 0) {
      debrisList.splice(i, 1);
      continue;
    }

    p.vy -= 22 * clampedDt; // gravity
    p.x += p.vx * clampedDt;
    p.y += p.vy * clampedDt;
    p.z += p.vz * clampedDt;

    p.rotX += p.vRotX * clampedDt;
    p.rotY += p.vRotY * clampedDt;
    p.rotZ += p.vRotZ * clampedDt;

    // Ground bounce
    const groundY = getTerrainHeight(p.x, p.z);
    if (p.y < groundY + p.size * 0.5) {
      p.y = groundY + p.size * 0.5;
      p.vy = -p.vy * 0.45; // bounce with restitution
      p.vx *= 0.75;
      p.vz *= 0.75;
      p.vRotX *= 0.6;
      p.vRotZ *= 0.6;
    }
  }
}
