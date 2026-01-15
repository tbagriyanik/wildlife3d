import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useEffect } from 'react';
import { Vector3, Euler } from 'three';
import { useGameStore } from '../../store/useGameStore';
import type { Projectile } from '../../store/useGameStore';

export const Arrow = ({ data }: { data: Projectile }) => {
    const { id, position, velocity, rotation, stuck } = data;
    const stickArrow = useGameStore((state) => state.stickArrow);
    const removeProjectile = useGameStore((state) => state.removeProjectile);
    const addItem = useGameStore((state) => state.addItem);

    // Physics body for flying state
    const [ref, api] = useBox(() => ({
        mass: stuck ? 0 : 0.5, // Mass 0 = static (stuck)
        position,
        rotation,
        velocity: stuck ? [0, 0, 0] : velocity,
        args: [0.05, 0.05, 0.8],
        linearDamping: 0.1,
        // Only collide if flying
        onCollide: () => {
            if (stuck) return;
            // Get impact point and rotation
            const currentPos = new Vector3(ref.current!.position.x, ref.current!.position.y, ref.current!.position.z);
            const currentRot = new Euler().setFromQuaternion(ref.current!.quaternion);

            // Convert collision normal/contact point if needed for precise stick angle
            // For now, just freeze at current spot
            stickArrow(id, [currentPos.x, currentPos.y, currentPos.z], [currentRot.x, currentRot.y, currentRot.z]);
        }
    }));

    // Update physics body when stuck state changes
    useEffect(() => {
        if (stuck) {
            api.mass.set(0);
            api.velocity.set(0, 0, 0);
            api.angularVelocity.set(0, 0, 0);
            // Lock position/rotation to where it stuck
            api.position.set(position[0], position[1], position[2]);
            api.rotation.set(rotation[0], rotation[1], rotation[2]);
        }
    }, [stuck, position, rotation]);

    // Rotation alignment for flying arrows (face velocity direction)
    useFrame(() => {
        if (!stuck) {
            // Standard cleanup if flown too long (10s)
            if (Date.now() - data.spawnTime > 10000) {
                removeProjectile(id);
                return;
            }
        }

        // Pickup Logic check
        if (stuck) {
            const playerPos = useGameStore.getState().playerPosition;
            const dist = new Vector3(position[0], position[1], position[2]).distanceTo(new Vector3(...playerPos));
            if (dist < 4.0) {
                // Pickup
                addItem('arrow', 1);
                removeProjectile(id);
                // Play sound?
            }
        }
    });

    return (
        <mesh ref={ref as any} castShadow name="arrow">
            <boxGeometry args={[0.05, 0.05, 0.8]} />
            <meshStandardMaterial color="#4a3728" roughness={1} />
            {/* Arrow Head (Pointing -Z now) */}
            <mesh position={[0, 0, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.08, 0.2, 4]} />
                <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Fletching (Back at +Z) */}
            <mesh position={[0, 0, 0.3]}>
                <boxGeometry args={[0.01, 0.15, 0.2]} />
                <meshStandardMaterial color="#fff" />
            </mesh>
        </mesh>
    );
};

export const ArrowManager = () => {
    const projectiles = useGameStore((state) => state.projectiles);
    // Render all arrows
    return (
        <>
            {projectiles.filter(p => p.type === 'arrow').map(p => (
                <Arrow key={p.id} data={p} />
            ))}
        </>
    );
};
