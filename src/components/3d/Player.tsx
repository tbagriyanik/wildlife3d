import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { useSphere } from '@react-three/cannon';
import * as THREE from 'three';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameStore } from '../../store/useGameStore';
import { useAudio } from '../../hooks/useAudio';
import { Fire } from './Fire';


import { ArrowManager } from './Arrow';
import { TRANSLATIONS } from '../../constants/translations';


const HeldItem = ({ type, count }: { type: string; count: number }) => {
    const torchFuel = useGameStore((state) => state.torchFuel);
    const lightRef = useRef<THREE.PointLight>(null);
    const flameRef1 = useRef<THREE.Mesh>(null);
    const flameRef2 = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (type === 'torch' && count > 0) {
            const time = state.clock.elapsedTime;

            // Flicker light
            if (lightRef.current) {
                const flicker = Math.sin(time * 20) * 0.2 + Math.cos(time * 15) * 0.1;
                const safeFuel = Math.max(0.01, torchFuel);
                lightRef.current.intensity = (2.0 + flicker) * safeFuel;
                lightRef.current.distance = (15 + flicker * 2) * Math.sqrt(safeFuel);
            }

            // Animate flame meshes
            if (flameRef1.current) {
                const scale = 1 + Math.sin(time * 10) * 0.1;
                flameRef1.current.scale.set(scale, scale * 1.2, scale);
                flameRef1.current.position.y = 0.35 + Math.sin(time * 12) * 0.02;
            }
            if (flameRef2.current) {
                const scale = 1 + Math.cos(time * 8) * 0.15;
                flameRef2.current.scale.set(scale, scale * 1.3, scale);
                flameRef2.current.position.y = 0.35 + Math.cos(time * 10) * 0.03;
            }
        }
    });

    if (count <= 0) return null;

    if (type === 'torch') {
        return (
            <group position={[0.4, -0.5, -0.6]} rotation={[0, -0.2, 0]}>
                {/* Tapered Handle (Meşale style) */}
                <mesh castShadow renderOrder={1000}>
                    <cylinderGeometry args={[0.02, 0.04, 0.7]} />
                    <meshStandardMaterial color="#3e2723" roughness={1} />
                </mesh>
                {/* Top Coal / Binding area */}
                <mesh position={[0, 0.35, 0]} renderOrder={1000}>
                    <cylinderGeometry args={[0.06, 0.04, 0.15]} />
                    <meshStandardMaterial color="#212121" roughness={1} />
                </mesh>
                {/* Flame area */}
                <group position={[0, 0.5, 0]}>
                    <Fire scale={0.4} />
                    <pointLight ref={lightRef as any} intensity={2} distance={35} color="#ffaa44" />
                </group>
            </group>

        );
    }


    if (type === 'bow') {
        return (
            <group position={[0.4, -0.5, -0.7]} rotation={[0.2, -1.2, 0.1]}>
                {/* Bow Riser (Handle) */}
                <mesh castShadow>
                    <boxGeometry args={[0.05, 0.4, 0.06]} />
                    <meshStandardMaterial color="#3e2723" roughness={1} />
                </mesh>

                {/* Limbs - Top */}
                <group position={[0, 0.2, 0]}>
                    <mesh position={[0, 0.15, -0.05]} rotation={[-0.4, 0, 0]}>
                        <boxGeometry args={[0.04, 0.35, 0.02]} />
                        <meshStandardMaterial color="#5d4037" roughness={1} />
                    </mesh>
                    <mesh position={[0, 0.4, -0.15]} rotation={[-0.8, 0, 0]}>
                        <boxGeometry args={[0.035, 0.3, 0.02]} />
                        <meshStandardMaterial color="#5d4037" roughness={1} />
                    </mesh>
                </group>

                {/* Limbs - Bottom */}
                <group position={[0, -0.2, 0]}>
                    <mesh position={[0, -0.15, -0.05]} rotation={[0.4, 0, 0]}>
                        <boxGeometry args={[0.04, 0.35, 0.02]} />
                        <meshStandardMaterial color="#5d4037" roughness={1} />
                    </mesh>
                    <mesh position={[0, -0.4, -0.15]} rotation={[0.8, 0, 0]}>
                        <boxGeometry args={[0.035, 0.3, 0.02]} />
                        <meshStandardMaterial color="#5d4037" roughness={1} />
                    </mesh>
                </group>

                {/* Bowstring */}
                <mesh position={[0, 0, -0.32]}>
                    <cylinderGeometry args={[0.003, 0.003, 1.4]} />
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
                </mesh>

                {/* Arrow Nock Point (Visual detail) */}
                <mesh position={[0, 0, -0.32]}>
                    <boxGeometry args={[0.01, 0.05, 0.01]} />
                    <meshStandardMaterial color="#ffcc00" />
                </mesh>
            </group>
        );
    }
    return null;
};

export const Player = () => {
    const { moveForward, moveBackward, moveLeft, moveRight, sprint, jump, aim, leftClick } = useKeyboard();
    const { playSound } = useAudio();

    const joystick = useGameStore((state) => state.joystick);
    const activeSlot = useGameStore((state) => state.activeSlot);
    const inventory = useGameStore((state) => state.inventory);

    const removeItem = useGameStore((state) => state.removeItem);
    const addNotification = useGameStore((state) => state.addNotification);

    const torchFuel = useGameStore((state) => state.torchFuel);
    const setTorchFuel = useGameStore((state) => state.setTorchFuel);

    const slotItems = ['bow', 'torch', 'water', 'meat', 'cooked_meat', 'apple', 'baked_apple'];
    const currentItem = slotItems[activeSlot];

    // Ensure we only try to "hold" actual tools/weapons
    const isHoldable = ['bow', 'torch'].includes(currentItem);

    // Physics Sphere
    const savedPos = useGameStore.getState().playerPosition; // Get saved pos
    const [ref, api] = useSphere(() => ({
        mass: 1,
        type: 'Dynamic',
        position: savedPos || [0, 2, 0], // Use saved position or default
        args: [0.5], // Reduced Radius to avoid snagging
        fixedRotation: true,
        linearDamping: 0.4, // Snappier movement
        material: { friction: 0, restitution: 0 }
    }));


    const velocity = useRef([0, 0, 0]);
    useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity]);

    const pos = useRef([0, 0, 0]);
    useEffect(() => api.position.subscribe((p) => (pos.current = p)), [api.position]);


    // Basic mobile check
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const setBearing = useGameStore((state) => state.setBearing);

    // Archery shooting buffer & cooldown
    const shootBuffer = useRef(false);
    const lastShootTime = useRef(0);
    const SHOOT_COOLDOWN = 500; // ms

    const itemGroupRef = useRef<THREE.Group>(null);


    useFrame((state, delta) => {
        const { camera } = state;
        // Default RUN (12), Shift WALK (6)
        const baseSpeed = sprint ? 6 : 12;

        // --- TORCH FUEL LOGIC ---
        if (currentItem === 'torch' && (inventory['torch'] || 0) > 0) {
            // Deplete fuel (lasts ~2 minutes per torch)
            const depletionRate = 0.01; // 1.0 to 0.0 in 100 seconds roughly
            const nextFuel = Math.max(0, torchFuel - delta * depletionRate);
            setTorchFuel(nextFuel);

            // Refill if fuel is out but we have more items
            if (nextFuel <= 0) {
                if (inventory['torch'] > 1) { // We use > 1 because 1 is the currently held one
                    removeItem('torch', 1);
                    setTorchFuel(1.0);
                    const lang = useGameStore.getState().language;
                    addNotification(TRANSLATIONS[lang].new_torch_msg, 'info');
                } else {
                    // Out of torches
                    removeItem('torch', 1);
                    useGameStore.getState().setActiveSlot(-1);
                    setTorchFuel(0);
                }
            }
        }


        // --- ARCHERY LOGIC ---
        const now = Date.now();
        if (currentItem === 'bow' && leftClick && !shootBuffer.current && !isAnyMenuOpen && (now - lastShootTime.current > SHOOT_COOLDOWN)) {
            lastShootTime.current = now;

            const state = useGameStore.getState();
            if ((state.inventory['arrow'] || 0) > 0) {
                // Direction
                const direction = new THREE.Vector3();
                camera.getWorldDirection(direction);

                // Spawn position (slightly ahead of camera)
                const spawnPos = new THREE.Vector3()
                    .copy(camera.position)
                    .addScaledVector(direction, 1);

                // Speed
                const arrowSpeed = 60;
                const arrowVelocity = direction.clone().multiplyScalar(arrowSpeed);

                // Rotation (Look at direction)
                const rotation = camera.rotation.toArray().slice(0, 3) as [number, number, number];

                state.shootArrow(
                    [spawnPos.x, spawnPos.y, spawnPos.z],
                    [arrowVelocity.x, arrowVelocity.y, arrowVelocity.z],
                    rotation
                );

                playSound('wood'); // Temporary sound
            }
        }
        shootBuffer.current = leftClick;

        // --- ZOOM LOGIC ---

        const targetFOV = aim ? 40 : 75;
        if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
            const perspectiveCamera = camera as THREE.PerspectiveCamera;
            perspectiveCamera.fov = THREE.MathUtils.lerp(perspectiveCamera.fov, targetFOV, 0.1);
            perspectiveCamera.updateProjectionMatrix();
        }

        // Update bearing in store (0-360)
        const forwardVec = new THREE.Vector3();
        camera.getWorldDirection(forwardVec);
        const angle = Math.atan2(forwardVec.x, forwardVec.z);
        let degrees = (angle * 180) / Math.PI;
        degrees = (degrees + 360) % 360;
        setBearing(degrees);

        // Joystick + Keyboard movement
        // DISABLE MOVEMENT IF MENU IS OPEN
        const moveZ = isAnyMenuOpen ? 0 : ((Number(moveBackward) - Number(moveForward)) || -joystick.y);
        const moveX = isAnyMenuOpen ? 0 : ((Number(moveRight) - Number(moveLeft)) || joystick.x);

        // Get camera direction vectors (XZ plane only)
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const rightVec = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        // Calculate final direction
        const moveDirection = new THREE.Vector3()
            .addScaledVector(forward, -moveZ)
            .addScaledVector(rightVec, moveX);

        if (moveDirection.lengthSq() > 1) {
            moveDirection.normalize();
        }

        const targetVelocity = moveDirection.multiplyScalar(baseSpeed);

        // --- JUMP LOGIC ---
        // Increased tolerance to 0.7 to allow jumping on slight slopes or uneven terrain
        if (jump && !isAnyMenuOpen && Math.abs(velocity.current[1]) < 0.7) {
            api.velocity.set(velocity.current[0], 7.5, velocity.current[2]);
        }

        // Apply movement velocity to physics body
        api.velocity.set(targetVelocity.x, velocity.current[1], targetVelocity.z);

        // Sync camera to physics body position
        camera.position.set(pos.current[0], pos.current[1] + 1.2, pos.current[2]);

        // Sync Held Item to camera
        if (itemGroupRef.current) {
            itemGroupRef.current.position.copy(camera.position);
            itemGroupRef.current.rotation.copy(camera.rotation);

            const swayX = Math.sin(state.clock.elapsedTime * 4) * 0.01;
            const swayY = Math.cos(state.clock.elapsedTime * 4) * 0.01;
            itemGroupRef.current.position.add(new THREE.Vector3(swayX, swayY, 0).applyQuaternion(camera.quaternion));
        }

        // Sync Player Position to Store for Interactions (throttled check would be better but this works for now)
        useGameStore.getState().setPlayerPosition(pos.current as [number, number, number]);
    });

    const isAnyMenuOpen = useGameStore((state) => state.isMenuOpen || state.isMainMenuOpen || state.isDead || state.isPaused);

    const controlsRef = useRef<any>(null); // Ref for PointerLockControls

    useEffect(() => {
        if (!controlsRef.current) return;

        if (isAnyMenuOpen) {
            controlsRef.current.unlock();
        }
        // Remove automatic lock() - let PointerLockControls handle locking via selector="#root" on user click
    }, [isAnyMenuOpen, isMobile]);

    return (
        <>
            {!isMobile && !isAnyMenuOpen && (
                <PointerLockControls
                    ref={controlsRef}
                    selector="#root" // Lock on canvas click
                    onUnlock={() => {
                        // Optional: Handle unlock
                    }}
                />
            )}
            <mesh ref={ref as any} name="player">

                <sphereGeometry args={[0.1]} />
                <meshStandardMaterial transparent opacity={0} />
            </mesh>
            {/* Viewport Items */}
            <group ref={itemGroupRef}>
                {isHoldable && <HeldItem type={currentItem} count={inventory[currentItem] || 0} />}
            </group>

            {/* Projectiles */}
            <ArrowManager />
        </>
    );
};
