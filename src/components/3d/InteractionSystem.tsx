import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameStore } from '../../store/useGameStore';
import { useAudio } from '../../hooks/useAudio';
import { TRANSLATIONS } from '../../constants/translations';

export const InteractionSystem = () => {
    const { camera, scene } = useThree();
    const { interact, leftClick } = useKeyboard();
    const { addItem } = useGameStore();

    const { playSound } = useAudio();
    const raycaster = useRef(new THREE.Raycaster());
    const interactBuffer = useRef(false);
    const mouseBuffer = useRef(false);
    const lastInteractTime = useRef(0);
    const INTERACT_COOLDOWN = 300; // ms

    const isAnyMenuOpen = useGameStore((state) => state.isMenuOpen || state.isMainMenuOpen);

    useFrame(() => {
        if (isAnyMenuOpen) {
            if (useGameStore.getState().isHovering) useGameStore.getState().setHovering(false);
            return;
        }
        // Run raycaster every frame for hover detection
        raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.current.intersectObjects(scene.children, true);

        let currentHover = false;
        let targetObject: { id: string | null; name: string; object: THREE.Object3D } | null = null;


        if (intersects.length > 0) {
            // Filter out player mesh and find first valid target
            for (const intersect of intersects) {
                const distance = intersect.distance;
                if (distance < 7) {
                    const object = intersect.object;

                    // Skip player mesh
                    if (object.name === 'player') continue;

                    // Recursive lookup for metadata
                    const findMetadata = (obj: THREE.Object3D | null): { id: string | null; name: string | null } => {
                        if (!obj) return { id: null, name: null };

                        const id = obj.userData?.id || null;
                        const name = obj.name || '';

                        // Priority: Objects with names we recognize
                        const interactiveNames = ['tree', 'rock', 'bush', 'water', 'campfire', 'animal', 'shelter_fire', 'shelter', 'deer', 'rabbit', 'bird', 'partridge', 'arrow', 'meat'];
                        const foundName = interactiveNames.find(n => name.includes(n)) || null;

                        if (id && foundName) return { id, name: foundName };

                        const parentMetadata = findMetadata(obj.parent);
                        return {
                            id: id || parentMetadata.id,
                            name: foundName || parentMetadata.name
                        };
                    };

                    const metadata = findMetadata(object);

                    if (metadata.name) {
                        currentHover = true;
                        targetObject = { id: metadata.id, name: metadata.name, object };
                        break; // Found valid target, stop searching
                    }
                }
            }
        }

        // Update global hover state if changed
        if (useGameStore.getState().isHovering !== currentHover) {
            useGameStore.getState().setHovering(currentHover);
        }

        const state = useGameStore.getState();
        // Auto-pickup nearby dropped meat
        const playerPos = new THREE.Vector3(...state.playerPosition);
        state.droppedItems.forEach((drop) => {
            const dPos = new THREE.Vector3(...drop.position);
            if (playerPos.distanceTo(dPos) < 1.8) {
                if (addItem('meat', drop.amount)) {
                    state.removeDroppedItem(drop.id);
                    playSound('gather');
                }
            }
        });
        const isBowActive = state.activeSlot === 0;
        const now = Date.now();
        const isTriggered = ((interact && !interactBuffer.current) || (leftClick && !mouseBuffer.current && !isBowActive)) && (now - lastInteractTime.current > INTERACT_COOLDOWN);


        if (isTriggered && targetObject) {
            lastInteractTime.current = now;
            const { id, name } = targetObject;

            if (name.includes('tree')) {
                if (id) {
                    if (addItem('wood', 1)) {
                        useGameStore.getState().updateResourceDurability('trees', id, 20);
                        playSound('wood');
                    }
                }
            } else if (name.includes('rock')) {
                if (id) {
                    if (addItem('stone', 1)) {
                        useGameStore.getState().updateResourceDurability('rocks', id, 25);
                        playSound('stone');

                        // 10% chance for flint stone
                        if (Math.random() < 0.1) {
                            addItem('flint_stone', 1);
                        }
                    }
                }
            } else if (name.includes('bush')) {
                if (id) {
                    if (addItem('apple', 1)) {
                        useGameStore.getState().updateResourceDurability('bushes', id, 50);
                        playSound('gather');
                    }
                }
            } else if (name.includes('water')) {
                useGameStore.getState().fillWater();
                playSound('water');

            } else if (name.includes('animal')) {
                if (id) {
                    const state = useGameStore.getState();
                    const amount = id.includes('deer') ? 2 : 1;
                    state.spawnBlood([targetObject.object.position.x, targetObject.object.position.y + 0.5, targetObject.object.position.z]);
                    state.removeWildlife(id);
                    state.addDroppedItem('meat', amount, [targetObject.object.position.x, targetObject.object.position.y + 0.2, targetObject.object.position.z]);
                    playSound('gather');
                }
            } else if (name.includes('meat')) {
                if (id) {
                    const state = useGameStore.getState();
                    const drop = state.droppedItems.find(d => d.id === id);
                    if (drop && addItem('meat', drop.amount)) {
                        state.removeDroppedItem(id);
                        playSound('gather');
                    }
                }
            } else if (name.includes('campfire')) {
                const state = useGameStore.getState();
                const inv = state.inventory;

                // Priority cooking: Meat then Apple
                if (inv['meat'] > 0) {
                    state.cookItem('meat');
                    playSound('gather');
                } else if (inv['apple'] > 0) {
                    state.cookItem('apple');
                    playSound('gather');
                } else {
                    const t = TRANSLATIONS[state.language];
                    playSound('gather');
                    state.addNotification(t.nothing_to_cook, 'info');
                }
            } else if (name.includes('shelter_fire')) {
                const state = useGameStore.getState();
                const inv = state.inventory;
                const t = TRANSLATIONS[state.language];

                // Cooking only
                if (inv['meat'] > 0) {
                    state.cookItem('meat');
                    playSound('gather');
                } else if (inv['apple'] > 0) {
                    state.cookItem('apple');
                    playSound('gather');
                } else {
                    playSound('gather');
                    state.addNotification(t.nothing_to_cook, 'info');
                }
            } else if (name.includes('shelter')) {
                // Sleep only
                const state = useGameStore.getState();
                state.sleep();
                playSound('gather');
            } else if (name.includes('arrow')) {
                if (id) {
                    useGameStore.getState().addItem('arrow', 1);
                    useGameStore.getState().removeProjectile(id);
                    playSound('gather');
                }
            }

        }

        // Update buffers
        interactBuffer.current = !!interact;
        mouseBuffer.current = leftClick;
    });


    return null;
};
