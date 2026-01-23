import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3, Euler } from 'three';
import { useGameStore } from '../../store/useGameStore';
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
        mass: 0.5,
        position,
        rotation,
        velocity,
        args: [0.1, 0.1, 0.8],
        linearDamping: 0.05,
        angularDamping: 1.0,
        userData: { id },
        onCollide: (e: any) => {
            if (stuck) return;

            const hitBody = e.body;
            const hitToId = hitBody.userData?.id || hitBody.name;

            const isAnimal = hitToId && (
                hitToId.includes('deer') ||
                hitToId.includes('rabbit') ||
                hitToId.includes('bird') ||
                hitToId.includes('partridge') ||
                hitToId.includes('animal')
            );

            const currentPos = new Vector3(ref.current!.position.x, ref.current!.position.y, ref.current!.position.z);
            const currentRot = new Euler().setFromQuaternion(ref.current!.quaternion);

            if (isAnimal) {
                const state = useGameStore.getState();
                state.spawnBlood([currentPos.x, currentPos.y, currentPos.z]);

                const actualId = (hitToId === 'animal' || !hitToId.includes('-')) ? hitBody.userData?.id : hitToId;
                state.removeWildlife(actualId || hitToId);

                // Different meat amounts for different animals
                let meatAmount = 1;
                if (hitToId.includes('deer')) meatAmount = 2;
                else if (hitToId.includes('partridge') || hitToId.includes('bird')) meatAmount = 1;

                state.addItem('meat', meatAmount);

                stickArrow(id, currentPos.toArray() as [number, number, number], currentRot.toArray().slice(0, 3) as [number, number, number], actualId || hitToId);
                return;
            }

            // Stick to ground/walls/shelters
            stickArrow(id, currentPos.toArray() as [number, number, number], currentRot.toArray().slice(0, 3) as [number, number, number], hitToId);
        }
    }));

    const localVel = useRef([0, 0, 0]);
    useEffect(() => {
        const unsubscribe = api.velocity.subscribe(v => localVel.current = v);
        return () => unsubscribe();
    }, [api.velocity]);

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
        const playerPos = state.playerPosition;
        const arrowPos = new Vector3(ref.current?.position.x || position[0], ref.current?.position.y || position[1], ref.current?.position.z || position[2]);
        const distToPlayer = arrowPos.distanceTo(new Vector3(...playerPos));

        // Auto-pickup arrows when close
        if (distToPlayer < 2.0) {
            useGameStore.getState().addItem('arrow', 1);
            removeProjectile(id);
            return;
        }

        if (!stuck) {
            if (Date.now() - data.spawnTime > 15000) {
                removeProjectile(id);
                return;
            }

            // Low speed drop logic (handled naturally by physics if mass is not 0)
        } else {
            if (data.stuckToId) {
                const wr = state.worldResources;
                const activeObjects = [...wr.trees, ...wr.rocks, ...wr.bushes, ...state.wildlife, ...state.shelters, ...state.placedItems];
                if (!activeObjects.some(r => r.id === data.stuckToId)) {
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
            <meshStandardMaterial color="#4a3728" />
            <mesh position={[0, 0, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.08, 0.2, 4]} />
                <meshStandardMaterial color="#666" metalness={0.8} />
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
