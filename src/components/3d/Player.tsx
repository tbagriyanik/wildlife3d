import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { useSphere } from '@react-three/cannon';
import * as THREE from 'three';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameStore, type Resource } from '../../store/useGameStore';
import { useAudio } from '../../hooks/useAudio';
import { Fire } from './Fire';


import { ArrowManager } from './Arrow';
import { TRANSLATIONS } from '../../constants/translations';


const HeldItem = ({ type, count, charge, isDrawing }: { type: string; count: number; charge?: number; isDrawing?: boolean }) => {
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
        const pull = isDrawing ? (charge || 0) * 0.08 : 0;
        return (
            <group position={[0.4 - pull, -0.5 + pull * 0.5, -0.7]} rotation={[0.2, -1.2 + pull * 0.5, 0.1]}>
                {/* Bow Riser (Handle) */}
                <mesh castShadow>
                    <cylinderGeometry args={[0.06, 0.08, 0.1]} />
                    <meshStandardMaterial color="#654321" roughness={0.8} />
                </mesh>

                {/* Limbs - curved */}
                <group position={[0, 0, 0]}>
                    {/* Top limb */}
                    <mesh position={[0, 0.3, -0.1]} rotation={[-0.3, 0, 0]}>
                        <cylinderGeometry args={[0.03, 0.04, 0.6]} />
                        <meshStandardMaterial color="#8B4513" roughness={0.9} />
                    </mesh>
                    {/* Bottom limb */}
                    <mesh position={[0, -0.3, -0.1]} rotation={[0.3, 0, 0]}>
                        <cylinderGeometry args={[0.03, 0.04, 0.6]} />
                        <meshStandardMaterial color="#8B4513" roughness={0.9} />
                    </mesh>
                </group>

                {/* Bowstring */}
                <mesh position={[0, 0, -0.25 - pull * 0.8]}>
                    <cylinderGeometry args={[0.002, 0.002, 1.2]} />
                    <meshStandardMaterial color="#F5F5DC" transparent opacity={0.8} />
                </mesh>

                {/* String silencers */}
                <mesh position={[0, 0.25, -0.25]}>
                    <sphereGeometry args={[0.02]} />
                    <meshStandardMaterial color="#654321" />
                </mesh>
                <mesh position={[0, -0.25, -0.25]}>
                    <sphereGeometry args={[0.02]} />
                    <meshStandardMaterial color="#654321" />
                </mesh>

                {/* Hand grip detail */}
                <mesh position={[0, 0, 0.05]}>
                    <boxGeometry args={[0.02, 0.1, 0.02]} />
                    <meshStandardMaterial color="#654321" />
                </mesh>
            </group>
        );
    }
    return null;
};

export const Player = () => {
    const { moveForward, moveBackward, moveLeft, moveRight, sprint, jump, aim, leftClick, interact } = useKeyboard();
    const { playSound } = useAudio();

    const joystick = useGameStore((state) => state.joystick);
    const activeSlot = useGameStore((state) => state.activeSlot);
    const inventory = useGameStore((state) => state.inventory);

    const removeItem = useGameStore((state) => state.removeItem);
    const addNotification = useGameStore((state) => state.addNotification);

    const torchFuel = useGameStore((state) => state.torchFuel);
    const setTorchFuel = useGameStore((state) => state.setTorchFuel);

    const jumpBuffer = useRef(false);

    const slotItems = ['bow', 'torch', 'water', 'meat', 'cooked_meat', 'apple', 'baked_apple'];
    const currentItem = activeSlot >= 0 ? slotItems[activeSlot] : null;

    // Ensure we only try to "hold" actual tools/weapons
    const isHoldable = currentItem && ['bow', 'torch'].includes(currentItem);

    // Physics Sphere
    const savedPos = useGameStore.getState().playerPosition; // Get saved pos
    const [ref, api] = useSphere(() => ({
        mass: 1,
        type: 'Dynamic',
        position: savedPos || [0, 2, 0], // Use saved position or default
        args: [0.5], // Reduced Radius to avoid snagging
        fixedRotation: true,
        linearDamping: 0.3, // Less damping for better movement
        material: { friction: 0, restitution: 0 }
    }));


    const velocity = useRef([0, 0, 0]);
    useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity]);

    const pos = useRef([0, 0, 0]);
    useEffect(() => api.position.subscribe((p) => (pos.current = p)), [api.position]);


    // Basic mobile check
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const setBearing = useGameStore((state) => state.setBearing);

    // Archery system
    const shootBuffer = useRef(false);
    const lastShootTime = useRef(0);
    const SHOOT_COOLDOWN = 300; // ms
    const chargeStart = useRef<number | null>(null);
    const chargingShot = useRef(false);
    const firedThisHold = useRef(false);
    const [chargeT, setChargeT] = useState(0);

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
        if (currentItem === 'bow' && !isAnyMenuOpen && (now - lastShootTime.current > SHOOT_COOLDOWN)) {
            const state = useGameStore.getState();

            // Start charging on mouse down
            if (leftClick && !chargingShot.current) {
                chargingShot.current = true;
                chargeStart.current = now;
                firedThisHold.current = false;
            }

            const isHolding = leftClick && chargingShot.current && chargeStart.current !== null;
            const heldMs = isHolding ? now - (chargeStart.current as number) : 0;
            const localCharge = Math.min(1, Math.max(0, heldMs / 3000));
            setChargeT(localCharge);
            const forceShot = isHolding && heldMs >= 3000;
            const releaseShot = !leftClick && chargingShot.current;

            if ((forceShot || releaseShot) && !shootBuffer.current && !firedThisHold.current) {
                lastShootTime.current = now;
                chargingShot.current = false;
                shootBuffer.current = true;
                firedThisHold.current = true;

                if ((state.inventory['arrow'] || 0) > 0) {
                    const direction = new THREE.Vector3();
                    camera.getWorldDirection(direction);
                    direction.normalize();

                    // Spawn position from camera, offset forward to avoid collision with player
                    const spawnPos = new THREE.Vector3().copy(camera.position);
                    spawnPos.addScaledVector(direction, 5); // 5 units ahead to clear player body

                    const chargeT = Math.min(1, Math.max(0, heldMs / 3000));
                    const minSpeed = aim ? 95 : 75;
                    const maxSpeed = aim ? 130 : 110;
                    const arrowSpeed = minSpeed + (maxSpeed - minSpeed) * chargeT;
                    const arrowVelocity = direction.clone().multiplyScalar(arrowSpeed);

                    // Calculate rotation from direction vector
                    const forward = new THREE.Vector3(0, 0, 1);
                    const quat = new THREE.Quaternion().setFromUnitVectors(forward, direction);
                    const rotation = new THREE.Euler().setFromQuaternion(quat).toArray().slice(0, 3) as [number, number, number];
                    
                    state.shootArrow(
                        [spawnPos.x, spawnPos.y, spawnPos.z],
                        [arrowVelocity.x, arrowVelocity.y, arrowVelocity.z],
                        rotation
                    );

                    playSound('wood');
                } else {
                    const lang = useGameStore.getState().language;
                    const t = TRANSLATIONS[lang];
                    state.addNotification(t.out_of_arrows_msg, 'warning');
                }
            }

            // Reset buffer when mouse released
            if (!leftClick) {
                shootBuffer.current = false;
                chargeStart.current = null;
                chargingShot.current = false;
                firedThisHold.current = false;
                setChargeT(0);
            }
        }

        // --- INTERACT LOGIC ---
        if (interact && !isAnyMenuOpen) {
            const state = useGameStore.getState();
            const playerPos = new THREE.Vector3(...state.playerPosition);

            // Find closest wildlife within range
            let closestAnimal: Resource | null = null;
            let closestDist = 3.0; // 3 meter range

            state.wildlife.forEach((animal) => {
                if (animal.type && ['deer', 'rabbit', 'bird', 'partridge'].includes(animal.type)) {
                    const animalPos = new THREE.Vector3(...animal.position);
                    const dist = playerPos.distanceTo(animalPos);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestAnimal = animal;
                    }
                }
            });

            if (closestAnimal) {
                const animal = closestAnimal as Resource & { type: string };
                // Hunt the animal (drop meat on ground)
                state.removeWildlife(animal.id);
                const meatAmount = animal.type === 'deer' ? 2 : 1;
                state.addDroppedItem('meat', meatAmount, [animal.position[0], animal.position[1] + 0.2, animal.position[2]]);

                // Spawn blood
                for (let i = 0; i < 5; i++) {
                    state.spawnBlood([
                        animal.position[0] + (Math.random() - 0.5) * 0.3,
                        animal.position[1] + Math.random() * 0.2,
                        animal.position[2] + (Math.random() - 0.5) * 0.3
                    ]);
                }

                // Notification
                const animalName = animal.type === 'deer' ? 'DEER' : animal.type === 'rabbit' ? 'RABBIT' : 'BIRD';
                state.addNotification(`${animalName} HUNTED! MEAT DROPPED`, 'success');

                // Play sound
                playSound('wood'); // Temporary
            }
        }

        // --- ZOOM LOGIC ---
        let targetFOV = 75;
        if (currentItem === 'bow') {
            targetFOV = aim ? 35 : 65; // Better zoom for bow
        } else if (aim) {
            targetFOV = 40;
        }

        if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
            const perspectiveCamera = camera as THREE.PerspectiveCamera;
            perspectiveCamera.fov = THREE.MathUtils.lerp(perspectiveCamera.fov, targetFOV, 0.08);
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
        // Allow jumping only when grounded and not in menu
        const grounded = pos.current[1] <= 0.55 && Math.abs(velocity.current[1]) < 0.1;
        let desiredY = velocity.current[1];
        if (jump && !jumpBuffer.current && !isAnyMenuOpen && grounded) {
            desiredY = 6.5; // Lower jump impulse
            playSound('jump');
            jumpBuffer.current = true;
        }
        if (!jump) {
            jumpBuffer.current = false;
        }

        // Apply movement velocity to physics body
        api.velocity.set(targetVelocity.x, desiredY, targetVelocity.z);

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
                {isHoldable && <HeldItem type={currentItem} count={inventory[currentItem] || 0} charge={chargeT} isDrawing={chargingShot.current} />}
            </group>

            {/* Projectiles */}
            <ArrowManager />
        </>
    );
};
