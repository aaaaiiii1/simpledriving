/**
 * Main application entry point for Dust & Dunes: Low-Poly Isometric Desert Driver.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  createInitialCarState,
  updateCarPhysics,
  updatePropsAndCollisions,
  getTerrainHeight,
  type CarState,
  type CarInputs,
  type GameScoreState,
} from './game/physics';
import { createPlayerCar, CAR_COLORS } from './game/models';
import { buildDesertWorld, type WorldObjects } from './game/world';
import { ParticleSystem, CameraFX } from './game/particles';
import { sound } from './game/audio';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { PauseModal } from './components/PauseModal';
import { TouchControls } from './components/TouchControls';

type GameState = 'title' | 'playing' | 'paused';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // High-level Game UI State (throttled updates)
  const [gameState, setGameState] = useState<GameState>('title');
  const [selectedColorHex, setSelectedColorHex] = useState<number>(CAR_COLORS[0].hex);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hudSpeed, setHudSpeed] = useState<number>(0);
  const [hudDrifting, setHudDrifting] = useState<boolean>(false);
  const [hudAirborne, setHudAirborne] = useState<boolean>(false);
  const [scoreState, setScoreState] = useState<GameScoreState>({
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
  });

  // Mutable refs for simulation loop (never resets on React render)
  const gameStateRef = useRef<GameState>('title');
  gameStateRef.current = gameState;

  const carStateRef = useRef<CarState>(createInitialCarState(0, -26));
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const touchInputsRef = useRef<{ forward: number; steer: number; handbrake: boolean }>({
    forward: 0,
    steer: 0,
    handbrake: false,
  });

  const carModelRef = useRef<ReturnType<typeof createPlayerCar> | null>(null);
  const worldRef = useRef<WorldObjects | null>(null);
  const particlesRef = useRef<ParticleSystem | null>(null);
  const cameraFXRef = useRef<CameraFX>(new CameraFX());
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);

  // Sync dataset.state on document.body
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Check ?autostart=1 on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startGame();
    }
  }, []);

  const startGame = useCallback(() => {
    setGameState('playing');
    gameStateRef.current = 'playing';
    document.body.dataset.state = 'playing';
    sound.resume();
  }, []);

  const pauseGame = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      setGameState('paused');
      gameStateRef.current = 'paused';
    }
  }, []);

  const resumeGame = useCallback(() => {
    if (gameStateRef.current === 'paused') {
      setGameState('playing');
      gameStateRef.current = 'playing';
      sound.resume();
    }
  }, []);

  const resetCar = useCallback(() => {
    const car = carStateRef.current;
    car.vx = 0;
    car.vy = 0;
    car.vz = 0;
    car.speed = 0;
    car.pitch = 0;
    car.roll = 0;
    car.steerAngle = 0;
    car.y = getTerrainHeight(car.x, car.z) + 0.3;
    sound.playCrashSound('LIGHT');
  }, []);

  const restartSandbox = useCallback(() => {
    carStateRef.current = createInitialCarState(0, -26);
    setScoreState({
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
    });
    setGameState('playing');
    gameStateRef.current = 'playing';
  }, []);

  const exitToTitle = useCallback(() => {
    setGameState('title');
    gameStateRef.current = 'title';
  }, []);

  const toggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleHorn = useCallback((active: boolean) => {
    sound.playHorn(active);
  }, []);

  // Update buggy paint color
  const handleSelectColor = useCallback((hex: number) => {
    setSelectedColorHex(hex);
    if (carModelRef.current) {
      carModelRef.current.paintMaterial.color.setHex(hex);
    }
  }, []);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeac094); // warm desert sky

    // 2. Isometric Camera (Low-FOV Perspective for isometric perspective feel)
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.5, 300);
    cameraRef.current = camera;
    camera.position.set(28, 30, 28);
    camera.lookAt(0, 1, 0);

    // 3. Renderer
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({ antialias: !isHeadless, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. World construction
    const world = buildDesertWorld(scene);
    worldRef.current = world;

    // 5. Hero Car
    const carMeshBundle = createPlayerCar(selectedColorHex);
    carModelRef.current = carMeshBundle;
    scene.add(carMeshBundle.group);

    // 6. Particles & FX
    const particles = new ParticleSystem(scene);
    particlesRef.current = particles;
    const cameraFX = cameraFXRef.current;

    // Pre-warm shaders
    renderer.compile(scene, camera);

    // Input listeners
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      // Handle Title Start
      if (gameStateRef.current === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        startGame();
        return;
      }

      // Handle Pause
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameStateRef.current === 'playing') {
          pauseGame();
        } else if (gameStateRef.current === 'paused') {
          resumeGame();
        }
      }

      // Reset flip
      if (e.code === 'KeyR' && gameStateRef.current === 'playing') {
        resetCar();
      }

      // Mute
      if (e.code === 'KeyM') {
        toggleMute();
      }

      // Horn
      if (e.code === 'KeyH') {
        sound.playHorn(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      if (e.code === 'KeyH') {
        sound.playHorn(false);
      }
    };

    const onWindowBlur = () => {
      keysRef.current = {};
      touchInputsRef.current = { forward: 0, steer: 0, handbrake: false };
      sound.playHorn(false);
    };

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onWindowBlur);
    window.addEventListener('resize', onResize);

    // 7. Animation & Physics Game Loop
    let animId: number;
    let lastTime = performance.now();
    let hudThrottleTimer = 0;
    let titlePanAngle = 0;
    const clock = new THREE.Clock();

    const renderLoop = (time: number) => {
      animId = requestAnimationFrame(renderLoop);

      const rawDt = (time - lastTime) / 1000;
      lastTime = time;
      const dt = Math.min(rawDt, 0.05);

      // Windmill animation
      if (world.windmillBlades) {
        world.windmillBlades.rotation.z += 1.2 * dt;
      }

      // Title Screen Live World Tour
      if (gameStateRef.current === 'title') {
        titlePanAngle += 0.25 * dt;
        const panRadius = 38;
        const targetCamX = Math.cos(titlePanAngle) * panRadius + 8;
        const targetCamZ = Math.sin(titlePanAngle) * panRadius + 8;
        camera.position.x += (targetCamX - camera.position.x) * (1 - Math.exp(-3 * dt));
        camera.position.y += (22 - camera.position.y) * (1 - Math.exp(-3 * dt));
        camera.position.z += (targetCamZ - camera.position.z) * (1 - Math.exp(-3 * dt));
        camera.lookAt(8, 2, 8);

        // Slow spin hero car showcase on title
        carMeshBundle.group.position.set(0, getTerrainHeight(0, 0) + 0.05, 0);
        carMeshBundle.group.rotation.y += 0.8 * dt;

        particles.update(dt);
        renderer.render(scene, camera);
        return;
      }

      // Check hitstop pause
      if (cameraFX.hitstopTimer > 0) {
        cameraFX.update(dt);
        particles.update(dt);
        renderer.render(scene, camera);
        return;
      }

      if (gameStateRef.current === 'paused') {
        renderer.render(scene, camera);
        return;
      }

      // === ACTIVE GAMEPLAY SIMULATION ===
      const car = carStateRef.current;
      const keys = keysRef.current;
      const touch = touchInputsRef.current;

      // Aggregate keyboard + touch inputs
      let forwardInput = 0;
      if (keys['KeyW'] || keys['ArrowUp']) forwardInput += 1;
      if (keys['KeyS'] || keys['ArrowDown']) forwardInput -= 1;
      if (touch.forward !== 0) forwardInput = touch.forward;

      let steerInput = 0;
      if (keys['KeyA'] || keys['ArrowLeft']) steerInput -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) steerInput += 1;
      if (touch.steer !== 0) steerInput = touch.steer;

      const handbrakeInput = !!keys['Space'] || touch.handbrake;
      const boostInput = !!keys['ShiftLeft'] || !!keys['ShiftRight'];

      const inputs: CarInputs = {
        forward: forwardInput,
        steer: steerInput,
        handbrake: handbrakeInput,
        boost: boostInput,
        horn: !!keys['KeyH'],
      };

      // 1. Advance Car Physics
      const carPhysResult = updateCarPhysics(car, inputs, dt);

      // 2. Advance Props, Collisions, Destruction & Scores
      const activeScore = { ...scoreState };
      const colResult = updatePropsAndCollisions(
        car,
        world.props,
        dt,
        activeScore,
        (destroyedProp, hitVelocity) => {
          // Play specific shatter sound
          if (destroyedProp.type === 'CACTUS') {
            sound.playCactusSmash();
            particles.spawnDebrisBurst(
              'CACTUS_PULP',
              { x: destroyedProp.x, y: destroyedProp.y, z: destroyedProp.z },
              hitVelocity,
              10
            );
          } else if (destroyedProp.type === 'CRATE' || destroyedProp.type === 'FENCE') {
            sound.playWoodSnap();
            particles.spawnDebrisBurst(
              'WOOD',
              { x: destroyedProp.x, y: destroyedProp.y, z: destroyedProp.z },
              hitVelocity,
              8
            );
          } else {
            sound.playCrashSound('MEDIUM');
            particles.spawnDebrisBurst(
              'METAL',
              { x: destroyedProp.x, y: destroyedProp.y, z: destroyedProp.z },
              hitVelocity,
              6
            );
          }
        }
      );

      // Handle collision impact feedback
      if (colResult.hitOccurred) {
        sound.playCrashSound(colResult.hitWeight);
        if (colResult.hitWeight === 'HEAVY') {
          cameraFX.addTrauma(0.7);
          cameraFX.triggerHitstop(0.045);
        } else if (colResult.hitWeight === 'MEDIUM') {
          cameraFX.addTrauma(0.4);
        } else {
          cameraFX.addTrauma(0.2);
        }
      }

      // 3. Audio engine modulation
      sound.updateEngineSound(car.speed, inputs.forward, car.isDrifting, carPhysResult.skidIntensity);

      // 4. Dust particles behind tires
      if (car.speed > 1.5 && !car.airborne) {
        const backOffset = 1.35;
        const bx = car.x - Math.sin(car.heading) * backOffset;
        const bz = car.z - Math.cos(car.heading) * backOffset;
        const dustIntensity = car.isDrifting ? 2.5 : Math.min(1.5, car.speed / 12);
        const count = car.isDrifting ? 3 : 1;
        particles.emitDust(bx, car.y, bz, dustIntensity, count);
      }

      // 5. Update 3D Model Positions
      // Update Car Mesh
      carMeshBundle.group.position.set(car.x, car.y, car.z);
      carMeshBundle.group.rotation.y = car.heading;
      carMeshBundle.group.rotation.x = car.pitch;
      carMeshBundle.group.rotation.z = car.roll;

      // Front wheels steering angle
      carMeshBundle.frontLeftPivot.rotation.y = car.steerAngle;
      carMeshBundle.frontRightPivot.rotation.y = car.steerAngle;

      // Wheel spin
      const wheelSpin = (car.speed * dt) / 0.48;
      carMeshBundle.wheelMeshes.forEach((wheel) => {
        wheel.rotation.x += wheelSpin;
      });

      // Update Prop Meshes
      for (const prop of world.props) {
        const mesh = world.propMeshes.get(prop.id);
        if (!mesh) continue;

        if (prop.isBroken) {
          mesh.visible = false;
        } else {
          mesh.position.set(prop.x, prop.y, prop.z);
          mesh.rotation.y = prop.rotationY;
        }
      }

      // Update swinging gates
      for (const g of world.gates) {
        if (g.prop.gateAngle !== undefined) {
          g.pivot.rotation.y = g.prop.gateAngle;
        }
      }

      // Animate Donkey legs when moving
      const donkeyProp = world.props.find((p) => p.type === 'DONKEY');
      if (donkeyProp && world.donkeyLegs) {
        const donkeyMoving = Math.hypot(donkeyProp.vx, donkeyProp.vz) > 0.1;
        const legSwing = donkeyMoving ? Math.sin(time * 0.008) * 0.35 : 0;
        world.donkeyLegs[0].rotation.x = legSwing;
        world.donkeyLegs[1].rotation.x = -legSwing;
        world.donkeyLegs[2].rotation.x = -legSwing;
        world.donkeyLegs[3].rotation.x = legSwing;
      }

      // 6. Camera Follow Rig with Smooth Exponential Damping
      cameraFX.update(dt);
      const camOffsetDist = 22;
      const camHeight = 19;
      // Fixed isometric angle from behind-left (-X, -Z) looking toward (+X, +Z)
      const leadX = (car.vx * 0.2);
      const leadZ = (car.vz * 0.2);
      const targetLookX = car.x + leadX;
      const targetLookY = car.y + 0.8;
      const targetLookZ = car.z + leadZ;

      const targetCamX = car.x - camOffsetDist * 0.707 + cameraFX.offsetX;
      const targetCamY = car.y + camHeight + cameraFX.offsetY;
      const targetCamZ = car.z - camOffsetDist * 0.707 + cameraFX.offsetZ;

      // Exponential damping
      const dampFactor = 1 - Math.exp(-6.5 * dt);
      camera.position.x += (targetCamX - camera.position.x) * dampFactor;
      camera.position.y += (targetCamY - camera.position.y) * dampFactor;
      camera.position.z += (targetCamZ - camera.position.z) * dampFactor;
      camera.lookAt(targetLookX, targetLookY, targetLookZ);

      // 7. Update Particles
      particles.update(dt);

      // 8. Render Frame
      renderer.render(scene, camera);

      // 9. Throttle React HUD state updates (~10Hz)
      hudThrottleTimer += dt;
      if (hudThrottleTimer > 0.09) {
        hudThrottleTimer = 0;
        setHudSpeed(car.speed);
        setHudDrifting(car.isDrifting);
        setHudAirborne(car.airborne);
        setScoreState(activeScore);
      }
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('visibilitychange', onWindowBlur);
      window.removeEventListener('resize', onResize);
      particles.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [startGame, pauseGame, resumeGame, resetCar, toggleMute]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#24170f]">
      {/* 3D WebGL Canvas isolated mount */}
      <div
        ref={mountRef}
        data-testid="webgl-canvas-mount"
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Screen Shell Overlays */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={startGame}
          selectedColorHex={selectedColorHex}
          onSelectColor={handleSelectColor}
        />
      )}

      {gameState === 'playing' && (
        <>
          <HUD
            scoreState={scoreState}
            speed={hudSpeed}
            isDrifting={hudDrifting}
            isAirborne={hudAirborne}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onPause={pauseGame}
            onResetCar={resetCar}
            onTriggerHorn={handleHorn}
          />
          <TouchControls
            onForwardChange={(val) => {
              touchInputsRef.current.forward = val;
            }}
            onSteerChange={(val) => {
              touchInputsRef.current.steer = val;
            }}
            onHandbrakeChange={(val) => {
              touchInputsRef.current.handbrake = val;
            }}
          />
        </>
      )}

      {gameState === 'paused' && (
        <PauseModal
          scoreState={scoreState}
          onResume={resumeGame}
          onRestart={restartSandbox}
          onExitTitle={exitToTitle}
        />
      )}
    </div>
  );
}
