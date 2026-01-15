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
            if (e.code === 'Space') setActions((prev) => ({ ...prev, jump: true }));
            if (e.code === 'ShiftLeft') setActions((prev) => ({ ...prev, sprint: true }));
            if (e.code === 'KeyE') setActions((prev) => ({ ...prev, interact: true }));
            if (e.code === 'KeyC') setActions((prev) => ({ ...prev, craft: true }));

            // Numeric keys for slots
            if (e.code.startsWith('Digit')) {
                const digit = parseInt(e.code.replace('Digit', ''));

                // 1(Bow), 2(Torch), 8(Campfire): Select slot or Toggle off
                if (digit === 1 || digit === 2 || digit === 8) {
                    const targetSlot = digit - 1;
                    const currentSlot = useGameStore.getState().activeSlot;
                    if (currentSlot === targetSlot) {
                        useGameStore.getState().setActiveSlot(-1); // Toggle off (Empty hands)
                    } else {
                        useGameStore.getState().setActiveSlot(targetSlot);
                    }
                }
                // 3(Water), 4(Meat), 5(Cooked Meat), 6(Apple), 7(Baked Apple): Consume
                else if (digit >= 3 && digit <= 7) {
                    const consumableMap: Record<number, string> = {
                        3: 'water',
                        4: 'meat',
                        5: 'cooked_meat',
                        6: 'apple',
                        7: 'baked_apple'
                    };
                    const itemId = consumableMap[digit];
                    const state = useGameStore.getState();
                    if ((state.inventory[itemId] || 0) > 0) {
                        state.consumeItem(itemId);
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
