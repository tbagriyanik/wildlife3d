import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3, Euler } from 'three';
import { useGameStore } from '../../store/useGameStore';
import { TRANSLATIONS } from '../../constants/translations';
import type { Projectile } from '../../store/useGameStore';
import * as THREE from 'three';

const Blood = ({ position, velocity }: { position: [number, number, number], velocity: [number, number, number] }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const vel = new Vector3(...velocity);
    const pos = new Vector3(...position);

    useFrame((_, delta) => {
        if (!meshRef.current) return;
        vel.y -= 9.81 * delta; // Gravity
        pos.add(vel.clone().multiplyScalar(delta));
        meshRef.current.position.copy(pos);
        meshRef.current.scale.multiplyScalar(0.95); // Fade out
    });

    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#880000" emissive="#440000" />
        </mesh>
    );
};

export const Arrow = ({ data }: { data: Projectile }) => {
    const { id, position, velocity, rotation, stuck } = data;
    const stickArrow = useGameStore((state) => state.stickArrow);
    const removeProjectile = useGameStore((state) => state.removeProjectile);

    // Physics body
    const [ref, api] = useBox(() => ({
        mass: stuck ? 0 : 0.5,
        position,
        rotation,
        velocity: stuck ? [0, 0, 0] : velocity,
        args: [0.12, 0.12, 0.8],
        linearDamping: 0.1,
        userData: { id },
        onCollide: (e: any) => {
            if (stuck) return;
            const currentPos = new Vector3(ref.current!.position.x, ref.current!.position.y, ref.current!.position.z);
            const currentRot = new Euler().setFromQuaternion(ref.current!.quaternion);

            // Extensive check for hit target
            const hitBody = e.body;
            const hitToId = hitBody.userData?.id || hitBody.name;

            // Hunting logic: Check if we hit an animal
            const isAnimal = hitToId && (
                hitToId.includes('deer') ||
                hitToId.includes('rabbit') ||
                hitToId.includes('bird') ||
                hitToId.includes('partridge') ||
                hitToId.includes('animal')
            );

            if (isAnimal) {
                const state = useGameStore.getState();
                const t = TRANSLATIONS[state.language];
                state.spawnBlood([currentPos.x, currentPos.y, currentPos.z]); // Spawn blood

                // If hitToId is just 'animal', try to find a more specific ID in userData
                const actualId = (hitToId === 'animal' || !hitToId.includes('-')) ? hitBody.userData?.id : hitToId;

                state.removeWildlife(actualId || hitToId);
                state.addItem('meat', 2);
                state.addNotification(`${t.collected_msg}: 2x ${state.language === 'tr' ? 'Çiğ Et' : 'Raw Meat'}`, 'success');

                // Instead of removing, stick it to the "phantom" or ground where animal was
                stickArrow(id, [currentPos.x, currentPos.y, currentPos.z], [currentRot.x, currentRot.y, currentRot.z], actualId || hitToId);
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
        } else {
            api.mass.set(0.5);
        }
    }, [stuck, api]);

    useFrame(() => {
        const state = useGameStore.getState();

        // Always check for pickup if player is close
        const playerPos = state.playerPosition;
        const arrowPos = new Vector3(ref.current?.position.x || 0, ref.current?.position.y || 0, ref.current?.position.z || 0);
        const distToPlayer = arrowPos.distanceTo(new Vector3(...playerPos));

        if (distToPlayer < 2.5) {
            useGameStore.getState().addItem('arrow', 1);
            removeProjectile(id);
            return;
        }

        if (!stuck) {
            if (Date.now() - data.spawnTime > 15000) {
                removeProjectile(id);
            }
        } else {
            // Drop logic if target is gone
            if (data.stuckToId) {
                const wr = state.worldResources;
                const resources = [...wr.trees, ...wr.rocks, ...wr.bushes, ...state.wildlife, ...state.placedItems];
                if (!resources.some(r => r.id === data.stuckToId)) {
                    // Target object is gone! Make arrow fall.
                    useGameStore.setState(s => ({
                        projectiles: s.projectiles.map(p => p.id === id ? { ...p, stuck: false, stuckToId: undefined } : p)
                    }));
                }
            }
        }
    });

    return (
        <mesh ref={ref as any} castShadow name="arrow" userData={{ id }}>
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
    const removeProjectile = useGameStore((state) => state.removeProjectile);

    useFrame(() => {
        // Automatically remove blood after 1 second
        projectiles.filter(p => p.type as any === 'blood').forEach(p => {
            if (Date.now() - p.spawnTime > 1000) {
                removeProjectile(p.id);
            }
        });
    });

    return (
        <>
            {projectiles.map(p => {
                if (p.type === 'arrow') return <Arrow key={p.id} data={p} />;
                if (p.type as any === 'blood') return <Blood key={p.id} position={p.position} velocity={p.velocity} />;
                return null;
            })}
        </>
    );
};
