import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

const AnimalAI = ({ children, position, fleeDistance, speed }: { children: React.ReactNode, position: [number, number, number], fleeDistance: number, speed: number }) => {
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
                0,
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

    return <group ref={groupRef}>{children}</group>;
};

export const Deer = ({ position }: { position: [number, number, number] }) => (
    <AnimalAI position={position} fleeDistance={15} speed={0.4}>
        <mesh castShadow position={[0, 0.6, 0]}>
            <boxGeometry args={[0.4, 0.8, 1.2]} />
            <meshStandardMaterial color="#8d6e63" roughness={1} metalness={0} envMapIntensity={0} />
        </mesh>
        <mesh castShadow position={[0, 1.2, 0.6]}>
            <boxGeometry args={[0.3, 0.4, 0.4]} />
            <meshStandardMaterial color="#8d6e63" roughness={1} metalness={0} envMapIntensity={0} />
        </mesh>
    </AnimalAI>
);

export const Rabbit = ({ position }: { position: [number, number, number] }) => (
    <AnimalAI position={position} fleeDistance={10} speed={1.2}>
        <mesh castShadow position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.3]} />
            <meshStandardMaterial color="#eeeeee" roughness={1} metalness={0} envMapIntensity={0} />
        </mesh>
    </AnimalAI>
);


export const Bird = ({ position }: { position: [number, number, number] }) => {
    const groupRef = useRef<THREE.Group>(null);
    const startPos = useRef(new THREE.Vector3(...position));
    // Random circling parameters
    const [params] = useState({
        radius: 10 + Math.random() * 15,
        speed: 0.2 + Math.random() * 0.3,
        offset: Math.random() * Math.PI * 2,
        heightVar: Math.random() * 2
    });

    useFrame((state) => {
        if (!groupRef.current) return;

        const time = state.clock.elapsedTime;
        // Circular motion
        const x = startPos.current.x + Math.cos(time * params.speed + params.offset) * params.radius;
        const z = startPos.current.z + Math.sin(time * params.speed + params.offset) * params.radius;
        const y = startPos.current.y + Math.sin(time * params.speed * 2) * params.heightVar;

        groupRef.current.position.set(x, y, z);

        // Face direction of movement
        const tangentX = -Math.sin(time * params.speed + params.offset);
        const tangentZ = Math.cos(time * params.speed + params.offset);
        const lookTarget = new THREE.Vector3(x + tangentX, y, z + tangentZ);
        groupRef.current.lookAt(lookTarget);
    });

    return (
        <group ref={groupRef}>
            {/* Simple Bird Model */}
            <group rotation={[0, -Math.PI / 2, 0]}>
                {/* Body */}
                <mesh castShadow>
                    <coneGeometry args={[0.2, 0.8, 8]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                {/* Wings - flapping */}
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
            ref.current.rotation.z = Math.sin(clock.elapsedTime * 10) * 0.5 * side;
        }
    });
    return (
        <mesh ref={ref} position={[0, 0.1, 0]} rotation={[0, 0, side * 0.2]}>
            <boxGeometry args={[0.6, 0.05, 0.3]} />
            <meshStandardMaterial color="#444" />
            <group position={[side * 0.3, 0, 0]}>
                {/* Wing tip */}
            </group>
        </mesh>
    );
}
