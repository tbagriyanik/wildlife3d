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

    const recipes: Recipe[] = [
        { id: 'water', name: t.water || 'CANTEEN', cost: { wood: 2, stone: 1 }, icon: <Hammer size={20} /> },
        { id: 'torch', name: t.torch || 'TORCH', cost: { wood: 2 }, icon: <Flame size={20} /> },
        { id: 'campfire', name: t.campfire || 'CAMPFIRE', cost: { wood: 4, stone: 4 }, icon: <Flame size={20} /> },
        { id: 'arrow', name: t.arrow || 'ARROW (5x)', cost: { wood: 1, stone: 1 }, output: 5, icon: <Hammer size={20} /> },

        // Shelters
        { id: 'tent', name: t.tent || 'TENT', cost: { wood: 10, stone: 5 }, icon: <Tent size={20} />, isShelter: true, level: 1 },
        { id: 'hut', name: t.hut || 'HUT', cost: { wood: 20, stone: 15 }, icon: <Home size={20} />, isShelter: true, level: 2 },
        { id: 'house', name: t.house || 'HOUSE', cost: { wood: 40, stone: 30 }, icon: <Landmark size={20} />, isShelter: true, level: 3 },
    ];

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
                const spawnPos: [number, number, number] = [
                    playerPos[0] + Math.sin(bearing) * 4,
                    0,
                    playerPos[2] + Math.cos(bearing) * 4
                ];
                addShelter(recipe.level, spawnPos);
            } else {
                addItem(recipe.id === 'cooked_meat' ? 'cooked_meat' : recipe.id, recipe.output || 1);
            }
            playSound('craft');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="bg-stone-900/90 border border-white/10 p-6 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-500/20 p-2 rounded-xl">
                            <Hammer size={24} className="text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">{t.crafting || 'CRAFTING'}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {recipes.map((recipe) => {
                        const craftable = canCraft(recipe.cost);
                        return (
                            <button
                                key={recipe.id}
                                disabled={!craftable}
                                onClick={() => handleCraft(recipe)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 group ${craftable
                                    ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                    : 'bg-black/20 border-transparent opacity-50 cursor-not-allowed grayscale'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${craftable ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 text-white/20'}`}>
                                        {recipe.icon}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-white group-hover:text-amber-400 transition-colors">
                                            {recipe.name}
                                        </div>
                                        <div className="text-xs font-semibold text-white/40 flex gap-2 mt-1">
                                            {Object.entries(recipe.cost).map(([item, amount]) => (
                                                <span key={item} className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-full">
                                                    {(t as any)[item] || item.toUpperCase()} <span className="text-amber-500">{amount as number}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};
