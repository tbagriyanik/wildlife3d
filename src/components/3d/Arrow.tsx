import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useEffect } from 'react';
import { Vector3, Euler } from 'three';
import { useGameStore } from '../../store/useGameStore';
import { TRANSLATIONS } from '../../constants/translations';
import type { Projectile } from '../../store/useGameStore';

export const Arrow = ({ data }: { data: Projectile }) => {
    const { id, position, velocity, rotation, stuck } = data;
    const stickArrow = useGameStore((state) => state.stickArrow);
    const removeProjectile = useGameStore((state) => state.removeProjectile);
    const addItem = useGameStore((state) => state.addItem);

    // Physics body
    const [ref, api] = useBox(() => ({
        mass: stuck ? 0 : 0.5,
        position,
        rotation,
        velocity: stuck ? [0, 0, 0] : velocity,
        args: [0.12, 0.12, 0.8],
        linearDamping: 0.1,
        onCollide: (e: any) => {
            if (stuck) return;
            const currentPos = new Vector3(ref.current!.position.x, ref.current!.position.y, ref.current!.position.z);
            const currentRot = new Euler().setFromQuaternion(ref.current!.quaternion);
            const hitToId = e.body.userData?.id;

            // Hunting logic: Check if we hit an animal
            if (hitToId && (hitToId.includes('deer') || hitToId.includes('rabbit') || hitToId.includes('bird') || hitToId.includes('partridge'))) {
                const state = useGameStore.getState();
                const t = TRANSLATIONS[state.language];
                state.removeWildlife(hitToId);
                state.addItem('meat', 2);
                state.addNotification(`${t.collected_msg}: 2x ${(t as any).meat}`, 'success');
                removeProjectile(id);
                return;
            }

            stickArrow(id, [currentPos.x, currentPos.y, currentPos.z], [currentRot.x, currentRot.y, currentRot.z], hitToId);
        }
    }));

    useEffect(() => {
        if (stuck) {
            api.mass.set(0);
            api.velocity.set(0, 0, 0);
            api.angularVelocity.set(0, 0, 0);
            api.position.set(position[0], position[1], position[2]);
            api.rotation.set(rotation[0], rotation[1], rotation[2]);
        } else {
            api.mass.set(0.5);
        }
    }, [stuck, position, rotation, api]);

    useFrame(() => {
        const state = useGameStore.getState();
        if (!stuck) {
            if (Date.now() - data.spawnTime > 10000) {
                removeProjectile(id);
            }
        } else {
            // Drop logic if target is gone
            if (data.stuckToId) {
                const wr = state.worldResources;
                const resources = [...wr.trees, ...wr.rocks, ...wr.bushes, ...state.wildlife];
                if (!resources.some(r => r.id === data.stuckToId)) {
                    useGameStore.setState(s => ({
                        projectiles: s.projectiles.map(p => p.id === id ? { ...p, stuck: false, stuckToId: undefined } : p)
                    }));
                }
            }

            // Pickup Logic
            const playerPos = state.playerPosition;
            const dist = new Vector3(position[0], position[1], position[2]).distanceTo(new Vector3(...playerPos));
            if (dist < 2.5) {
                addItem('arrow', 1);
                removeProjectile(id);
            }
        }
    });

    return (
        <mesh ref={ref as any} castShadow name="arrow">
            <boxGeometry args={[0.08, 0.08, 0.8]} />
            <meshStandardMaterial color="#4a3728" roughness={1} />
            <mesh position={[0, 0, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.08, 0.2, 4]} />
                <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.3]}>
                <boxGeometry args={[0.01, 0.15, 0.2]} />
                <meshStandardMaterial color="#fff" />
            </mesh>
        </mesh>
    );
};

export const ArrowManager = () => {
    const projectiles = useGameStore((state) => state.projectiles);
    return (
        <>
            {projectiles.filter(p => p.type === 'arrow').map(p => (
                <Arrow key={p.id} data={p} />
            ))}
        </>
    );
};
