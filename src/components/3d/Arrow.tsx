import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { useGameStore } from '../../store/useGameStore';
import type { Projectile } from '../../store/useGameStore';
import * as THREE from 'three';

const BloodSplatter = ({ position, velocity }: { position: [number, number, number], velocity: [number, number, number] }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const vel = new Vector3(...velocity);
    const pos = new Vector3(...position);

    useFrame((_, delta) => {
        if (!meshRef.current) return;
        vel.y -= 9.81 * delta * 2; // Faster gravity for blood
        pos.add(vel.clone().multiplyScalar(delta));
        meshRef.current.position.copy(pos);
        meshRef.current.scale.multiplyScalar(0.92); // Fade faster
        if (meshRef.current.scale.x < 0.1) {
            // Remove when too small
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color="#8B0000" emissive="#440000" />
        </mesh>
    );
};

export const Arrow = ({ data }: { data: Projectile }) => {
    const { id, position, velocity, rotation, stuck } = data;
    const stickArrow = useGameStore((state) => state.stickArrow);
    const removeProjectile = useGameStore((state) => state.removeProjectile);
    const addNotification = useGameStore((state) => state.addNotification);

    // Physics body with better collision
    const [ref, api] = useBox(() => ({
        mass: 0.3,
        position,
        rotation,
        velocity,
        args: [0.05, 0.05, 0.7], // Smaller collision box
        linearDamping: 0.02,
        angularDamping: 0.8,
        userData: { id, type: 'arrow' },
        onCollide: (e: any) => {
            if (stuck) return;

            const hitBody = e.body;
            const hitToId = hitBody.userData?.id || hitBody.name;

            // Check for animal hit
            const isAnimal = hitToId && (
                hitToId.includes('deer') ||
                hitToId.includes('rabbit') ||
                hitToId.includes('bird') ||
                hitToId.includes('partridge')
            );

            const currentPos = ref.current!.position;
            const currentRot = ref.current!.quaternion;

            if (isAnimal) {
                const state = useGameStore.getState();

                // Spawn blood particles
                for (let i = 0; i < 8; i++) {
                    state.spawnBlood([
                        currentPos.x + (Math.random() - 0.5) * 0.5,
                        currentPos.y + Math.random() * 0.3,
                        currentPos.z + (Math.random() - 0.5) * 0.5
                    ]);
                }

                // Remove wildlife and drop meat
                state.removeWildlife(hitToId);
                const meatAmount = hitToId.includes('deer') ? 2 : 1;
                state.addDroppedItem('meat', meatAmount, [currentPos.x, currentPos.y + 0.2, currentPos.z]);

                // Notification
                const animalName = hitToId.includes('deer') ? 'DEER' : hitToId.includes('rabbit') ? 'RABBIT' : 'BIRD';
                addNotification(`${animalName} HUNTED! MEAT DROPPED`, 'success');

                // Stick arrow
                stickArrow(id, currentPos.toArray(), currentRot.toArray().slice(0, 3) as [number, number, number], hitToId);
            } else if (!hitToId?.includes('player') && !hitToId?.includes('arrow')) {
                // Stick to environment
                stickArrow(id, currentPos.toArray(), currentRot.toArray().slice(0, 3) as [number, number, number], hitToId);
            }
        }
    }));

    const localVel = useRef([0, 0, 0]);
    useEffect(() => {
        const unsubscribe = api.velocity.subscribe(v => localVel.current = v);
        return () => unsubscribe();
    }, [api]);

    useEffect(() => {
        if (stuck) {
            api.mass.set(0);
            api.velocity.set(0, 0, 0);
            api.angularVelocity.set(0, 0, 0);
        } else {
            api.mass.set(0.3);
            // Give a tiny downward nudge so dropped arrows fall reliably
            api.velocity.set(0, -0.5, 0);
            api.angularVelocity.set(0, 0, 0);
        }
    }, [stuck, api]);

    useFrame(() => {
        const state = useGameStore.getState();
        const playerPos = state.playerPosition;
        const arrowPos = ref.current?.position || new Vector3(...position);
        const distToPlayer = arrowPos.distanceTo(new Vector3(...playerPos));

        // Align arrow with velocity while in flight
        if (!stuck && ref.current) {
            const v = new THREE.Vector3(...localVel.current);
            if (v.lengthSq() > 0.01) {
                const forward = new THREE.Vector3(0, 0, 1);
                const dir = v.normalize();
                const quat = new THREE.Quaternion().setFromUnitVectors(forward, dir);
                ref.current.quaternion.slerp(quat, 0.35);
            }
        }

        // Auto-pickup only when stuck
        if (distToPlayer < 1.8 && stuck) {
            state.addItem('arrow', 1);
            removeProjectile(id);
            addNotification('ARROW RECOVERED', 'info');
            return;
        }

        // Remove after timeout if not stuck
        if (!stuck && Date.now() - data.spawnTime > 10000) {
            removeProjectile(id);
            return;
        }

        // Check if stuck object still exists
        if (stuck && data.stuckToId) {
            const wr = state.worldResources;
            const activeObjects = [...wr.trees, ...wr.rocks, ...wr.bushes, ...state.wildlife, ...state.shelters, ...state.placedItems];
            if (!activeObjects.some(r => r.id === data.stuckToId)) {
                // Object disappeared, make arrow fall
                useGameStore.setState(s => ({
                    projectiles: s.projectiles.map(p => p.id === id ? { ...p, stuck: false, stuckToId: undefined } : p)
                }));
            }
        }
    });

    return (
        <group>
            <mesh ref={ref as any} castShadow name="arrow" userData={{ id, type: 'arrow' }}>
                {/* Arrow shaft (aligned forward on +Z) */}
                <mesh position={[0, 0, 0.0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.62]} />
                    <meshStandardMaterial color="#8B4513" />
                </mesh>

                {/* Arrow head (front) */}
                <mesh position={[0, 0, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
                    <coneGeometry args={[0.04, 0.16, 6]} />
                    <meshStandardMaterial color="#666666" metalness={0.8} />
                </mesh>

                {/* Fletching (rear) */}
                <mesh position={[0, 0, -0.34]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[0.08, 0.02, 0.1]} />
                    <meshStandardMaterial color="#DC143C" />
                </mesh>
                <mesh position={[0, 0, -0.34]} rotation={[0, Math.PI / 3, 0]}>
                    <boxGeometry args={[0.08, 0.02, 0.1]} />
                    <meshStandardMaterial color="#DC143C" />
                </mesh>
                <mesh position={[0, 0, -0.34]} rotation={[0, -Math.PI / 3, 0]}>
                    <boxGeometry args={[0.08, 0.02, 0.1]} />
                    <meshStandardMaterial color="#DC143C" />
                </mesh>
            </mesh>
        </group>
    );
};

export const ArrowManager = () => {
    const projectiles = useGameStore((state) => state.projectiles);
    const removeProjectile = useGameStore((state) => state.removeProjectile);

    useFrame(() => {
        // Auto-remove blood particles
        projectiles.filter(p => p.type === 'blood').forEach(p => {
            if (Date.now() - p.spawnTime > 2000) {
                removeProjectile(p.id);
            }
        });
    });

    return (
        <>
            {projectiles.map(p => {
                if (p.type === 'arrow') return <Arrow key={p.id} data={p} />;
                if (p.type === 'blood') return <BloodSplatter key={p.id} position={p.position} velocity={p.velocity} />;
                return null;
            })}
        </>
    );
};
