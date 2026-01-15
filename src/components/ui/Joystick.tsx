import { useState, useRef, useEffect } from 'react';

interface JoystickProps {
    onMove: (data: { x: number; y: number }) => void;
    size?: number;
    label?: string;
}

export const Joystick = ({ onMove, size = 120, label }: JoystickProps) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
        isDragging.current = true;
        handleMove(e as any);
    };

    const handleMove = (e: TouchEvent | MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = rect.width / 2;

        const limitedDistance = Math.min(distance, maxRadius);
        const angle = Math.atan2(dy, dx);

        const x = Math.cos(angle) * limitedDistance;
        const y = Math.sin(angle) * limitedDistance;

        setPosition({ x, y });
        onMove({ x: x / maxRadius, y: -y / maxRadius });
    };

    const handleEnd = () => {
        isDragging.current = false;
        setPosition({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 });
    };

    useEffect(() => {
        const handleGlobalMove = (e: MouseEvent) => handleMove(e);
        const handleGlobalEnd = () => handleEnd();

        if (isDragging.current) {
            window.addEventListener('mousemove', handleGlobalMove);
            window.addEventListener('mouseup', handleGlobalEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleGlobalMove);
            window.removeEventListener('mouseup', handleGlobalEnd);
        };
    }, [isDragging.current]);

    return (
        <div className="flex flex-col items-center gap-2">
            {label && <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</span>}
            <div
                ref={containerRef}
                onMouseDown={handleStart as any}
                onTouchStart={handleStart as any}
                onTouchMove={(e) => handleMove(e.nativeEvent)}
                onTouchEnd={handleEnd}
                className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center touch-none"
                style={{ width: size, height: size }}
            >
                <div
                    className="absolute w-12 h-12 bg-white/20 border border-white/20 rounded-full shadow-xl transition-transform duration-75"
                    style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
                />
            </div>
        </div>
    );
};
