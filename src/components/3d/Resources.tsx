import { memo, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { useCompoundBody } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ResourceProps {
    id: string;
    position: [number, number, number];
    durability: number;
    variation?: {
        height?: number;
        leafSize?: number;
        scale?: number;
        rotation?: number;
    };
}

export const Tree = memo(({ id, position, variation, durability }: ResourceProps) => {
    const trunkHeight = variation?.height || 3;
    const leafSize = variation?.leafSize || 2;

    const [ref] = useCompoundBody(() => ({
        mass: 0,
        position: [position[0], 0, position[2]],
        type: 'Static',
        shapes: [
            {
                type: 'Cylinder',
                args: [0.2, 0.3, trunkHeight, 8],
                position: [0, trunkHeight / 2, 0]
            }
        ]
    }));

    const [barkTexture, leafTexture] = useTexture([
        '/textures/bark.png',
        '/textures/bush_texture.png'
    ]);
    barkTexture.wrapS = barkTexture.wrapT = THREE.RepeatWrapping;
    barkTexture.repeat.set(1, trunkHeight);

    leafTexture.wrapS = leafTexture.wrapT = THREE.RepeatWrapping;
    leafTexture.repeat.set(6, 6);


    const targetScale = useMemo(() => durability / 100, [durability]);

    useFrame((_, delta) => {
        if (ref.current) {
            ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);
        }
    });

    return (
        <group ref={ref as any} name="tree" userData={{ id }}>
            {/* Trunk */}
            <mesh castShadow name="tree_trunk" userData={{ id }}>
                <cylinderGeometry args={[0.2, 0.3, trunkHeight]} />
                <meshStandardMaterial map={barkTexture} roughness={0.9} metalness={0.05} envMapIntensity={0.5} />
            </mesh>
            {/* Leaves */}
            <mesh position={[0, trunkHeight * 0.85, 0]} castShadow name="tree_leaves" userData={{ id }}>
                <sphereGeometry args={[leafSize]} />
                <meshStandardMaterial map={leafTexture} color="#3d5225" roughness={1} metalness={0} envMapIntensity={0.5} />
            </mesh>
        </group>
    );
});


export const PineTree = memo(({ id, position, variation, durability }: ResourceProps) => {
    const trunkHeight = variation?.height || 4;
    const baseWidth = variation?.leafSize || 2.5;

    const [ref] = useCompoundBody(() => ({
        mass: 0,
        position: [position[0], 0, position[2]],
        type: 'Static',
        shapes: [
            {
                type: 'Cylinder',
                args: [0.2, 0.3, trunkHeight, 8],
                position: [0, trunkHeight / 2, 0]
            }
        ]
    }));

    const [barkTexture, needleTexture] = useTexture([
        '/textures/bark.png',
        '/textures/leaf_texture.png'
    ]);
    barkTexture.wrapS = barkTexture.wrapT = THREE.RepeatWrapping;
    barkTexture.repeat.set(1, trunkHeight);

    needleTexture.wrapS = needleTexture.wrapT = THREE.RepeatWrapping;
    needleTexture.repeat.set(8, 16);



    const targetScale = useMemo(() => durability / 100, [durability]);

    useFrame((_, delta) => {
        if (ref.current) {
            ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);
        }
    });

    return (
        <group ref={ref as any} name="tree" userData={{ id }}>
            {/* Trunk */}
            <mesh castShadow name="tree_trunk" userData={{ id }}>
                <cylinderGeometry args={[0.2, 0.3, trunkHeight]} />
                <meshStandardMaterial map={barkTexture} roughness={0.9} metalness={0.05} envMapIntensity={0.5} />
            </mesh>
            {/* Conical needle segments */}
            <mesh position={[0, trunkHeight * 0.6, 0]} castShadow name="tree_leaves" userData={{ id }}>
                <coneGeometry args={[baseWidth, trunkHeight * 0.5, 8]} />
                <meshStandardMaterial map={needleTexture} color="#1b2611" roughness={1} metalness={0} envMapIntensity={0.5} />
            </mesh>
            <mesh position={[0, trunkHeight * 0.85, 0]} castShadow name="tree_leaves" userData={{ id }}>
                <coneGeometry args={[baseWidth * 0.75, trunkHeight * 0.4, 8]} />
                <meshStandardMaterial map={needleTexture} color="#1b2611" roughness={1} metalness={0} envMapIntensity={0.5} />
            </mesh>
            <mesh position={[0, trunkHeight * 1.05, 0]} castShadow name="tree_leaves" userData={{ id }}>
                <coneGeometry args={[baseWidth * 0.5, trunkHeight * 0.3, 8]} />
                <meshStandardMaterial map={needleTexture} color="#1b2611" roughness={1} metalness={0} envMapIntensity={0.5} />
            </mesh>
        </group>
    );
});


export const Rock = memo(({ id, position, variation, durability }: ResourceProps) => {
    const scale = variation?.scale || 1;
    const rotation = variation?.rotation || 0;
    const rockTexture = useTexture('/textures/rock.png');

    const [ref] = useCompoundBody(() => ({
        mass: 0,
        position: [position[0], 0, position[2]],
        rotation: [0, rotation, 0],
        type: 'Static',
        shapes: [
            {
                type: 'Box',
                args: [scale * 1.5, scale * 1.2, scale * 1.5],
                position: [0, (scale * 1.2) / 2, 0]
            }
        ],
        material: { friction: 0, restitution: 0 }
    }));


    const targetScale = useMemo(() => durability / 100, [durability]);

    useFrame((_, delta) => {
        if (ref.current) {
            ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);
        }
    });

    return (
        <group ref={ref as any} name="rock" userData={{ id }}>
            <mesh castShadow name="rock_mesh" userData={{ id }}>
                <dodecahedronGeometry args={[scale, 0]} />
                <meshStandardMaterial map={rockTexture} roughness={0.9} metalness={0.05} envMapIntensity={0.5} />
            </mesh>
        </group>
    );
});


export const Bush = memo(({ id, position, variation, durability }: ResourceProps) => {
    const scale = variation?.scale || 0.7;
    const bushTexture = useTexture('/textures/bush_texture.png');
    bushTexture.wrapS = bushTexture.wrapT = THREE.RepeatWrapping;
    bushTexture.repeat.set(4, 4);



    const [ref] = useCompoundBody(() => ({
        mass: 0,
        position: [position[0], 0, position[2]],
        type: 'Static',
        shapes: [
            {
                type: 'Sphere',
                args: [scale],
                position: [0, scale, 0]
            }
        ],
        material: { friction: 0, restitution: 0 }
    }));


    const targetScale = useMemo(() => durability / 100, [durability]);

    useFrame((_, delta) => {
        if (ref.current) {
            ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);
        }
    });

    const berries = useMemo(() => {
        return Array.from({ length: 5 }).map((_, i) => ({
            id: i,
            position: [
                (Math.random() - 0.5) * scale * 1.5,
                scale * 0.5 + Math.random() * scale,
                (Math.random() - 0.5) * scale * 1.5
            ] as [number, number, number]
        }));
    }, [scale]);

    return (
        <group ref={ref as any} name="bush" userData={{ id }}>
            <mesh castShadow scale={[scale, scale, scale]} name="bush_main" userData={{ id }}>
                <sphereGeometry args={[1]} />
                <meshStandardMaterial map={bushTexture} roughness={1} metalness={0} envMapIntensity={0.5} />
            </mesh>
            {berries.map(b => (
                <mesh key={b.id} position={b.position} name="bush_berry" userData={{ id }}>
                    <sphereGeometry args={[0.1 * scale]} />
                    <meshStandardMaterial color="#d32f2f" roughness={0.5} metalness={0} envMapIntensity={0.5} />
                </mesh>
            ))}
        </group>
    );
});

