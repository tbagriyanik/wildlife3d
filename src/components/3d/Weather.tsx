import { Clouds, Cloud } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

export const Weather = () => {
    const weather = useGameStore((state) => state.weather);
    const rainRef = useRef<THREE.Points>(null);
    const snowRef = useRef<THREE.Points>(null);

    const rainCount = 2000;
    const rainPositions = useMemo(() => {
        const pos = new Float32Array(rainCount * 3);
        for (let i = 0; i < rainCount; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 50;
            pos[i * 3 + 1] = Math.random() * 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
        }
        return pos;
    }, []);

    const snowCount = 1000;
    const snowPositions = useMemo(() => {
        const pos = new Float32Array(snowCount * 3);
        for (let i = 0; i < snowCount; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 50;
            pos[i * 3 + 1] = Math.random() * 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
        }
        return pos;
    }, []);

    useFrame((state, delta) => {
        if (weather === 'rainy' && rainRef.current) {
            const positions = rainRef.current.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < rainCount; i++) {
                positions[i * 3 + 1] -= delta * 20;
                if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = 20;
            }
            rainRef.current.geometry.attributes.position.needsUpdate = true;
        }

        if (weather === 'snowy' && snowRef.current) {
            const positions = snowRef.current.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < snowCount; i++) {
                positions[i * 3 + 1] -= delta * 2;
                positions[i * 3] += Math.sin(state.clock.elapsedTime + i) * 0.01;
                if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = 20;
            }
            snowRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    return (
        <group>
            {/* Clouds */}
            {(weather === 'rainy' || weather === 'snowy') && (
                <Clouds material={THREE.MeshStandardMaterial}>
                    <Cloud
                        segments={40}
                        bounds={[10, 2, 10]}
                        volume={10}
                        color={weather === 'rainy' ? '#444' : '#fff'}
                        position={[0, 15, 0]}
                    />
                </Clouds>
            )}

            {/* Rain */}
            {weather === 'rainy' && (
                <points ref={rainRef}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={rainPositions.length / 3}
                            array={rainPositions}
                            itemSize={3}
                            args={[rainPositions, 3]}
                        />
                    </bufferGeometry>
                    <pointsMaterial color="#4080ff" size={0.05} transparent opacity={0.6} />
                </points>
            )}

            {/* Snow */}
            {weather === 'snowy' && (
                <points ref={snowRef}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={snowPositions.length / 3}
                            array={snowPositions}
                            itemSize={3}
                            args={[snowPositions, 3]}
                        />
                    </bufferGeometry>
                    <pointsMaterial color="#ffffff" size={0.1} transparent opacity={0.8} />
                </points>
            )}
        </group>
    );
};
