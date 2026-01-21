import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TRANSLATIONS } from '../constants/translations';

export interface Resource {
    id: string;
    position: [number, number, number];
    durability: number; // 0 to 100
    type?: 'normal' | 'pine' | 'deer' | 'rabbit' | 'bird' | 'partridge';
    variation?: {
        height?: number;
        leafSize?: number;
        scale?: number;
        rotation?: number;
    };
}

export interface Notification {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning';
}

export interface WorldResources {
    trees: Resource[];
    rocks: Resource[];
    bushes: Resource[];
}

export interface Projectile {
    id: string;
    type: 'arrow';
    position: [number, number, number];
    velocity: [number, number, number];
    rotation: [number, number, number];
    stuck?: boolean;
    stuckAt?: number;
    stuckToId?: string;
    spawnTime: number;
}


export interface PlacedItem {
    id: string;
    type: 'campfire' | 'torch_stick';
    position: [number, number, number];
    active: boolean;
    fuel: number; // 0 to 100
    maxFuel: number;
}

// ... inside GameState interface ...

// ... inside store implementation ...


export interface GameState {
    health: number;
    hunger: number;
    thirst: number;
    temperature: number;
    gameTime: number;
    weather: 'sunny' | 'rainy' | 'snowy';
    worldResources: WorldResources;
    placedItems: PlacedItem[];
    language: 'en' | 'tr';
    joystick: { x: number; y: number };
    activeSlot: number;
    bearing: number;
    playerPosition: [number, number, number];
    isMenuOpen: boolean;
    isMainMenuOpen: boolean;
    isSettingsOpen: boolean;
    notifications: Notification[];
    wildlife: Resource[];
    projectiles: Projectile[];
    day: number;


    masterVolume: number;
    isHovering: boolean;
    torchFuel: number; // 0 to 1

    setVitals: (vitals: Partial<GameState>) => void;
    setTorchFuel: (fuel: number) => void;

    updateVitals: (vitals: Partial<{ health: number; hunger: number; thirst: number; temperature: number }>) => void;
    setGameTime: (time: number) => void;
    setWeather: (weather: 'sunny' | 'rainy' | 'snowy') => void;
    setLanguage: (lang: 'en' | 'tr') => void;
    setJoystick: (joystick: { x: number; y: number }) => void;
    setActiveSlot: (slot: number) => void;
    setBearing: (bearing: number) => void;
    setPlayerPosition: (pos: [number, number, number]) => void;
    setMenuOpen: (isOpen: boolean) => void;
    setMainMenuOpen: (isOpen: boolean) => void;
    setSettingsOpen: (isOpen: boolean) => void;
    setMasterVolume: (volume: number) => void;
    setHovering: (isHovering: boolean) => void;
    updateResourceDurability: (type: keyof WorldResources, id: string, amount: number) => void;
    addNotification: (message: string, type?: 'info' | 'success' | 'warning') => void;

    inventory: Record<string, number>;
    addItem: (id: string, amount: number) => void;
    removeItem: (id: string, amount: number) => void;
    consumeItem: (id: string) => void;
    fillWater: () => void;
    cookItem: (rawId: string) => void;
    placeItem: (type: 'campfire' | 'torch_stick', position: [number, number, number]) => void;
    updateCampfires: (delta: number) => void;
    respawnDaily: () => void;


    shelters: { id: string; level: number; position: [number, number, number] }[];

    isSleeping: boolean;
    sleep: () => void;

    removeWildlife: (id: string) => void;
    shootArrow: (position: [number, number, number], velocity: [number, number, number], rotation: [number, number, number]) => void;
    stickArrow: (id: string, position: [number, number, number], rotation: [number, number, number], stuckToId?: string) => void;
    removeProjectile: (id: string) => void;
    addShelter: (level: number, position: [number, number, number]) => void;
    resetGame: () => void;


}



const generateResources = (): WorldResources => {
    const trees = Array.from({ length: 60 }).map((_, i) => ({
        id: `tree-${i}`,
        type: Math.random() > 0.4 ? ('pine' as const) : ('normal' as const),
        position: [(Math.random() - 0.5) * 180, 0, (Math.random() - 0.5) * 180] as [number, number, number],
        durability: 100,
        variation: {
            height: 3 + Math.random() * 4,
            leafSize: 1.5 + Math.random() * 1.5
        }
    }));
    const rocks = Array.from({ length: 50 }).map((_, i) => ({
        id: `rock-${i}`,
        position: [(Math.random() - 0.5) * 150, 0, (Math.random() - 0.5) * 150] as [number, number, number],
        durability: 100,
        variation: {
            scale: 0.4 + Math.random() * 0.6,
            rotation: Math.random() * Math.PI * 2
        }

    }));
    const bushes = Array.from({ length: 40 }).map((_, i) => ({
        id: `bush-${i}`,
        position: [(Math.random() - 0.5) * 120, 0, (Math.random() - 0.5) * 120] as [number, number, number],
        durability: 100,
        variation: {
            scale: 0.6 + Math.random() * 1.2
        }
    }));
    return { trees, rocks, bushes };
};


const initialResources = generateResources();

export const useGameStore = create<GameState>()(
    persist(
        (set) => ({
            health: 100,
            hunger: 100,
            thirst: 100,
            temperature: 37,
            gameTime: 800,
            weather: 'sunny',
            language: 'en',
            joystick: { x: 0, y: 0 },
            activeSlot: 0,
            bearing: 0,
            playerPosition: [0, 2, 0],
            isMenuOpen: false,
            isMainMenuOpen: false,
            isSettingsOpen: false,
            notifications: [],
            day: 1,
            masterVolume: 0.5,
            isHovering: false,
            torchFuel: 1.0,
            inventory: { wood: 6, stone: 17, flint_stone: 0, apple: 10, water: 3, waterEmpty: 0, meat: 5 },


            worldResources: initialResources,
            wildlife: [
                { id: 'deer-1', type: 'normal', position: [15, 0, -15], durability: 100 },
                { id: 'deer-2', type: 'normal', position: [-25, 0, 35], durability: 100 },
                { id: 'rabbit-1', type: 'normal', position: [8, 0, 10], durability: 100 },
                { id: 'rabbit-2', type: 'normal', position: [-12, 0, -20], durability: 100 },
            ],
            projectiles: [],
            placedItems: [],
            shelters: [],
            isSleeping: false,



            setVitals: (vitals) => set((state) => ({ ...state, ...vitals })),
            updateVitals: (vitals) => set((state) => ({
                health: Math.min(100, Math.max(0, state.health + (vitals.health || 0))),
                hunger: Math.min(100, Math.max(0, state.hunger + (vitals.hunger || 0))),
                thirst: Math.min(100, Math.max(0, state.thirst + (vitals.thirst || 0))),
                temperature: state.temperature + (vitals.temperature || 0),
            })),
            setGameTime: (time) => set((state) => {
                const nextTime = time % 2400;
                const daysToAdd = Math.floor(time / 2400);

                // Respawn logic every 6 hours (600 units)
                const lastRespawn = Math.floor(state.gameTime / 600);
                const currentRespawn = Math.floor(nextTime / 600);

                if (daysToAdd > 0 || currentRespawn !== lastRespawn) {
                    useGameStore.getState().respawnDaily();
                }

                return {
                    gameTime: nextTime,
                    day: state.day + daysToAdd
                };
            }),

            setWeather: (weather) => set({ weather }),
            setLanguage: (language) => set({ language }),
            setJoystick: (joystick) => set({ joystick }),
            setActiveSlot: (activeSlot) => set({ activeSlot }),
            setBearing: (bearing) => set({ bearing }),
            setPlayerPosition: (playerPosition) => set({ playerPosition }),
            setMenuOpen: (isMenuOpen) => set({ isMenuOpen }),
            setMainMenuOpen: (isMainMenuOpen) => set({ isMainMenuOpen }),
            setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
            setMasterVolume: (masterVolume) => set({ masterVolume }),
            setHovering: (isHovering) => set({ isHovering }),


            setTorchFuel: (torchFuel) => set({ torchFuel }),

            updateResourceDurability: (type, id, amount) => set((state) => {

                const updated = state.worldResources[type].map(r =>
                    r.id === id ? { ...r, durability: Math.max(0, r.durability - amount) } : r
                ).filter(r => r.durability > 0);
                return { worldResources: { ...state.worldResources, [type]: updated } };
            }),

            addNotification: (message, type = 'info') => {
                const id = Math.random().toString(36).substring(7);
                set((state) => ({ notifications: [...state.notifications, { id, message, type }] }));
                setTimeout(() => set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) })), 3000);
            },

            addItem: (id, amount) => {
                set((state) => ({ inventory: { ...state.inventory, [id]: (state.inventory[id] || 0) + amount } }));
                const lang = useGameStore.getState().language;
                const t = TRANSLATIONS[lang];
                const itemName = (t as any)[id] || id.toUpperCase();
                // "ITEMNAME COLLECTED"
                const msg = `${itemName} ${t.collected_msg}`;
                useGameStore.getState().addNotification(msg, 'success');
            },

            removeItem: (id, amount) => set((state) => {
                const current = state.inventory[id] || 0;
                if (current <= amount) {
                    const { [id]: _, ...rest } = state.inventory;
                    return { inventory: rest };
                }
                return { inventory: { ...state.inventory, [id]: current - amount } };
            }),

            consumeItem: (id) => {
                const state = useGameStore.getState();
                const items: Record<string, { hunger?: number; thirst?: number; health?: number }> = {
                    apple: { hunger: 15, thirst: 10, health: 5 },
                    baked_apple: { hunger: 25, thirst: 5, health: 10 },
                    meat: { hunger: 25, health: 10 },
                    cooked_meat: { hunger: 50, health: 25 },
                    water: { thirst: 30 }
                };


                const stats = items[id];
                if (stats && (state.inventory[id] || 0) > 0) {
                    if (id === 'water' && state.thirst >= 100) {
                        const lang = state.language;
                        const t = TRANSLATIONS[lang];
                        state.addNotification(t.thirst_full_msg, 'warning');
                        return;
                    }

                    state.updateVitals(stats);
                    state.removeItem(id, 1);

                    if (id === 'water') {
                        state.addItem('waterEmpty', 1);
                    }

                    const lang = state.language;
                    const t = TRANSLATIONS[lang];
                    const msg = `${id.toUpperCase()} ${t.consumed_msg}`;
                    state.addNotification(msg, 'info');
                }
            },

            fillWater: () => {
                const state = useGameStore.getState();
                const emptyCount = state.inventory['waterEmpty'] || 0;
                if (emptyCount > 0) {
                    state.removeItem('waterEmpty', emptyCount);
                    state.addItem('water', emptyCount);
                    const lang = state.language;
                    const t = TRANSLATIONS[lang];
                    state.addNotification(t.canteen_filled_msg, 'success');
                } else {
                    const lang = state.language;
                    const t = TRANSLATIONS[lang];
                    state.addNotification(t.no_empty_canteen_msg, 'info');
                }
            },

            cookItem: (rawId: string) => {
                const state = useGameStore.getState();
                const cookingMap: Record<string, string> = {
                    meat: 'cooked_meat',
                    apple: 'baked_apple'
                };

                const cookedId = cookingMap[rawId];
                if (cookedId && (state.inventory[rawId] || 0) > 0) {
                    state.removeItem(rawId, 1);
                    state.addItem(cookedId, 1);
                    const lang = state.language;
                    const t = TRANSLATIONS[lang];
                    const msg = `${rawId.toUpperCase()} ${t.cooked_msg}`;
                    state.addNotification(msg, 'success');
                }
            },



            placeItem: (type, position) => set((state) => ({
                placedItems: [...state.placedItems, {
                    id: Math.random().toString(36).substring(7),
                    type,
                    position,
                    active: true,
                    fuel: 100,
                    maxFuel: 100
                }]
            })),

            updateCampfires: (delta) => set((state) => ({
                placedItems: state.placedItems.map(item => {
                    if (item.type === 'campfire' && item.active) {
                        // Burn rate: 100 fuel / 200 sec = 0.5 per sec
                        const newFuel = item.fuel - (delta * 0.5);
                        return { ...item, fuel: Math.max(0, newFuel), active: newFuel > 0 };
                    }
                    return item;
                })
            })),

            respawnDaily: () => set((state) => {
                const newResources = { ...state.worldResources };

                // Respawn Trees & Rocks if low
                if (newResources.trees.length < 40) {
                    for (let i = 0; i < 10; i++) {
                        newResources.trees.push({
                            id: `tree-respawn-${state.day}-${i}`,
                            type: Math.random() > 0.4 ? 'pine' : 'normal',
                            position: [(Math.random() - 0.5) * 180, 0, (Math.random() - 0.5) * 180],
                            durability: 100,
                            variation: { height: 3 + Math.random() * 4, leafSize: 1.5 + Math.random() * 1.5 }
                        });
                    }
                }

                if (newResources.rocks.length < 30) {
                    for (let i = 0; i < 5; i++) {
                        newResources.rocks.push({
                            id: `rock-respawn-${state.day}-${i}`,
                            position: [(Math.random() - 0.5) * 150, 0, (Math.random() - 0.5) * 150],
                            durability: 100,
                            variation: { scale: 0.4 + Math.random() * 0.6, rotation: Math.random() * Math.PI * 2 }
                        });
                    }
                }

                // Respawn Wildlife (Deer, Rabbit, Bird)
                const newWildlife = [...state.wildlife];

                // Ensure at least 3 Deers
                const deerCount = newWildlife.filter(w => w.id.includes('deer')).length;
                if (deerCount < 3) {
                    newWildlife.push({ id: `deer-respawn-${state.day}`, type: 'deer', position: [(Math.random() - 0.5) * 100, 0, (Math.random() - 0.5) * 100], durability: 100 });
                }

                // Ensure at least 4 Birds (Circling overhead)
                const birdCount = newWildlife.filter(w => w.id.includes('bird') || w.type === 'bird').length;
                if (birdCount < 4) {
                    for (let i = 0; i < (4 - birdCount); i++) {
                        newWildlife.push({
                            id: `bird-respawn-${state.day}-${i}`,
                            type: 'bird',
                            position: [(Math.random() - 0.5) * 100, 15 + Math.random() * 10, (Math.random() - 0.5) * 100],
                            durability: 100
                        });
                    }
                }

                // Ensure at least 3 Partridges (Keklik)
                const partridgeCount = newWildlife.filter(w => w.id.includes('partridge') || w.type === 'partridge').length;
                if (partridgeCount < 3) {
                    for (let i = 0; i < (3 - partridgeCount); i++) {
                        newWildlife.push({
                            id: `partridge-respawn-${state.day}-${i}`,
                            type: 'partridge',
                            position: [(Math.random() - 0.5) * 100, 0, (Math.random() - 0.5) * 100],
                            durability: 100
                        });
                    }
                }

                return {
                    worldResources: newResources,
                    wildlife: newWildlife
                };
            }),

            removeWildlife: (id) => set((state) => ({
                wildlife: state.wildlife.filter(w => w.id !== id)
            })),

            shootArrow: (position, velocity, rotation) => {
                const state = useGameStore.getState();
                if ((state.inventory['arrow'] || 0) > 0) {
                    const id = Math.random().toString(36).substring(7);
                    set((state) => ({
                        projectiles: [...state.projectiles, { id, type: 'arrow', position, velocity, rotation, spawnTime: Date.now() }],
                        inventory: { ...state.inventory, arrow: state.inventory['arrow'] - 1 }
                    }));
                } else {
                    const lang = state.language;
                    const t = TRANSLATIONS[lang];
                    state.addNotification(t.out_of_arrows_msg, 'warning');
                }
            },

            stickArrow: (id, position, rotation, stuckToId) => set((state) => ({
                projectiles: state.projectiles.map(p =>
                    p.id === id
                        ? { ...p, stuck: true, stuckAt: Date.now(), position, rotation, velocity: [0, 0, 0], stuckToId }
                        : p
                )
            })),

            removeProjectile: (id) => set((state) => ({
                projectiles: state.projectiles.filter(p => p.id !== id)
            })),

            addShelter: (level, position) => set((state) => ({
                shelters: [...state.shelters, { id: Math.random().toString(36).substring(7), level, position }]
            })),

            sleep: () => {
                set({ isSleeping: true });
                setTimeout(() => {
                    const state = useGameStore.getState();
                    state.setGameTime(state.gameTime + 500); // 5 hours
                    set({ isSleeping: false });
                }, 2000); // 2 second transition
            },

            resetGame: () => set({
                health: 100,
                hunger: 100,
                thirst: 100,
                day: 1,
                gameTime: 800,
                inventory: { wood: 6, stone: 17, water: 3, waterEmpty: 0 },

                worldResources: generateResources(),
                placedItems: [],
                projectiles: [],
                playerPosition: [0, 2, 0],
                shelters: []
            })

        }),
        {
            name: 'wildlands-store',
            partialize: (state) => ({
                health: state.health,
                hunger: state.hunger,
                thirst: state.thirst,
                gameTime: state.gameTime,
                weather: state.weather,
                language: state.language,
                inventory: state.inventory,
                worldResources: state.worldResources,
                playerPosition: state.playerPosition,
                day: state.day,
                masterVolume: state.masterVolume,
                placedItems: state.placedItems,
                wildlife: state.wildlife,
                torchFuel: state.torchFuel,
                shelters: state.shelters
            })


        }

    )
);


