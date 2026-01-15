import { Sky, Stars, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

import { usePlane } from '@react-three/cannon';
import { useGameStore } from '../../store/useGameStore';
import { Tree, PineTree, Rock, Bush } from './Resources';

import { InteractionSystem } from './InteractionSystem';
import { Weather } from './Weather';
import { Water } from './Water';
import { Arrow } from './Arrow';


import { Deer, Rabbit } from './Wildlife';
import * as THREE from 'three';


export const World = () => {
    const gameTime = useGameStore((state) => state.gameTime);
    const weather = useGameStore((state) => state.weather);
    const resources = useGameStore((state) => state.worldResources);

    const smoothTime = useRef(gameTime);

    useFrame((_, delta: number) => {
        // Smoothly interpolate time to avoid jumps
        smoothTime.current = THREE.MathUtils.lerp(smoothTime.current, gameTime, delta * 2);
    });


    const timeProgress = (smoothTime.current / 2400);
    const angle = timeProgress * Math.PI * 2 - Math.PI / 2;

    const sunX = Math.cos(angle) * 200;
    const sunY = Math.sin(angle) * 200;
    const sunPosition: [number, number, number] = [sunX, sunY, 0];

    const moonPosition: [number, number, number] = [-sunX, -sunY, 0];

    const currentSunIntensity = Math.max(0, Math.sin(angle)) * 1.5;
    const currentMoonIntensity = Math.max(0, -Math.sin(angle)) * 0.3;

    const isNight = sunY < 0;
    const isCloudy = weather === 'rainy' || weather === 'snowy';

    // Golden hour color shift
    const sunsetFactor = Math.max(0, 1 - Math.abs(sunY / 100)); // Higher near horizon
    const sunColor = isNight ? '#ffffff' : (sunsetFactor > 0.5 ? '#ff9d5c' : '#ffffff');


    const grassTexture = useTexture('/textures/grass.png');
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(200, 200);

    // Physics Ground
    const [planeRef] = usePlane(() => ({
        rotation: [-Math.PI / 2, 0, 0],
        position: [0, 0, 0],
        material: { friction: 0, restitution: 0 }
    }));


    return (
        <>
            <InteractionSystem />
            <Weather />
            <Sky
                sunPosition={sunPosition}
                turbidity={isCloudy ? 15 : (isNight ? 0.1 : 0.5 + sunsetFactor * 2)}
                rayleigh={isCloudy ? 4 : (isNight ? 0.1 : 0.5 + sunsetFactor * 3)}
                mieCoefficient={0.005}
                mieDirectionalG={0.8}
            />

            {/* Sun Model */}
            {!isNight && (
                <mesh position={sunPosition}>
                    <sphereGeometry args={[4, 32, 32]} />
                    <meshBasicMaterial color={sunColor} />
                </mesh>
            )}

            {/* Moon Model */}
            {isNight && (
                <group>
                    <Stars
                        radius={100}
                        depth={50}
                        count={5000}
                        factor={4}
                        saturation={0}
                        fade
                        speed={1}
                    />
                    <mesh position={moonPosition}>
                        <sphereGeometry args={[3, 32, 32]} />
                        <meshBasicMaterial color="#f4f4f4" />
                        <pointLight intensity={0.5} distance={20} color="#94a3ff" />
                    </mesh>
                </group>
            )}


            <ambientLight intensity={isNight ? 0.1 : isCloudy ? 0.15 : 0.4 + sunsetFactor * 0.1} color={isNight ? '#4a5ab5' : '#ffffff'} />

            {/* Sun Light */}
            <directionalLight
                position={sunPosition}
                intensity={isCloudy ? currentSunIntensity * 0.5 : currentSunIntensity}
                color={sunColor}
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-camera-left={-60}
                shadow-camera-right={60}
                shadow-camera-top={60}
                shadow-camera-bottom={-60}
                shadow-camera-near={0.1}
                shadow-camera-far={250}
                shadow-bias={-0.0005}
            />

            {/* Moon Light */}
            {isNight && (
                <directionalLight
                    position={moonPosition}
                    intensity={currentMoonIntensity}
                    color="#94a3ff"
                />
            )}




            <mesh ref={planeRef as any} receiveShadow>
                <planeGeometry args={[1000, 1000]} />
                <meshStandardMaterial map={grassTexture} color="#2e3b23" roughness={0.9} metalness={0.05} envMapIntensity={0.5} />
            </mesh>



            <group>
                {resources.trees.map((t) => (
                    t.type === 'pine' ? (
                        <PineTree key={t.id} id={t.id} position={t.position} variation={t.variation} durability={t.durability} />
                    ) : (
                        <Tree key={t.id} id={t.id} position={t.position} variation={t.variation} durability={t.durability} />
                    )
                ))}

                {resources.rocks.map((r) => (
                    <Rock key={r.id} id={r.id} position={r.position} variation={r.variation} durability={r.durability} />
                ))}
                {resources.bushes.map((b) => (
                    <Bush key={b.id} id={b.id} position={b.position} variation={b.variation} durability={b.durability} />
                ))}
                <group name="water">
                    <Water position={[30, 0.01, 30]} size={[20, 0.5, 20]} />
                </group>
                <group name="water">
                    <Water position={[-40, 0.01, -20]} size={[15, 0.5, 15]} />
                </group>

                {/* Projectiles */}
                {useGameStore.getState().projectiles.map((p) => (
                    <Arrow
                        key={p.id}
                        position={p.position}
                        velocity={p.velocity}
                        rotation={p.rotation}
                        onHit={() => useGameStore.getState().removeProjectile(p.id)}
                    />
                ))}




                {useGameStore.getState().wildlife.map((animal) => (
                    <group key={animal.id} position={animal.position} name="animal" userData={{ id: animal.id }}>
                        {animal.id.includes('deer') ? <Deer position={[0, 0, 0]} /> : <Rabbit position={[0, 0, 0]} />}
                    </group>
                ))}


                {/* Placed items like campfires */}
                {useGameStore.getState().placedItems.map((item) => (
                    <group key={item.id} position={item.position} name={item.type} userData={{ id: item.id }}>

                        {item.type === 'campfire' && (
                            <group>
                                {/* Stones circle */}
                                {[...Array(8)].map((_, i) => (
                                    <mesh key={i} position={[Math.cos(i * Math.PI / 4) * 0.6, 0.1, Math.sin(i * Math.PI / 4) * 0.6]} castShadow>
                                        <dodecahedronGeometry args={[0.2, 0]} />
                                        <meshStandardMaterial color="#666" roughness={1} metalness={0} envMapIntensity={0} />
                                    </mesh>
                                ))}
                                {/* Wood logs */}
                                <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]} position={[0, 0.1, 0]} castShadow>
                                    <cylinderGeometry args={[0.05, 0.05, 0.8]} />
                                    <meshStandardMaterial color="#4a3728" roughness={1} />
                                </mesh>
                                <mesh rotation={[Math.PI / 2, 0, -Math.PI / 4]} position={[0, 0.1, 0]} castShadow>
                                    <cylinderGeometry args={[0.05, 0.05, 0.8]} />
                                    <meshStandardMaterial color="#4a3728" roughness={1} />
                                </mesh>
                                {/* Fire effect */}
                                {item.active && (
                                    <group position={[0, 0.3, 0]}>
                                        <mesh>
                                            <sphereGeometry args={[0.2, 8, 8]} />
                                            <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} />
                                        </mesh>
                                        <pointLight intensity={2} distance={8} color="#ffaa44" castShadow />
                                    </group>
                                )}
                            </group>
                        )}
                    </group>
                ))}
            </group>




        </>
    );
};

