/**
 * High-performance pooled particle system and visual juice effects.
 * Pre-allocated meshes and ring buffers to ensure zero GC in 60fps render loop.
 */

import * as THREE from 'three';
import { getTerrainHeight, type DebrisPiece } from './physics';
import { materials } from './models';

const MAX_DUST_PARTICLES = 160;
const MAX_DEBRIS_MESHES = 80;

export interface DustParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  public dustGroup: THREE.Group;
  public debrisGroup: THREE.Group;
  private dustPool: DustParticle[] = [];
  private dustMesh: THREE.InstancedMesh;
  private dummy: THREE.Object3D = new THREE.Object3D();

  // Debris pooled meshes
  private debrisMeshes: {
    mesh: THREE.Mesh;
    active: boolean;
    piece: DebrisPiece | null;
  }[] = [];

  // Reusable geometries
  private woodGeom = new THREE.BoxGeometry(0.35, 0.12, 0.65);
  private pulpGeom = new THREE.BoxGeometry(0.28, 0.28, 0.28);
  private metalGeom = new THREE.BoxGeometry(0.25, 0.25, 0.08);

  constructor(scene: THREE.Scene) {
    this.dustGroup = new THREE.Group();
    this.dustGroup.name = 'dust_particles';
    scene.add(this.dustGroup);

    this.debrisGroup = new THREE.Group();
    this.debrisGroup.name = 'debris_pieces';
    scene.add(this.debrisGroup);

    // Dust InstancedMesh
    const dustGeom = new THREE.DodecahedronGeometry(0.3, 0);
    const dustMat = new THREE.MeshBasicMaterial({
      color: 0xdeb887,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    this.dustMesh = new THREE.InstancedMesh(dustGeom, dustMat, MAX_DUST_PARTICLES);
    this.dustMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.dustMesh.frustumCulled = false;
    this.dustGroup.add(this.dustMesh);

    // Initialize dust pool
    for (let i = 0; i < MAX_DUST_PARTICLES; i++) {
      this.dustPool.push({
        active: false,
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        size: 0.2,
        opacity: 0,
        life: 0,
        maxLife: 1,
      });
      this.dummy.position.set(0, -100, 0);
      this.dummy.updateMatrix();
      this.dustMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.dustMesh.instanceMatrix.needsUpdate = true;

    // Initialize debris meshes pool
    for (let i = 0; i < MAX_DEBRIS_MESHES; i++) {
      const mesh = new THREE.Mesh(this.woodGeom, materials.woodPlank);
      mesh.visible = false;
      mesh.castShadow = true;
      this.debrisGroup.add(mesh);
      this.debrisMeshes.push({
        mesh,
        active: false,
        piece: null,
      });
    }
  }

  public emitDust(x: number, y: number, z: number, intensity = 1.0, count = 2) {
    let spawned = 0;
    for (let i = 0; i < MAX_DUST_PARTICLES; i++) {
      if (!this.dustPool[i].active) {
        const p = this.dustPool[i];
        p.active = true;
        p.x = x + (Math.random() - 0.5) * 0.4;
        p.y = y + 0.15 + Math.random() * 0.1;
        p.z = z + (Math.random() - 0.5) * 0.4;

        const spread = 0.8 * intensity;
        p.vx = (Math.random() - 0.5) * spread;
        p.vy = 0.6 + Math.random() * 1.2 * intensity;
        p.vz = (Math.random() - 0.5) * spread;

        p.size = (0.2 + Math.random() * 0.3) * intensity;
        p.maxLife = 0.5 + Math.random() * 0.6;
        p.life = p.maxLife;
        p.opacity = 0.6;

        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  public spawnDebrisBurst(
    type: 'WOOD' | 'CACTUS_PULP' | 'METAL' | 'TWIG',
    origin: { x: number; y: number; z: number },
    baseVelocity: { x: number; y: number; z: number },
    count = 8
  ) {
    let spawned = 0;
    for (let i = 0; i < MAX_DEBRIS_MESHES; i++) {
      if (!this.debrisMeshes[i].active) {
        const entry = this.debrisMeshes[i];
        entry.active = true;
        entry.mesh.visible = true;

        // Set geometry and material based on type
        if (type === 'CACTUS_PULP') {
          entry.mesh.geometry = this.pulpGeom;
          entry.mesh.material = materials.cactus;
        } else if (type === 'METAL') {
          entry.mesh.geometry = this.metalGeom;
          entry.mesh.material = materials.metalDark;
        } else {
          entry.mesh.geometry = this.woodGeom;
          entry.mesh.material = materials.woodPlank;
        }

        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 7;
        const piece: DebrisPiece = {
          id: Math.random(),
          x: origin.x + (Math.random() - 0.5) * 0.6,
          y: origin.y + 0.4 + Math.random() * 0.5,
          z: origin.z + (Math.random() - 0.5) * 0.6,
          vx: baseVelocity.x * 0.4 + Math.cos(angle) * speed,
          vy: baseVelocity.y * 0.5 + 4 + Math.random() * 5,
          vz: baseVelocity.z * 0.4 + Math.sin(angle) * speed,
          rotX: Math.random() * Math.PI,
          rotY: Math.random() * Math.PI,
          rotZ: Math.random() * Math.PI,
          vRotX: (Math.random() - 0.5) * 12,
          vRotY: (Math.random() - 0.5) * 12,
          vRotZ: (Math.random() - 0.5) * 12,
          size: 0.4,
          color: 0xffffff,
          type,
          life: 2.5 + Math.random() * 1.5,
          maxLife: 4.0,
        };

        entry.piece = piece;
        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  public update(dt: number) {
    const clampedDt = Math.min(dt, 0.05);

    // 1. Update dust particles
    let updatedAny = false;
    for (let i = 0; i < MAX_DUST_PARTICLES; i++) {
      const p = this.dustPool[i];
      if (p.active) {
        p.life -= clampedDt;
        if (p.life <= 0) {
          p.active = false;
          this.dummy.position.set(0, -100, 0);
          this.dummy.updateMatrix();
          this.dustMesh.setMatrixAt(i, this.dummy.matrix);
          updatedAny = true;
          continue;
        }

        // Expand and rise
        p.x += p.vx * clampedDt;
        p.y += p.vy * clampedDt;
        p.z += p.vz * clampedDt;
        p.vx *= 0.94;
        p.vy *= 0.92;
        p.vz *= 0.94;

        const progress = 1 - p.life / p.maxLife;
        const currentScale = p.size * (1 + progress * 2.5);

        this.dummy.position.set(p.x, p.y, p.z);
        this.dummy.scale.set(currentScale, currentScale, currentScale);
        this.dummy.updateMatrix();
        this.dustMesh.setMatrixAt(i, this.dummy.matrix);
        updatedAny = true;
      }
    }
    if (updatedAny) {
      this.dustMesh.instanceMatrix.needsUpdate = true;
    }

    // 2. Update debris meshes
    for (let i = 0; i < MAX_DEBRIS_MESHES; i++) {
      const entry = this.debrisMeshes[i];
      if (entry.active && entry.piece) {
        const piece = entry.piece;
        piece.life -= clampedDt;
        if (piece.life <= 0) {
          entry.active = false;
          entry.mesh.visible = false;
          entry.piece = null;
          continue;
        }

        piece.vy -= 22 * clampedDt; // gravity
        piece.x += piece.vx * clampedDt;
        piece.y += piece.vy * clampedDt;
        piece.z += piece.vz * clampedDt;

        piece.rotX += piece.vRotX * clampedDt;
        piece.rotY += piece.vRotY * clampedDt;
        piece.rotZ += piece.vRotZ * clampedDt;

        // Ground bounce
        const groundY = getTerrainHeight(piece.x, piece.z);
        if (piece.y < groundY + 0.2) {
          piece.y = groundY + 0.2;
          piece.vy = -piece.vy * 0.45;
          piece.vx *= 0.75;
          piece.vz *= 0.75;
          piece.vRotX *= 0.6;
          piece.vRotZ *= 0.6;
        }

        entry.mesh.position.set(piece.x, piece.y, piece.z);
        entry.mesh.rotation.set(piece.rotX, piece.rotY, piece.rotZ);

        // Shrink slightly near end of life
        if (piece.life < 0.6) {
          const s = Math.max(0.01, piece.life / 0.6);
          entry.mesh.scale.set(s, s, s);
        } else {
          entry.mesh.scale.set(1, 1, 1);
        }
      }
    }
  }

  public dispose() {
    this.dustMesh.geometry.dispose();
    this.woodGeom.dispose();
    this.pulpGeom.dispose();
    this.metalGeom.dispose();
  }
}

/**
 * Camera Shake & Hitstop controller
 */
export class CameraFX {
  public trauma: number = 0;
  public hitstopTimer: number = 0;
  public offsetX: number = 0;
  public offsetY: number = 0;
  public offsetZ: number = 0;
  public rollOffset: number = 0;

  public addTrauma(amount: number) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  public triggerHitstop(seconds = 0.045) {
    this.hitstopTimer = seconds;
  }

  public update(dt: number) {
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
    }

    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - 1.8 * dt);
      const shake = this.trauma * this.trauma; // non-linear trauma

      this.offsetX = (Math.random() * 2 - 1) * shake * 1.6;
      this.offsetY = (Math.random() * 2 - 1) * shake * 1.2;
      this.offsetZ = (Math.random() * 2 - 1) * shake * 1.6;
      this.rollOffset = (Math.random() * 2 - 1) * shake * 0.06;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
      this.offsetZ = 0;
      this.rollOffset = 0;
    }
  }
}
