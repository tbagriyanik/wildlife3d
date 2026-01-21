import { memo } from 'react';

interface ShelterProps {
    level: number;
    position: [number, number, number];
}

export const Shelter = memo(({ level, position }: ShelterProps) => {
    if (level === 0) return null;

    return (
        <group position={position}>
            {level >= 1 && <Tent />}
            {level >= 2 && <Hut />}
            {level >= 3 && <House />}
        </group>
    );
});

const Tent = () => (
    <group>
        <mesh castShadow position={[0, 0.75, 0]}>
            <coneGeometry args={[1.5, 1.5, 4]} />
            <meshStandardMaterial color="#5d4037" roughness={1} />
        </mesh>
        <mesh position={[0, 0.05, 1.2]} rotation={[-Math.PI / 4, 0, 0]}>
            <boxGeometry args={[0.8, 1.2, 0.05]} />
            <meshStandardMaterial color="#3e2723" />
        </mesh>
    </group>
);

const Hut = () => (
    <group position={[0, 0, 0]}>
        {/* Wall */}
        <mesh castShadow position={[0, 1, 0]}>
            <boxGeometry args={[3, 2, 3]} />
            <meshStandardMaterial color="#795548" roughness={0.9} />
        </mesh>
        {/* Roof */}
        <mesh castShadow position={[0, 2.5, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[2.5, 1.5, 4]} />
            <meshStandardMaterial color="#4e342e" roughness={1} />
        </mesh>
    </group>
);

const House = () => (
    <group position={[0, 0, 0]}>
        {/* Base */}
        <mesh castShadow position={[0, 1.5, 0]}>
            <boxGeometry args={[5, 3, 4]} />
            <meshStandardMaterial color="#8d6e63" roughness={0.8} />
        </mesh>
        {/* Roof */}
        <mesh castShadow position={[0, 3.5, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[5.5, 1, 4.5]} />
            <meshStandardMaterial color="#5d4037" roughness={1} />
        </mesh>
        {/* Chimney */}
        <mesh castShadow position={[1.5, 3.5, 0]}>
            <boxGeometry args={[0.5, 2, 0.5]} />
            <meshStandardMaterial color="#4e342e" />
        </mesh>
        {/* Windows */}
        <mesh position={[1.5, 2, 2.01]}>
            <boxGeometry args={[0.8, 0.8, 0.05]} />
            <meshStandardMaterial color="#81d4fa" emissive="#01579b" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[-1.5, 2, 2.01]}>
            <boxGeometry args={[0.8, 0.8, 0.05]} />
            <meshStandardMaterial color="#81d4fa" emissive="#01579b" emissiveIntensity={0.2} />
        </mesh>
    </group>
);
