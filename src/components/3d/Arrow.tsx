import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
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
        vel.y -= 9.81 * delta * 2;
        pos.add(vel.clone().multiplyScalar(delta));
        meshRef.current.position.copy(pos);
        meshRef.current.scale.multiplyScalar(0.92);
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
    const stuckRef = useRef(stuck);

    const [ref, api] = useBox(() => ({
        mass: 0.3,
        position,
        rotation,
        velocity,
        args: [0.05, 0.05, 0.8],
        linearDamping: 0.02,
        angularDamping: 0.8,
        ccdSpeedThreshold: 1,
        ccdIterations: 10,
        userData: { id, type: 'arrow' },
        onCollide: (e: any) => {
            if (stuckRef.current) return;

            const hitBody = e.body;
            const hitName = hitBody?.name || '';
            const hitToId = hitBody?.userData?.id || hitBody?.name;

            if (hitName.includes('player') || hitBody?.userData?.type === 'player') return;

            const isAnimal = hitToId && (
                hitToId.includes('deer') ||
                hitToId.includes('rabbit') ||
                hitToId.includes('bird') ||
                hitToId.includes('partridge')
            );

            const currentPos = ref.current!.position;
            const currentRot = ref.current!.rotation;

            const state = useGameStore.getState();

            if (isAnimal) {
                // Spawn blood particles on animal hit
                for (let i = 0; i < 8; i++) {
                    state.spawnBlood([
                        currentPos.x + (Math.random() - 0.5) * 0.5,
                        currentPos.y + Math.random() * 0.3,
                        currentPos.z + (Math.random() - 0.5) * 0.5
                    ]);
                }

                // Damage the animal (1 damage per arrow)
                state.damageWildlife(hitToId, 1);

                // Stick arrow to animal
                stickArrow(id, currentPos.toArray(), currentRot.toArray().slice(0, 3) as [number, number, number], hitToId);
            } else if (!hitToId?.includes('arrow')) {
                // Stick arrow to environment objects (rocks, trees, etc)
                stickArrow(id, currentPos.toArray(), currentRot.toArray().slice(0, 3) as [number, number, number], hitToId);
            }
        }
    }));

    const localVel = useRef([0, 0, 0]);
    useEffect(() => api.velocity.subscribe(v => (localVel.current = v)), [api]);

    useEffect(() => {
        stuckRef.current = stuck;
    }, [stuck]);

    useEffect(() => {
        if (stuck) {
            api.mass.set(0);
            api.velocity.set(0, 0, 0);
            api.angularVelocity.set(0, 0, 0);
            api.position.set(position[0], position[1], position[2]);
            api.rotation.set(rotation[0], rotation[1], rotation[2]);
        } else {
            api.mass.set(0.3);
            api.angularVelocity.set(0, 0, 0);
        }
    }, [stuck, api, position, rotation]);

    const arrowVisual = useMemo(() => {
        return (
            <group>
                <mesh position={[0, 0.4, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.8]} />
                    <meshStandardMaterial color="#8B4513" />
                </mesh>
                <mesh position={[0, 0.85, 0]}>
                    <coneGeometry args={[0.04, 0.18, 8]} />
                    <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
                </mesh>
                <mesh position={[0, -0.05, 0]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[0.1, 0.02, 0.06]} />
                    <meshStandardMaterial color="#DC143C" />
                </mesh>
            </group>
        );
    }, []);

    useFrame(() => {
        const state = useGameStore.getState();
        const playerPos = state.playerPosition;
        const arrowPos = ref.current?.position || new Vector3(...position);
        const distToPlayer = arrowPos.distanceTo(new Vector3(...playerPos));

        if (!stuck && ref.current) {
            const v = new THREE.Vector3(...localVel.current);
            if (v.lengthSq() > 0.01) {
                const forward = new THREE.Vector3(0, 1, 0);
                const dir = v.normalize();
                const quat = new THREE.Quaternion().setFromUnitVectors(forward, dir);
                ref.current.quaternion.slerp(quat, 0.35);
            }
        }

        // If arrow is stuck to an animal, follow the animal's position
        if (stuck && data.stuckToId && ref.current) {
            const animalIndex = state.wildlife.findIndex(w => w.id === data.stuckToId);
            if (animalIndex !== -1) {
                const animal = state.wildlife[animalIndex];
                const animalPos = new Vector3(...animal.position);

                // Add slight offset so arrow appears embedded in body
                const offsetDir = new Vector3(...localVel.current).normalize();
                if (offsetDir.lengthSq() > 0) {
                    animalPos.add(offsetDir.multiplyScalar(0.5));
                } else {
                    animalPos.y += 0.5; // Default upward offset if no velocity data
                }

                api.position.set(animalPos.x, animalPos.y, animalPos.z);
            }
        }

        if (distToPlayer < 1.8 && stuck) {
            state.addItem('arrow', 1);
            removeProjectile(id);
            addNotification('ARROW RECOVERED', 'info');
            return;
        }

        if (!stuck && Date.now() - data.spawnTime > 12000) {
            removeProjectile(id);
            return;
        }

        if (stuck && data.stuckToId) {
            const wr = state.worldResources;
            const activeObjects = [...wr.trees, ...wr.rocks, ...wr.bushes, ...state.wildlife, ...state.shelters, ...state.placedItems];
            if (!activeObjects.some(r => r.id === data.stuckToId)) {
                useGameStore.setState(s => ({
                    projectiles: s.projectiles.map(p => p.id === id ? { ...p, stuck: false, stuckToId: undefined } : p)
                }));
            }
        }
    });

    return (
        <group>
            <mesh ref={ref as any} castShadow name="arrow" userData={{ id, type: 'arrow' }}>
                <boxGeometry args={[0.05, 0.8, 0.05]} />
                <meshStandardMaterial transparent opacity={0} />
                <primitive object={arrowVisual} />
            </mesh>
        </group>
    );
};

export const ArrowManager = () => {
    const projectiles = useGameStore((state) => state.projectiles);
    const removeProjectile = useGameStore((state) => state.removeProjectile);

    useFrame(() => {
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
