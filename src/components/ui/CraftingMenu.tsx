import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { TRANSLATIONS } from '../../constants/translations';
import { X, Hammer, Flame, Home, Tent, Landmark } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';

export const CraftingMenu = ({ onClose }: { onClose: () => void }) => {
    const { inventory, addItem, removeItem, language, addShelter } = useGameStore();
    const t = TRANSLATIONS[language];
    const { playSound } = useAudio();

    interface Recipe {
        id: string;
        name: string;
        cost: Record<string, number>;
        output?: number;
        icon: React.ReactNode;
        isShelter?: boolean;
        level?: number;
    }

    const shelters = useGameStore(state => state.shelters);
    const playerPos = useGameStore(state => state.playerPosition);

    // Check if player is near any shelter for upgrades
    const nearShelter = shelters.some(shelter => {
        const dist = Math.sqrt(
            Math.pow(shelter.position[0] - playerPos[0], 2) +
            Math.pow(shelter.position[2] - playerPos[2], 2)
        );
        return dist < 5; // 5 unit range for upgrades
    });

    let recipes: Recipe[] = [
        { id: 'water', name: t.water || 'CANTEEN', cost: { wood: 2, stone: 1 }, icon: <Hammer size={20} /> },
        { id: 'torch', name: t.torch || 'TORCH', cost: { wood: 2 }, icon: <Flame size={20} /> },
        { id: 'campfire', name: t.campfire || 'CAMPFIRE', cost: { wood: 4, stone: 2, flint_stone: 1 }, icon: <Flame size={20} /> },
        { id: 'arrow', name: t.arrow || 'ARROW (5x)', cost: { wood: 1, stone: 1 }, output: 5, icon: <Hammer size={20} /> },

        // Always allow tent crafting
        { id: 'tent', name: t.tent || 'TENT', cost: { wood: 10, stone: 5 }, icon: <Tent size={20} />, isShelter: true, level: 1 },
    ];

    // Add upgrade options only when near a shelter
    if (nearShelter) {
        recipes.push(
            { id: 'hut', name: t.hut || 'UPGRADE TO HUT', cost: { wood: 25, stone: 15 }, icon: <Home size={20} />, isShelter: true, level: 2 },
            { id: 'house', name: t.house || 'UPGRADE TO HOUSE', cost: { wood: 50, stone: 40 }, icon: <Landmark size={20} />, isShelter: true, level: 3 }
        );
    }

    const canCraft = (cost: Record<string, number>) => {
        return Object.entries(cost).every(([item, amount]) => (inventory[item] || 0) >= amount);
    };

    const handleCraft = (recipe: Recipe) => {
        if (canCraft(recipe.cost)) {
            Object.entries(recipe.cost).forEach(([item, amount]) => {
                removeItem(item, amount as number);
            });

            if (recipe.isShelter && recipe.level !== undefined) {
                const playerPos = useGameStore.getState().playerPosition;
                const bearing = useGameStore.getState().bearing * (Math.PI / 180);
                const currentShelters = useGameStore.getState().shelters;

                if (recipe.level === 1) {
                    // New tent - spawn in front of player
                    const spawnPos: [number, number, number] = [
                        playerPos[0] + Math.sin(bearing) * 4,
                        0,
                        playerPos[2] + Math.cos(bearing) * 4
                    ];
                    addShelter(recipe.level, spawnPos);
                } else {
                    // Upgrade - find nearest shelter and upgrade it
                    let nearestShelter = null;
                    let nearestDist = 5;

                    currentShelters.forEach(shelter => {
                        const dist = Math.sqrt(
                            Math.pow(shelter.position[0] - playerPos[0], 2) +
                            Math.pow(shelter.position[2] - playerPos[2], 2)
                        );
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            nearestShelter = shelter;
                        }
                    });

                    if (nearestShelter) {
                        // Upgrade the shelter (keep existing fuel)
                        useGameStore.setState(state => ({
                            shelters: state.shelters.map(s =>
                                s.id === nearestShelter.id
                                    ? { ...s, level: recipe.level }
                                    : s
                            )
                        }));
                    }
                }
            }

                addShelter(recipe.level, spawnPos);
            } else if (recipe.id === 'campfire') {
                const playerPos = useGameStore.getState().playerPosition;
                const bearing = useGameStore.getState().bearing * (Math.PI / 180);
                const spawnPos: [number, number, number] = [
                    playerPos[0] + Math.sin(bearing) * 3,
                    0.1,
                    playerPos[2] + Math.cos(bearing) * 3
                ];
                useGameStore.getState().placeItem('campfire', spawnPos);
            } else {
                addItem(recipe.id, recipe.output || 1);
            }
            playSound('craft');
            onClose(); // Close menu after craft
        }
    };

return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
             onMouseDown={(e) => e.stopPropagation()}
             onMouseUp={(e) => e.stopPropagation()}
             onClick={(e) => e.stopPropagation()}
             onContextMenu={(e) => e.preventDefault()}
             onWheel={(e) => e.stopPropagation()}
             onTouchStart={(e) => e.stopPropagation()}
             onTouchMove={(e) => e.stopPropagation()}
             onTouchEnd={(e) => e.stopPropagation()}
             style={{ pointerEvents: 'all' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.preventDefault()}
                onWheel={(e) => e.stopPropagation()}
                style={{ pointerEvents: 'all' }}
                className="bg-[#1a1c23]/95 border border-white/10 p-8 rounded-[32px] shadow-2xl w-full max-w-4xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-500/20 p-3 rounded-2xl">
                            <Hammer size={28} className="text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-1">{t.crafting || 'CRAFTING'}</h2>
                            <p className="text-white/30 text-xs font-bold uppercase tracking-widest">{language === 'tr' ? 'Yeni eşyalar üret' : 'Create new items'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl text-white/50 hover:text-white transition-all active:scale-90 border border-white/5">
                        <X size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                    {recipes.map((recipe) => {
                        const craftable = canCraft(recipe.cost);
                        return (
                            <button
                                key={recipe.id}
                                disabled={!craftable}
                                onClick={() => handleCraft(recipe)}
                                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden ${craftable
                                    ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                                    : 'bg-black/20 border-transparent opacity-40 cursor-not-allowed grayscale'
                                    }`}
                            >
                                <div className="flex items-center gap-5 z-10">
                                    <div className={`p-4 rounded-2xl transition-colors duration-300 ${craftable ? 'bg-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500/30' : 'bg-white/5 text-white/20'}`}>
                                        {recipe.icon}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-lg text-white group-hover:text-emerald-400 transition-colors tracking-tight">
                                            {recipe.isShelter ? `${t.upgrade || 'UPGRADE'}: ${recipe.name}` : recipe.name}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {Object.entries(recipe.cost).map(([item, amount]) => {
                                                const hasEnough = (inventory[item] || 0) >= (amount as number);
                                                return (
                                                    <span key={item} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${hasEnough ? 'bg-white/5 text-white/60' : 'bg-rose-500/10 text-rose-500'}`}>
                                                        {(t as any)[item] || item.toUpperCase()} <span className={hasEnough ? 'text-emerald-500' : 'text-rose-500'}>{amount as number}</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                {craftable && (
                                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-emerald-500/20 text-emerald-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Craft</div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};

export default CraftingMenu;
