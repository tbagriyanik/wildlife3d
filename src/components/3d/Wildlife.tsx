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

        currentPos.current.lerp(targetPos, delta * speed);
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
    <AnimalAI position={position} fleeDistance={15} speed={0.8}>
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
    <AnimalAI position={position} fleeDistance={10} speed={2}>
        <mesh castShadow position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.3]} />
            <meshStandardMaterial color="#eeeeee" roughness={1} metalness={0} envMapIntensity={0} />
        </mesh>
    </AnimalAI>
);
