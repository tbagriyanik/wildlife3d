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
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className="glass bg-black/40 backdrop-blur-2xl border border-white/10 p-2 rounded-[28px] flex gap-2.5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] relative">
                {/* Active Item Name */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSlot}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-indigo-600/90 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl whitespace-nowrap pointer-events-none"
                    >
                        {slots[activeSlot].label}
                    </motion.div>
                </AnimatePresence>

                {slots.map((slot, i) => {
                    const count = slot.id === 'water' ? (inventory['water'] || inventory['waterEmpty'] || 0) : inventory[slot.id];
                    const isActive = activeSlot === i;

                    return (
                        <motion.div
                            key={i}
                            whileHover={{ y: -4, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                const consumables = ['water', 'meat', 'cooked_meat', 'apple', 'baked_apple'];
                                if (consumables.includes(slot.id)) {
                                    if (inventory[slot.id] > 0) {
                                        useGameStore.getState().consumeItem(slot.id);
                                        playSound(slot.id === 'water' ? 'water' : 'eat');
                                    }
                                } else {
                                    setActiveSlot(i);
                                }
                            }}
                            className={`relative w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 ${isActive
                                ? 'bg-indigo-500/20 border-2 border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.4)]'
                                : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20'
                                }`}
                        >
                            <span className="absolute top-1 left-2 text-[8px] font-black text-white/30 tracking-tighter">
                                {i + 1}
                            </span>

                            <span className={`text-2xl filter drop-shadow-lg transition-transform ${isActive ? 'scale-110' : 'opacity-80'}`}>
                                {slot.icon}
                            </span>

                            <AnimatePresence>
                                {count > 0 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center border-2 border-stone-900 shadow-xl"
                                    >
                                        <span className="text-[10px] font-black text-white">{count}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {isActive && (
                                <motion.div
                                    layoutId="active-slot-glow"
                                    className="absolute -inset-1 bg-indigo-500/10 rounded-[20px] pointer-events-none blur-md"
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
