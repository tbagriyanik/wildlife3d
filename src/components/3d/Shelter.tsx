import { memo } from 'react';
import { useCompoundBody } from '@react-three/cannon';
import { Fire } from './Fire';

interface ShelterProps {
    level: number;
    position: [number, number, number];
}

export const Shelter = memo(({ level, position }: ShelterProps) => {
    const [ref] = useCompoundBody(() => ({
        mass: 0,
        type: 'Static',
        position: [position[0], 0, position[2]],
        userData: { id: 'shelter' },
        shapes: level === 1 ? [
            { type: 'Box', args: [2, 2, 2], position: [0, 1, 0] }
        ] : level === 2 ? [
            // Hut Walls
            { type: 'Box', args: [0.2, 2, 3], position: [1.4, 1, 0] },
            { type: 'Box', args: [0.2, 2, 3], position: [-1.4, 1, 0] },
            { type: 'Box', args: [3, 2, 0.2], position: [0, 1, -1.4] },
            { type: 'Box', args: [1, 2, 0.2], position: [1, 1, 1.4] },
            { type: 'Box', args: [1, 2, 0.2], position: [-1, 1, 1.4] },
        ] : [
            // House Walls
            { type: 'Box', args: [0.2, 3, 5], position: [2.4, 1.5, 0] },
            { type: 'Box', args: [0.2, 3, 5], position: [-2.4, 1.5, 0] },
            { type: 'Box', args: [5, 3, 0.2], position: [0, 1.5, -2.4] },
            { type: 'Box', args: [2, 3, 0.2], position: [1.5, 1.5, 2.4] },
            { type: 'Box', args: [2, 3, 0.2], position: [-1.5, 1.5, 2.4] },
        ]
    }));

    if (level === 0) return null;

    return (
        <group ref={ref as any} name="shelter" userData={{ id: 'shelter', interactable: true }}>
            {level === 1 && <Tent />}
            {level === 2 && <Hut />}
            {level === 3 && <House />}
            {/* Permanent Campfire */}
            <group position={[level === 1 ? 2 : 3, 0, 0]} name="shelter_fire">
                {[...Array(6)].map((_, i) => (
                    <mesh key={i} position={[Math.cos(i * Math.PI / 3) * 0.4, 0.05, Math.sin(i * Math.PI / 3) * 0.4]}>
                        <dodecahedronGeometry args={[0.1, 0]} />
                        <meshStandardMaterial color="#444" />
                    </mesh>
                ))}
                <Fire scale={0.8} />
            </group>
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
        {/* Walls */}
        <mesh castShadow position={[1.4, 1, 0]}>
            <boxGeometry args={[0.2, 2, 3]} />
            <meshStandardMaterial color="#795548" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-1.4, 1, 0]}>
            <boxGeometry args={[0.2, 2, 3]} />
            <meshStandardMaterial color="#795548" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 1, -1.4]}>
            <boxGeometry args={[3, 2, 0.2]} />
            <meshStandardMaterial color="#795548" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[1, 1, 1.4]}>
            <boxGeometry args={[1, 2, 0.2]} />
            <meshStandardMaterial color="#795548" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-1, 1, 1.4]}>
            <boxGeometry args={[1, 2, 0.2]} />
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
        {/* Walls */}
        <mesh castShadow position={[2.4, 1.5, 0]}>
            <boxGeometry args={[0.2, 3, 5]} />
            <meshStandardMaterial color="#8d6e63" />
        </mesh>
        <mesh castShadow position={[-2.4, 1.5, 0]}>
            <boxGeometry args={[0.2, 3, 5]} />
            <meshStandardMaterial color="#8d6e63" />
        </mesh>
        <mesh castShadow position={[0, 1.5, -2.4]}>
            <boxGeometry args={[5, 3, 0.2]} />
            <meshStandardMaterial color="#8d6e63" />
        </mesh>
        <mesh castShadow position={[1.5, 1.5, 2.4]}>
            <boxGeometry args={[2, 3, 0.2]} />
            <meshStandardMaterial color="#8d6e63" />
        </mesh>
        <mesh castShadow position={[-1.5, 1.5, 2.4]}>
            <boxGeometry args={[2, 3, 0.2]} />
            <meshStandardMaterial color="#8d6e63" />
        </mesh>

        {/* Roof */}
        <mesh castShadow position={[0, 3.5, 0]}>
            <boxGeometry args={[5.5, 1, 5.5]} />
            <meshStandardMaterial color="#5d4037" roughness={1} />
        </mesh>
        {/* Chimney */}
        <mesh castShadow position={[1.5, 3.5, 0]}>
            <boxGeometry args={[0.5, 2, 0.5]} />
            <meshStandardMaterial color="#4e342e" />
        </mesh>
        {/* Windows */}
        <mesh position={[1, 2, 2.45]}>
            <boxGeometry args={[0.8, 0.8, 0.1]} />
            <meshStandardMaterial color="#81d4fa" emissive="#01579b" emissiveIntensity={0.2} transparent opacity={0.6} />
        </mesh>
        <mesh position={[-1, 2, 2.45]}>
            <boxGeometry args={[0.8, 0.8, 0.1]} />
            <meshStandardMaterial color="#81d4fa" emissive="#01579b" emissiveIntensity={0.2} transparent opacity={0.6} />
        </mesh>
    </group>
);
