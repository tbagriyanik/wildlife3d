import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';


interface ArrowProps {
    position: [number, number, number];
    velocity: [number, number, number];
    rotation: [number, number, number];
    onHit: () => void;
}

export const Arrow = ({ position, velocity, rotation, onHit }: ArrowProps) => {
    const [ref] = useBox(() => ({
        mass: 1,
        position,
        rotation,
        velocity,
        args: [0.05, 0.05, 0.5],
        onCollide: () => {
            onHit();
        }
    }));

    const lifeTime = useRef(0);
    const [removed, setRemoved] = useState(false);

    useFrame((_, delta) => {
        lifeTime.current += delta;
        if (lifeTime.current > 5) setRemoved(true); // Auto-remove after 5s
    });

    if (removed) return null;

    return (
        <mesh ref={ref as any} castShadow>
            <boxGeometry args={[0.05, 0.05, 0.8]} />
            <meshStandardMaterial color="#4a3728" roughness={1} />
            {/* Arrow Head */}
            <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.08, 0.2, 4]} />
                <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Fletching */}
            <mesh position={[0, 0, -0.3]}>
                <boxGeometry args={[0.01, 0.15, 0.2]} />
                <meshStandardMaterial color="#fff" />
            </mesh>
        </mesh>
    );
};

export const ArrowManager = () => {
    // This will be handled via state or events if needed, 
    // but for now we can spawn them directly from Player.tsx if we use a global state or a hook.
    // However, to keep it simple, I'll export a custom event or use the store.
    return null;
};
