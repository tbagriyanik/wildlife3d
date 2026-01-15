export const Water = ({ position, size = [10, 0.5, 10] }: { position: [number, number, number], size?: [number, number, number] }) => {
    return (
        <mesh position={position} receiveShadow name="water" renderOrder={-1}>
            <cylinderGeometry args={[size[0] / 2, size[0] / 2, size[1], 8]} />

            <meshStandardMaterial
                color="#006994"
                transparent
                opacity={0.6}
                roughness={0}
                metalness={1}
                envMapIntensity={2}
            />


        </mesh>
    );
};

