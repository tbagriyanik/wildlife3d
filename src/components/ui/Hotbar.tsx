import { useGameStore } from '../../store/useGameStore';
import { useAudio } from '../../hooks/useAudio';

export const Hotbar = () => {
    const { inventory, activeSlot, setActiveSlot } = useGameStore();
    const { playSound } = useAudio();

    // Define items to show in hotbar slots based on common survival items
    // In a real game, this would be an array of slot objects in the store.
    // For this mockup alignment, we'll map existing inventory items to slots.
    const slots = [
        { id: 'bow', icon: '🏹', color: 'bg-indigo-500/50' },
        { id: 'torch', icon: '🔦', color: 'bg-amber-500/50' },
        { id: 'water', icon: (inventory['water'] || 0) > 0 ? '💧' : '🫙', color: 'bg-blue-500/50' },
        { id: 'meat', icon: '🍖', color: 'bg-rose-500/50' },
        { id: 'cooked_meat', icon: '🍗', color: 'bg-orange-500/50' },
        { id: 'apple', icon: '🍏', color: 'bg-emerald-500/50' },
        { id: 'baked_apple', icon: '🍎', color: 'bg-red-500/50' },
        { id: 'campfire', icon: '🔥', color: 'bg-orange-600/50' },
    ];



    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className="glass border-white/5 bg-black/20 px-2 py-2 rounded-full flex gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {slots.map((slot, i) => (
                    <div
                        key={i}
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

                        className={`relative w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 group ${activeSlot === i
                            ? 'bg-indigo-500/30 ring-2 ring-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                            : 'bg-white/5 hover:bg-white/10'
                            }`}
                    >

                        {/* Slot Number */}
                        <span className="absolute top-1 left-2 text-[7px] font-black text-white/30 uppercase">
                            {i + 1}
                        </span>

                        {/* Icon */}
                        <span className={`text-xl transition-transform duration-300 ${activeSlot === i ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'opacity-70 group-hover:opacity-100 group-hover:scale-105'}`}>
                            {slot.icon}
                        </span>

                        {/* Quantity Badge */}
                        {(inventory[slot.id] > 0 || (slot.id === 'water' && inventory['waterEmpty'] > 0)) && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-stone-900 shadow-lg">
                                <span className="text-[9px] font-black text-white leading-none">
                                    {slot.id === 'water' ? (inventory['water'] || inventory['waterEmpty'] || 0) : inventory[slot.id]}
                                </span>
                            </div>
                        )}


                        {/* Cherry/Apple quantity specific display just to match mockup visuals if needed */}
                        {slot.id === 'apple' && inventory['apple'] > 0 && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-stone-900 shadow-lg">
                                <span className="text-[9px] font-black text-white leading-none">
                                    {inventory['apple']}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
