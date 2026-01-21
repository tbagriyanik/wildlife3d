import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

const AnimalAI = ({ children, position, fleeDistance, speed, name = "animal" }: { children: React.ReactNode, position: [number, number, number], fleeDistance: number, speed: number, name?: string }) => {
    const groupRef = useRef<THREE.Group>(null);
    const playerPos = useGameStore((state) => state.playerPosition);
    const [targetPos, setTargetPos] = useState(new THREE.Vector3(...position));
    const currentPos = useRef(new THREE.Vector3(...position));

    useFrame((_, delta) => {
        if (!groupRef.current) return;

        const pPos = new THREE.Vector3(...playerPos);
        const dist = currentPos.current.distanceTo(pPos);

        if (dist < fleeDistance) {
            // Flee: Away from player
            const fleeDir = currentPos.current.clone().sub(pPos).normalize();
            fleeDir.y = 0;
            const newTarget = currentPos.current.clone().add(fleeDir.multiplyScalar(6));
            setTargetPos(newTarget);
        } else if (Math.random() < 0.005) {
            // Wander
            setTargetPos(new THREE.Vector3(
                position[0] + (Math.random() - 0.5) * 30,
                groupRef.current.position.y,
                position[2] + (Math.random() - 0.5) * 30
            ));
        }

        currentPos.current.lerp(targetPos, delta * speed * 0.5);
        groupRef.current.position.copy(currentPos.current);

        const lookAtTarget = targetPos.clone();
        lookAtTarget.y = groupRef.current.position.y;
        if (groupRef.current.position.distanceTo(lookAtTarget) > 0.1) {
            groupRef.current.lookAt(lookAtTarget);
        }
    });

    return <group ref={groupRef} name={name}>{children}</group>;
};

export const Deer = ({ position }: { position: [number, number, number] }) => (
    <AnimalAI position={position} fleeDistance={15} speed={0.4}>
        {/* Body */}
        <mesh castShadow position={[0, 0.7, 0]}>
            <boxGeometry args={[0.5, 0.8, 1.4]} />
            <meshStandardMaterial color="#795548" roughness={1} />
        </mesh>
        {/* Legs */}
        {[[-0.2, 0.35, 0.5], [0.2, 0.35, 0.5], [-0.2, 0.35, -0.5], [0.2, 0.35, -0.5]].map((pos, i) => (
            <mesh key={i} position={pos as [number, number, number]} castShadow>
                <boxGeometry args={[0.12, 0.7, 0.12]} />
                <meshStandardMaterial color="#4e342e" />
            </mesh>
        ))}
        {/* Neck & Head */}
        <group position={[0, 1.3, 0.6]}>
            <mesh castShadow rotation={[0.4, 0, 0]}>
                <boxGeometry args={[0.25, 0.7, 0.25]} />
                <meshStandardMaterial color="#795548" />
            </mesh>
            <group position={[0, 0.35, 0.2]}>
                <mesh castShadow>
                    <boxGeometry args={[0.3, 0.3, 0.5]} />
                    <meshStandardMaterial color="#795548" />
                </mesh>
                {/* Antlers */}
                <group position={[0, 0.2, -0.1]}>
                    <mesh position={[0.2, 0.3, 0]} rotation={[0, 0, -0.5]}>
                        <boxGeometry args={[0.05, 0.6, 0.05]} />
                        <meshStandardMaterial color="#d7ccc8" />
                    </mesh>
                    <mesh position={[-0.2, 0.3, 0]} rotation={[0, 0, 0.5]}>
                        <boxGeometry args={[0.05, 0.6, 0.05]} />
                        <meshStandardMaterial color="#d7ccc8" />
                    </mesh>
                </group>
            </group>
        </group>
    </AnimalAI>
);

export const Rabbit = ({ position }: { position: [number, number, number] }) => (
    <AnimalAI position={position} fleeDistance={10} speed={1.2}>
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

export const Partridge = ({ position }: { position: [number, number, number] }) => (
    <AnimalAI position={position} fleeDistance={8} speed={0.8}>
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

export const Bird = ({ position }: { position: [number, number, number] }) => {
    const groupRef = useRef<THREE.Group>(null);
    const startPos = useRef(new THREE.Vector3(...position));
    const [params] = useState({
        radius: 12 + Math.random() * 20,
        speed: 0.12 + Math.random() * 0.15, // SLOWER for easier hunting
        offset: Math.random() * Math.PI * 2,
        heightVar: 1 + Math.random() * 2
    });

    useFrame((state) => {
        if (!groupRef.current) return;
        const time = state.clock.elapsedTime;
        const x = startPos.current.x + Math.cos(time * params.speed + params.offset) * params.radius;
        const z = startPos.current.z + Math.sin(time * params.speed + params.offset) * params.radius;
        const y = startPos.current.y + Math.sin(time * params.speed * 2) * params.heightVar;

        groupRef.current.position.set(x, y, z);
        const tangentX = -Math.sin(time * params.speed + params.offset);
        const tangentZ = Math.cos(time * params.speed + params.offset);
        groupRef.current.lookAt(new THREE.Vector3(x + tangentX, y, z + tangentZ));
    });

    return (
        <group ref={groupRef} name="animal">
            {/* Bird Hunting Ease: Invisible large hitbox sphere */}
            <mesh>
                <sphereGeometry args={[1.5, 8, 8]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            <group rotation={[0, -Math.PI / 2, 0]} scale={1.8}>
                <mesh castShadow>
                    <coneGeometry args={[0.15, 0.7, 8]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
                <mesh position={[0, 0.4, 0]}>
                    <sphereGeometry args={[0.18, 8, 8]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
                <mesh position={[0, 0.4, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
                    <coneGeometry args={[0.04, 0.2, 4]} />
                    <meshStandardMaterial color="#fdd835" />
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
