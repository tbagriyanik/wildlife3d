import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

export const Fire = ({ scale = 1, color = "#ff5500" }: { scale?: number, color?: string }) => {
    const groupRef = useRef<THREE.Group>(null);

    // Create 3 layers of flames
    const flameData = useMemo(() => [
        { offset: 0, speed: 2, scale: 1.0 },
        { offset: 2, speed: 3, scale: 0.8 },
        { offset: 4, speed: 4, scale: 0.6 }
    ], []);

    useFrame((state) => {
        if (!groupRef.current) return;

        const time = state.clock.elapsedTime;

        flameData.forEach((data, i) => {
            const mesh = groupRef.current?.children[i] as THREE.Mesh;
            if (mesh) {
                // Bobbing Y
                mesh.position.y = (Math.sin(time * data.speed + data.offset) * 0.1 + 0.5) * scale * data.scale;

                // Flicker Scale
                const flicker = 1 + Math.sin(time * 10 + i) * 0.1;
                mesh.scale.setScalar(scale * data.scale * flicker);

                // Rotate slightly
                mesh.rotation.y = Math.sin(time * 0.5 + i) * 0.2;
            }
        });

        // Add a random spark effect light intensity
        if (groupRef.current.children[3]) {
            const light = groupRef.current.children[3] as THREE.PointLight;
            light.intensity = 2 + Math.random();
        }
    });

    return (
        <group ref={groupRef}>
            {/* Core Flame Layers (Simple Geometry for Low Poly style but animated) */}
            <mesh position={[0, 0.5, 0]}>
                <dodecahedronGeometry args={[0.3, 0]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.8} />
            </mesh>

            <mesh position={[0, 0.5, 0]} rotation={[0, Math.PI / 4, 0]}>
                <dodecahedronGeometry args={[0.25, 0]} />
                <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={3} transparent opacity={0.6} />
            </mesh>

            <mesh position={[0, 0.6, 0]} rotation={[0, -Math.PI / 4, 0]}>
                <dodecahedronGeometry args={[0.15, 0]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} transparent opacity={0.4} />
            </mesh>

            {/* Light source */}
            <pointLight distance={8 * scale} decay={2} color="#ffaa44" />
        </group>
    );
};
