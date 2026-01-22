import { useGameStore } from '../../store/useGameStore';
import { TRANSLATIONS } from '../../constants/translations';
import { useAudio } from '../../hooks/useAudio';
import { motion, AnimatePresence } from 'framer-motion';

export const Hotbar = () => {
    const { inventory, activeSlot, setActiveSlot, language } = useGameStore();
    const t = TRANSLATIONS[language] as any;
    const { playSound } = useAudio();

    const slots = [
        { id: 'bow', icon: '🏹', label: t.bow || 'BOW' },
        { id: 'torch', icon: '🔦', label: t.torch || 'TORCH' },
        { id: 'water', icon: (inventory['water'] || 0) > 0 ? '💧' : '🫙', label: t.water || 'WATER' },
        { id: 'meat', icon: '🍖', label: t.meat || 'MEAT' },
        { id: 'cooked_meat', icon: '🍗', label: t.cooked_meat || 'COOKED' },
        { id: 'apple', icon: '🍏', label: t.apple || 'APPLE' },
        { id: 'baked_apple', icon: '🍎', label: t.baked_apple || 'BAKED' },
        { id: 'campfire', icon: '🔥', label: t.campfire || 'FIRE' },
    ];

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-[#1a1c23]/40 backdrop-blur-3xl border border-white/10 p-3 rounded-[32px] flex gap-3 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative">
                {/* Active Item Name */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSlot}
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                        className="absolute -top-14 left-1/2 -translate-x-1/2 bg-emerald-500 text-stone-950 text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-[0.3em] shadow-[0_10px_20px_rgba(16,185,129,0.3)] whitespace-nowrap pointer-events-none"
                    >
                        {slots[activeSlot].label}
                    </motion.div>
                </AnimatePresence>

                {slots.map((slot, i) => {
                    const count = slot.id === 'water' ? (inventory['water'] || inventory['waterEmpty'] || 0) : (inventory[slot.id] || 0);
                    const isActive = activeSlot === i;

                    return (
                        <motion.div
                            key={i}
                            whileHover={{ y: -8, scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                const consumables = ['water', 'meat', 'cooked_meat', 'apple', 'baked_apple'];
                                if (consumables.includes(slot.id)) {
                                    if ((inventory[slot.id] || 0) > 0) {
                                        useGameStore.getState().consumeItem(slot.id);
                                        playSound(slot.id === 'water' ? 'water' : 'eat');
                                    }
                                } else {
                                    setActiveSlot(i);
                                }
                            }}
                            className={`relative w-16 h-16 rounded-[24px] flex items-center justify-center cursor-pointer transition-all duration-500 ${isActive
                                ? 'bg-white text-stone-950 shadow-[0_15px_30px_rgba(255,255,255,0.2)]'
                                : 'bg-white/5 border border-white/5 text-white/40 hover:bg-white/10 hover:border-white/20 hover:text-white'
                                }`}
                        >
                            <span className={`absolute top-2 left-3 text-[9px] font-black tracking-tighter ${isActive ? 'text-stone-950/20' : 'text-white/10'}`}>
                                {i + 1}
                            </span>

                            <span className={`text-2xl filter drop-shadow-lg transition-all duration-300 ${isActive ? 'scale-125 rotate-6' : 'opacity-80 group-hover:opacity-100'}`}>
                                {slot.icon}
                            </span>

                            <AnimatePresence>
                                {count > 0 && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-xl flex items-center justify-center border-2 font-black text-[11px] shadow-lg ${isActive ? 'bg-emerald-500 border-white text-white' : 'bg-stone-800 border-stone-900 text-white'}`}
                                    >
                                        {count}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {isActive && (
                                <motion.div
                                    layoutId="active-slot-glow"
                                    className="absolute -inset-2 bg-white/10 rounded-[28px] pointer-events-none blur-xl"
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
