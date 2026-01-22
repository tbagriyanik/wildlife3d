import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';

export const useKeyboard = () => {
    const [actions, setActions] = useState({
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        jump: false,
        sprint: false,
        interact: false,
        craft: false,
        aim: false,
        leftClick: false,
    });



    // For mobile joysticks
    const [joystick, setJoystick] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Movement and action keys
            if (e.code === 'KeyW') setActions((prev) => ({ ...prev, moveForward: true }));
            if (e.code === 'KeyS') setActions((prev) => ({ ...prev, moveBackward: true }));
            if (e.code === 'KeyA') setActions((prev) => ({ ...prev, moveLeft: true }));
            if (e.code === 'KeyD') setActions((prev) => ({ ...prev, moveRight: true }));
            if (e.code === 'Space' || e.key === ' ') setActions((prev) => ({ ...prev, jump: true }));
            if (e.code === 'ShiftLeft') setActions((prev) => ({ ...prev, sprint: true }));
            if (e.code === 'KeyE') setActions((prev) => ({ ...prev, interact: true }));
            if (e.code === 'KeyC') setActions((prev) => ({ ...prev, craft: true }));

            // Numeric keys for slots
            if (e.code.startsWith('Digit')) {
                const digit = parseInt(e.code.replace('Digit', ''));
                if (digit >= 1 && digit <= 8) {
                    const targetSlot = digit - 1;
                    const state = useGameStore.getState();
                    const currentSlot = state.activeSlot;

                    // Toggle logic: If same slot pressed, deactivate. Otherwise switch to it.
                    if (currentSlot === targetSlot) {
                        state.setActiveSlot(-1);
                    } else {
                        state.setActiveSlot(targetSlot);

                        // If it's a consumable (3-7), use it immediately and then maybe deactivate?
                        // USER request was about toggle for 1 and 2, but let's make it consistent.
                        const consumableMap: Record<number, string> = {
                            3: 'water',
                            4: 'meat',
                            5: 'cooked_meat',
                            6: 'apple',
                            7: 'baked_apple'
                        };
                        const itemId = consumableMap[digit];
                        if (itemId && (state.inventory[itemId] || 0) > 0) {
                            state.consumeItem(itemId);
                        }
                    }
                }
            }

        };

        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW': setActions((prev) => ({ ...prev, moveForward: false })); break;
                case 'KeyS': setActions((prev) => ({ ...prev, moveBackward: false })); break;
                case 'KeyA': setActions((prev) => ({ ...prev, moveLeft: false })); break;
                case 'KeyD': setActions((prev) => ({ ...prev, moveRight: false })); break;
                case 'Space': setActions((prev) => ({ ...prev, jump: false })); break;
                case 'ShiftLeft': setActions((prev) => ({ ...prev, sprint: false })); break;
                case 'KeyE': setActions((prev) => ({ ...prev, interact: false })); break;
                case 'KeyC': setActions((prev) => ({ ...prev, craft: false })); break;
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button === 0) setActions((prev) => ({ ...prev, leftClick: true }));
            if (e.button === 2) setActions((prev) => ({ ...prev, aim: true }));
        };
        const handleMouseUp = (e: MouseEvent) => {
            if (e.button === 0) setActions((prev) => ({ ...prev, leftClick: false }));
            if (e.button === 2) setActions((prev) => ({ ...prev, aim: false }));
        };


        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
        };

    }, []);

    return { ...actions, joystick, setJoystick, setActions };
};
