import { useEffect, useRef, useState } from 'react';

export const FpsDisplay = () => {
    const [fps, setFps] = useState(0);
    const frameCount = useRef(0);
    const lastTime = useRef(performance.now());

    useEffect(() => {
        let animationFrameId: number;

        const loop = () => {
            const now = performance.now();
            frameCount.current++;

            if (now - lastTime.current >= 1000) {
                setFps(Math.round((frameCount.current * 1000) / (now - lastTime.current)));
                frameCount.current = 0;
                lastTime.current = now;
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // Color coding based on performance
    const getColor = (fps: number) => {
        if (fps >= 50) return 'text-emerald-400';
        if (fps >= 30) return 'text-amber-400';
        return 'text-rose-400';
    };

    return (
        <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
            <div className={`text-[10px] font-black ${getColor(fps)} tabular-nums`}>
                {fps}
            </div>
            <div className="text-[9px] font-bold text-white/30 tracking-widest uppercase">
                FPS
            </div>
        </div>
    );
};
