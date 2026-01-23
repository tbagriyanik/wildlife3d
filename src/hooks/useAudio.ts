import { useCallback, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { GameState } from '../store/useGameStore';

// Shared AudioContext for sound effects - created lazily and resumed on user gesture
let sharedAudioContext: AudioContext | null = null;
let audioContextInitialized = false;

const getAudioContext = (): AudioContext | null => {
    if (!sharedAudioContext) {
        sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Resume if suspended (browser autoplay policy)
    if (sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume();
    }

    return sharedAudioContext;
};

// Initialize audio context on first user gesture
if (typeof window !== 'undefined' && !audioContextInitialized) {
    const initAudio = () => {
        getAudioContext();
        audioContextInitialized = true;
        window.removeEventListener('click', initAudio);
        window.removeEventListener('keydown', initAudio);
        window.removeEventListener('touchstart', initAudio);
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    window.addEventListener('touchstart', initAudio);
}

export const useAudio = () => {
    const playSound = useCallback((type: 'gather' | 'craft' | 'eat' | 'walk' | 'wood' | 'stone' | 'water' | 'jump') => {
        const masterVolume = useGameStore.getState().masterVolume;
        if (masterVolume <= 0) return;

        const audioCtx = getAudioContext();
        if (!audioCtx || audioCtx.state === 'suspended') return;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'gather' || type === 'wood') {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(120, now);
            oscillator.frequency.exponentialRampToValueAtTime(10, now + 0.1);
            gainNode.gain.setValueAtTime(0.08 * masterVolume, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
        } else if (type === 'stone') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, now);
            oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.05);
            gainNode.gain.setValueAtTime(0.05 * masterVolume, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
        } else if (type === 'eat' || type === 'water') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(500, now);
            oscillator.frequency.exponentialRampToValueAtTime(700, now + 0.2);
            gainNode.gain.setValueAtTime(0.1 * masterVolume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        } else if (type === 'craft') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            gainNode.gain.setValueAtTime(0.05 * masterVolume, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
        } else if (type === 'walk') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(60, now);
            gainNode.gain.setValueAtTime(0.02 * masterVolume, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
        } else if (type === 'jump') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            gainNode.gain.setValueAtTime(0.08 * masterVolume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        }

        oscillator.start();
        oscillator.stop(now + 0.3);
    }, []);

    return { playSound };
};

export const useMusic = () => {
    const masterVolume = useGameStore((state: GameState) => state.masterVolume);

    useEffect(() => {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Master Gain for ambient
        const masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(masterVolume, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);

        // Background Wind Noise
        const bufferSize = 2 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }

        const whiteNoise = audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, audioCtx.currentTime);

        const windGain = audioCtx.createGain();
        windGain.gain.setValueAtTime(0.015, audioCtx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(windGain);
        windGain.connect(masterGain);

        // Wind Oscillations (Slow volume changes)
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        osc.frequency.setValueAtTime(0.1, audioCtx.currentTime); // Slow oscillation
        oscGain.gain.setValueAtTime(0.005, audioCtx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(windGain.gain);
        osc.start();

        // Leaf Rustle (Higher frequency noise)
        const rustleBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const rustleOut = rustleBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { rustleOut[i] = Math.random() * 2 - 1; }
        const rustleSrc = audioCtx.createBufferSource();
        rustleSrc.buffer = rustleBuffer;
        rustleSrc.loop = true;
        const rustleFilter = audioCtx.createBiquadFilter();
        rustleFilter.type = 'bandpass';
        rustleFilter.frequency.setValueAtTime(2000, audioCtx.currentTime);
        rustleFilter.Q.setValueAtTime(0.5, audioCtx.currentTime);
        const rustleGain = audioCtx.createGain();
        rustleGain.gain.setValueAtTime(0.005, audioCtx.currentTime);
        rustleSrc.connect(rustleFilter);
        rustleFilter.connect(rustleGain);
        rustleGain.connect(masterGain);

        // Calculation helper
        const getIsNight = () => {
            const timeProgress = (useGameStore.getState().gameTime / 2400);
            const angle = timeProgress * Math.PI * 2 - Math.PI / 2;
            return Math.sin(angle) < 0;
        };

        // Birds sleep at night
        const birdInterval = setInterval(() => {

            if (audioCtx.state === 'suspended') return;
            if (getIsNight()) return;
            if (Math.random() > 0.4) return;

            const playChirp = (delay = 0) => {
                const s = audioCtx.currentTime + delay;
                const osc = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                osc.connect(g);
                g.connect(masterGain);

                const baseFreq = 1200 + Math.random() * 1500;
                osc.frequency.setValueAtTime(baseFreq, s);
                osc.frequency.exponentialRampToValueAtTime(baseFreq + 1000, s + 0.08);

                g.gain.setValueAtTime(0, s);
                g.gain.linearRampToValueAtTime(0.01 * masterVolume, s + 0.02);
                g.gain.linearRampToValueAtTime(0, s + 0.1);

                osc.start(s);
                osc.stop(s + 0.12);
            };

            const count = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < count; i++) {
                playChirp(i * 0.15);
            }
        }, 5000);

        // Owls (Night only)
        const owlInterval = setInterval(() => {
            if (audioCtx.state === 'suspended') return;
            if (!getIsNight()) return;
            if (Math.random() > 0.2) return;

            const playHoot = (delay = 0) => {
                const s = audioCtx.currentTime + delay;
                const osc = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                osc.type = 'sine';
                osc.connect(g);
                g.connect(masterGain);

                // Owl "Hoo" - Low freq with slight pitch drop
                osc.frequency.setValueAtTime(250, s);
                osc.frequency.exponentialRampToValueAtTime(220, s + 0.3);

                g.gain.setValueAtTime(0, s);
                g.gain.linearRampToValueAtTime(0.03 * masterVolume, s + 0.1);
                g.gain.exponentialRampToValueAtTime(0.001, s + 0.4);

                osc.start(s);
                osc.stop(s + 0.5);
            };

            // Two-part hoot: Hoo... Hoo-Hoo
            playHoot(0);
            if (Math.random() > 0.5) {
                setTimeout(() => playHoot(0), 600);
                setTimeout(() => playHoot(0), 900);
            }
        }, 8000);

        // Crickets (Night only)
        const cricketInterval = setInterval(() => {
            if (audioCtx.state === 'suspended') return;
            if (!getIsNight()) return; // Crickets quiet during day
            if (Math.random() > 0.3) return;

            const playCricket = (delay = 0) => {
                const s = audioCtx.currentTime + delay;
                const osc = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                osc.type = 'sine';
                osc.connect(g);
                g.connect(masterGain);

                const baseFreq = 4000 + Math.random() * 500;
                osc.frequency.setValueAtTime(baseFreq, s);

                // Rapid pulses for cricket sound
                for (let j = 0; j < 4; j++) {
                    const ps = s + j * 0.03;
                    g.gain.setValueAtTime(0, ps);
                    g.gain.linearRampToValueAtTime(0.005 * masterVolume, ps + 0.01);
                    g.gain.linearRampToValueAtTime(0, ps + 0.02);
                }

                osc.start(s);
                osc.stop(s + 0.15);
            };

            const count = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < count; i++) {
                playCricket(i * 0.5);
            }
        }, 3000);

        let started = false;
        const startAudio = () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            try {
                whiteNoise.start();
                rustleSrc.start();
                started = true;
            } catch (e) { }
            window.removeEventListener('click', startAudio);
            window.removeEventListener('keydown', startAudio);
        };

        window.addEventListener('click', startAudio);
        window.addEventListener('keydown', startAudio);

        return () => {
            clearInterval(birdInterval);
            clearInterval(owlInterval);
            clearInterval(cricketInterval);
            if (started) {

                try {
                    whiteNoise.stop();
                    rustleSrc.stop();
                } catch (e) { }
            }
            audioCtx.close();
            window.removeEventListener('click', startAudio);
            window.removeEventListener('keydown', startAudio);
        };
    }, [masterVolume]); // Re-run effect or update masterGain when volume changes
};




