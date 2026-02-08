import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

const AnimalAI = ({ children, position, fleeDistance, speed, name = "animal", id }: { children: React.ReactNode, position: [number, number, number], fleeDistance: number, speed: number, name?: string, id: string }) => {
    const groupRef = useRef<THREE.Group>(null);
    const playerPos = useGameStore((state) => state.playerPosition);
    const wildlife = useGameStore((state) => state.wildlife);
    const animal = wildlife.find(w => w.id === id);
    const currentHealth = animal?.health || 1;

    const [targetPos, setTargetPos] = useState(new THREE.Vector3(...position));
    const currentPos = useRef(new THREE.Vector3(...position));
    const lastHealthRef = useRef(currentHealth);

    // Kinematic physics body for arrow collisions
    const [physicsRef, api] = useSphere(() => ({
        type: 'Kinematic',
        args: [name === 'deer' ? 1 : 0.6], // Larger radius for deer
        position: [...position],
        userData: { id }
    }));

    useFrame((_, delta) => {
        if (!groupRef.current || useGameStore.getState().isMainMenuOpen) return;

        const pPos = new THREE.Vector3(...playerPos);
        const dist = currentPos.current.distanceTo(pPos);

        // If animal was just hit (health decreased), force aggressive fleeing
        if (currentHealth < lastHealthRef.current) {
            lastHealthRef.current = currentHealth;
            // Force fleeing when hit
            const fleeDir = currentPos.current.clone().sub(pPos).normalize();
            fleeDir.y = 0;
            const newTarget = currentPos.current.clone().add(fleeDir.multiplyScalar(15)); // Flee further
            setTargetPos(newTarget);
        } else {
            lastHealthRef.current = currentHealth;
        }

        if (dist < fleeDistance) {
            // Flee: Away from player
            const fleeDir = currentPos.current.clone().sub(pPos).normalize();
            fleeDir.y = 0;
            const newTarget = currentPos.current.clone().add(fleeDir.multiplyScalar(6));
            setTargetPos(newTarget);
        } else if (Math.random() < 0.005) {
            // Wander
            setTargetPos(new THREE.Vector3(
                position[0] + (Math.random() - 0.5) * 40,
                0,
                position[2] + (Math.random() - 0.5) * 40
            ));
        }

        // 1. Rotate towards target smoothly
        const lookAtTarget = targetPos.clone();
        lookAtTarget.y = 0;

        if (currentPos.current.distanceTo(lookAtTarget) > 0.5) {
            // Calculate angle to target
            const targetRotation = Math.atan2(
                lookAtTarget.x - currentPos.current.x,
                lookAtTarget.z - currentPos.current.z
            );

            // Smoothly interpolate rotation
            const currentRotation = groupRef.current.rotation.y;
            groupRef.current.rotation.y = THREE.MathUtils.lerp(currentRotation, targetRotation, delta * 2);

            // 2. Move forward in the CURRENT facing direction
            const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), groupRef.current.rotation.y);
            currentPos.current.add(forward.multiplyScalar(delta * speed * 5));
        }

        groupRef.current.position.copy(currentPos.current);

        // Sync physics body to AI position
        api.position.set(currentPos.current.x, currentPos.current.y + (name === 'deer' ? 0.7 : 0.3), currentPos.current.z);
    });

    return (
        <group ref={groupRef} name={name}>
            {/* Physics target - also used for raycast interaction */}
            <mesh ref={physicsRef as any} name={name}>
                <sphereGeometry args={[name === 'deer' ? 1 : 0.6]} />
                <meshStandardMaterial transparent opacity={0} />
            </mesh>
            {children}
        </group>
    );
};

export const Deer = ({ position, id }: { position: [number, number, number], id: string }) => (
    <AnimalAI position={position} fleeDistance={15} speed={1.4} id={id} name="deer">
        <group scale={1.3}>
            {/* Body */}
            <mesh castShadow position={[0, 0.2, 0]}>
                <sphereGeometry args={[0.4, 12, 12]} />
                <meshStandardMaterial color="#8b6f47" />
            </mesh>
            {/* Head */}
            <mesh castShadow position={[0, 0.4, 0.3]}>
                <sphereGeometry args={[0.25, 12, 12]} />
                <meshStandardMaterial color="#8b6f47" />
            </mesh>
            {/* Antlers */}
            <group position={[0, 0.6, 0.25]}>
                <mesh position={[0.2, 0.3, 0]} rotation={[0, 0, -0.5]}>
                    <boxGeometry args={[0.05, 0.6, 0.05]} />
                    <meshStandardMaterial color="#d7ccc8" />
                </mesh>
                <mesh position={[-0.2, 0.3, 0]} rotation={[0, 0, 0.5]}>
                    <boxGeometry args={[0.05, 0.6, 0.05]} />
                    <meshStandardMaterial color="#d7ccc8" />
                </mesh>
            </group>
            {/* Tail */}
            <mesh position={[0, 0.2, -0.35]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshStandardMaterial color="#fff" />
            </mesh>
        </group>
    </AnimalAI>
);

export const Rabbit = ({ position, id }: { position: [number, number, number], id: string }) => (
    <AnimalAI position={position} fleeDistance={12} speed={1.2} id={id} name="rabbit">
        <group scale={1.2}>
            {/* Body */}
            <mesh castShadow position={[0, 0.2, 0]}>
                <sphereGeometry args={[0.35, 12, 12]} />
                <meshStandardMaterial color="#d1d1d1" />
            </mesh>
            {/* Head */}
            <mesh castShadow position={[0, 0.45, 0.25]}>
                <sphereGeometry args={[0.2, 12, 12]} />
                <meshStandardMaterial color="#d1d1d1" />
            </mesh>
            {/* Ears */}
            <mesh position={[0.08, 0.7, 0.2]} rotation={[0.1, 0, -0.1]}>
                <boxGeometry args={[0.06, 0.4, 0.12]} />
                <meshStandardMaterial color="#f8bbd0" />
            </mesh>
            <mesh position={[-0.08, 0.7, 0.2]} rotation={[0.1, 0, 0.1]}>
                <boxGeometry args={[0.06, 0.4, 0.12]} />
                <meshStandardMaterial color="#f8bbd0" />
            </mesh>
            {/* Tail */}
            <mesh position={[0, 0.2, -0.3]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshStandardMaterial color="#fff" />
            </mesh>
        </group>
    </AnimalAI>
);

export const Partridge = ({ position, id }: { position: [number, number, number], id: string }) => (
    <AnimalAI position={position} fleeDistance={10} speed={0.8} id={id} name="partridge">
        <group scale={1.5}>
            {/* Body - Rounder */}
            <mesh castShadow position={[0, 0.25, 0]}>
                <sphereGeometry args={[0.25, 12, 12]} />
                <meshStandardMaterial color="#a1887f" />
            </mesh>
            {/* Head */}
            <mesh castShadow position={[0, 0.45, 0.15]}>
                <sphereGeometry args={[0.12, 8, 8]} />
                <meshStandardMaterial color="#8d6e63" />
            </mesh>
            {/* Beak */}
            <mesh position={[0, 0.45, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.03, 0.1, 4]} />
                <meshStandardMaterial color="#ff5722" />
            </mesh>
            {/* Distinct Pattern Wings */}
            <mesh position={[0.2, 0.3, 0]} rotation={[0, 0, 0.2]}>
                <boxGeometry args={[0.05, 0.2, 0.3]} />
                <meshStandardMaterial color="#5d4037" />
            </mesh>
            <mesh position={[-0.2, 0.3, 0]} rotation={[0, 0, -0.2]}>
                <boxGeometry args={[0.05, 0.2, 0.3]} />
                <meshStandardMaterial color="#5d4037" />
            </mesh>
        </group>
    </AnimalAI>
);

export const Bird = ({ position, id }: { position: [number, number, number], id: string }) => {
    const groupRef = useRef<THREE.Group>(null);
    const startPos = useRef(new THREE.Vector3(...position));
    const [params] = useState({
        radius: 12 + Math.random() * 20,
        speed: 0.12 + Math.random() * 0.15, // SLOWER for easier hunting
        offset: Math.random() * Math.PI * 2,
        heightVar: 1 + Math.random() * 2
    });

    // Bird physics body for arrow collisions
    const [physicsRef, api] = useSphere(() => ({
        type: 'Kinematic',
        args: [1.5], // Large hitbox
        position,
        userData: { id }
    }));

    useFrame((state) => {
        if (!groupRef.current || useGameStore.getState().isMainMenuOpen) return;
        const time = state.clock.elapsedTime;
        const x = startPos.current.x + Math.cos(time * params.speed + params.offset) * params.radius;
        const z = startPos.current.z + Math.sin(time * params.speed + params.offset) * params.radius;
        const y = startPos.current.y + Math.sin(time * params.speed * 2) * params.heightVar;

        groupRef.current.position.set(x, y, z);
        // Sync physics body
        api.position.set(x, y, z);

        const tangentX = -Math.sin(time * params.speed + params.offset);
        const tangentZ = Math.cos(time * params.speed + params.offset);
        groupRef.current.lookAt(new THREE.Vector3(x + tangentX, y, z + tangentZ));
    });

    return (
        <group ref={groupRef} name="animal">
            {/* Physics target - bird specific */}
            <mesh ref={physicsRef as any} name="animal_bird">
                <sphereGeometry args={[1.5]} />
                <meshStandardMaterial transparent opacity={0} />
            </mesh>

            <group rotation={[0, -Math.PI / 2, 0]} scale={2}>
                {/* Body - More aerodynamic */}
                <mesh castShadow>
                    <sphereGeometry args={[0.2, 8, 8]} />
                    <meshStandardMaterial color="#333" />
                </mesh>

                {/* Tail */}
                <mesh position={[-0.2, 0, 0]} rotation={[0, 0, 0.2]}>
                    <boxGeometry args={[0.3, 0.02, 0.2]} />
                    <meshStandardMaterial color="#222" />
                </mesh>

                {/* Head */}
                <mesh position={[0.22, 0.1, 0]}>
                    <sphereGeometry args={[0.12, 8, 8]} />
                    <meshStandardMaterial color="#444" />
                </mesh>

                {/* Beak */}
                <mesh position={[0.35, 0.08, 0]} rotation={[0, 0, -Math.PI / 2]}>
                    <coneGeometry args={[0.03, 0.15, 4]} />
                    <meshStandardMaterial color="#fcd34d" />
                </mesh>

                {/* Eyes */}
                <mesh position={[0.28, 0.15, 0.06]}>
                    <sphereGeometry args={[0.02]} />
                    <meshStandardMaterial color="white" />
                </mesh>
                <mesh position={[0.28, 0.15, -0.06]}>
                    <sphereGeometry args={[0.02]} />
                    <meshStandardMaterial color="white" />
                </mesh>

                <Wing side={1} />
                <Wing side={-1} />
            </group>
        </group>
    );
};

const Wing = ({ side }: { side: number }) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (!ref.current || useGameStore.getState().isMainMenuOpen) return;
        if (ref.current) {
            ref.current.rotation.z = Math.sin(clock.elapsedTime * 6) * 0.4 * side;
        }
    });
    return (
        <mesh ref={ref} position={[0, 0.05, 0]} rotation={[0, 0, side * 0.2]}>
            <boxGeometry args={[0.7, 0.02, 0.35]} />
            <meshStandardMaterial color="#424242" />
        </mesh>
    );
};
