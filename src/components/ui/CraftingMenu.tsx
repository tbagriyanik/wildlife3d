import { X, Hammer, Package, Sparkles } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { TRANSLATIONS } from '../../constants/translations';
import { useState } from 'react';

export const CraftingMenu = ({ onClose }: { onClose: () => void }) => {
    const { inventory, addItem, removeItem, language } = useGameStore();


    const [activeTab, setActiveTab] = useState<'inventory' | 'crafting'>('inventory');
    const t = TRANSLATIONS[language];

    const RECIPES = [
        { id: 'water', name: t.recipes.water.name, ingredients: { wood: 5, stone: 5 } as Record<string, number>, description: t.recipes.water.desc, icon: '💧' },

        { id: 'campfire', name: t.recipes.campfire.name, ingredients: { wood: 5, stone: 5 } as Record<string, number>, description: t.recipes.campfire.desc, icon: '🔥' },
        { id: 'torch', name: t.recipes.torch.name, ingredients: { wood: 2 } as Record<string, number>, description: t.recipes.torch.desc, icon: '🔦' },
        { id: 'bow', name: t.recipes.bow.name, ingredients: { wood: 5 } as Record<string, number>, description: t.recipes.bow.desc, icon: '🏹' },
        { id: 'arrow', name: t.recipes.arrow.name, ingredients: { wood: 1, stone: 1 } as Record<string, number>, description: t.recipes.arrow.desc, icon: '🎯' },
    ];

    const canCraft = (ingredients: Record<string, number>) => {
        return Object.entries(ingredients).every(([id, amount]) => (inventory[id] || 0) >= amount);
    };

    const craftItem = (recipe: typeof RECIPES[0]) => {
        if (canCraft(recipe.ingredients)) {
            Object.entries(recipe.ingredients)
                .forEach(([id, amount]) => removeItem(id, amount));

            // Arrows craft in bundles of 5
            const amount = recipe.id === 'arrow' ? 5 : 1;
            addItem(recipe.id, amount);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
                onClick={onClose}
            />

            <div className="relative glass w-full max-w-2xl rounded-[32px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh] border-white/5">
                {/* Decorative Background Glow */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-amber-500/10 blur-[100px] pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-white/5">
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 ${activeTab === 'inventory' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                        >
                            <Package size={20} className={activeTab === 'inventory' ? 'text-emerald-400' : ''} />
                            <span className="font-bold tracking-tight text-sm uppercase">{t.inventory}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('crafting')}
                            className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 ${activeTab === 'crafting' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                        >
                            <Hammer size={20} className={activeTab === 'crafting' ? 'text-amber-400' : ''} />
                            <span className="font-bold tracking-tight text-sm uppercase">{t.crafting}</span>
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all transform active:scale-90 border border-white/5"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'inventory' ? (
                        <div className="grid grid-cols-4 gap-6">
                            {Object.entries(inventory).length === 0 ? (
                                <div className="col-span-4 py-24 flex flex-col items-center justify-center gap-4 text-white/20">
                                    <Package size={48} strokeWidth={1} />
                                    <p className="italic font-medium">{t.empty_inventory}</p>
                                </div>
                            ) : (
                                Object.entries(inventory).map(([id, amount]) => {
                                    const edibleItems = ['apple', 'meat', 'water', 'cooked_meat', 'baked_apple'];
                                    const isEdible = edibleItems.includes(id);

                                    const iconMap: Record<string, string> = {
                                        apple: '🍎',
                                        wood: '🪵',
                                        stone: '🪨',
                                        meat: '🍖',
                                        water: '💧',
                                        cooked_meat: '🥩',
                                        baked_apple: '🥧',
                                        arrow: '🎯'
                                    };

                                    return (
                                        <div key={id} className="group glass-light p-5 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 hover:translate-y-[-4px] hover:border-white/20 hover:bg-white/[0.06]">
                                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                                                {iconMap[id] || id[0].toUpperCase()}
                                            </div>
                                            <div className="text-center">
                                                <span className="block text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">{(t as any)[id] || id.replace('_', ' ')}</span>
                                                <span className="text-2xl font-black text-white leading-none">{amount}</span>
                                            </div>
                                            {isEdible && (
                                                <button
                                                    onClick={() => useGameStore.getState().consumeItem(id)}
                                                    className={`w-full mt-2 py-2.5 rounded-xl text-xs font-black transition-all border uppercase tracking-tight ${id === 'water' ? 'bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border-blue-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border-emerald-500/20'}`}
                                                >
                                                    {id === 'water' ? (language === 'tr' ? 'İÇ' : 'DRINK') : t.eat}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}


                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {RECIPES.map((recipe) => (
                                <div key={recipe.id} className="group glass-light p-6 rounded-[24px] flex items-center justify-between transition-all duration-300 hover:bg-white/[0.05] hover:border-white/20">
                                    <div className="flex gap-6 items-center">
                                        <div className="w-20 h-20 bg-white/5 rounded-[20px] flex items-center justify-center text-4xl shadow-inner group-hover:scale-105 transition-transform duration-500">
                                            {recipe.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white tracking-tight mb-1">{recipe.name}</h3>
                                            <p className="text-sm text-white/40 mb-4 max-w-sm line-clamp-1">{recipe.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(recipe.ingredients).map(([id, amount]) => (
                                                    <div key={id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${inventory[id] >= amount ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/20 bg-rose-500/10 text-rose-400'} `}>
                                                        <span className="opacity-60">{id}</span>
                                                        <span>{inventory[id] || 0}/{amount}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        disabled={!canCraft(recipe.ingredients)}
                                        onClick={() => craftItem(recipe)}
                                        className={`flex items-center gap-2 px-8 py-4 rounded-xl font-black text-sm transition-all shadow-xl active:scale-95 ${canCraft(recipe.ingredients) ? 'bg-white text-black hover:bg-amber-400' : 'bg-white/5 text-white/10 cursor-not-allowed grayscale'} `}
                                    >
                                        <Sparkles size={16} />
                                        {t.craft}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-6 bg-white/[0.02] border-t border-white/5 text-center">
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Wild Lands Crafting Core v1.0</p>
                </div>
            </div>
        </div>
    );
};
