import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Settings, Play, RefreshCw, X, Volume2, Globe, ArrowRight } from 'lucide-react';
import { TRANSLATIONS } from '../../constants/translations';
import { motion, AnimatePresence } from 'framer-motion';

export const MainMenu: React.FC = () => {
    const {
        language,
        setLanguage,
        masterVolume,
        setMasterVolume,
        setMainMenuOpen,
        isMainMenuOpen,
        isSettingsOpen,
        setSettingsOpen,
        resetGame
    } = useGameStore();

    const t = TRANSLATIONS[language];

    if (!isMainMenuOpen) return null;

    const handleNewGame = () => {
        if (window.confirm(t.confirm_new_game)) {
            resetGame();
            setMainMenuOpen(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/80 backdrop-blur-2xl"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <AnimatePresence mode="wait">
                {!isSettingsOpen ? (
                    <motion.div
                        key="main"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="w-full max-w-4xl p-12 flex flex-col md:flex-row gap-16 items-center"
                    >
                        {/* Title Section */}
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h1 className="text-8xl font-black tracking-tighter uppercase italic leading-none mb-4">
                                    <span className="bg-gradient-to-br from-white via-white to-white/20 bg-clip-text text-transparent">WILD</span>
                                    <br />
                                    <span className="bg-gradient-to-br from-emerald-400 to-blue-500 bg-clip-text text-transparent">LANDS</span>
                                </h1>
                                <p className="text-white/30 text-sm font-black uppercase tracking-[0.5em] ml-2">
                                    THE ULTIMATE SURVIVAL
                                </p>
                            </motion.div>
                        </div>

                        {/* Buttons Section */}
                        <div className="w-full max-w-sm space-y-4">
                            <MenuButton
                                icon={<Play className="fill-current" />}
                                label={t.resume}
                                onClick={() => setMainMenuOpen(false)}
                                primary
                                subtext="ESC"
                            />
                            <MenuButton
                                icon={<RefreshCw />}
                                label={t.new_game}
                                onClick={handleNewGame}
                            />
                            <MenuButton
                                icon={<Settings />}
                                label={t.settings}
                                onClick={() => setSettingsOpen(true)}
                            />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full max-w-2xl bg-[#1a1c23]/90 border border-white/10 p-10 rounded-[48px] shadow-2xl relative overflow-hidden"
                    >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[120px] rounded-full -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[120px] rounded-full -ml-32 -mb-32" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-12">
                                <div className="space-y-1">
                                    <h2 className="text-4xl font-black text-white tracking-tight uppercase italic">{t.settings}</h2>
                                    <div className="h-1.5 w-12 bg-emerald-500 rounded-full" />
                                </div>
                                <button
                                    onClick={() => setSettingsOpen(false)}
                                    className="p-4 hover:bg-white/5 rounded-3xl border border-white/5 transition-all text-white/50 hover:text-white"
                                >
                                    <X size={28} />
                                </button>
                            </div>

                            <div className="space-y-10">
                                {/* Language */}
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-xs font-black text-white/30 uppercase tracking-[0.2em]">
                                        <Globe size={14} /> {t.language}
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setLanguage('tr')}
                                            className={`p-5 rounded-[24px] font-black tracking-tight transition-all border-2 ${language === 'tr' ? 'bg-emerald-500/20 border-emerald-500/50 text-white shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}
                                        >
                                            {t.turkish || 'TÜRKÇE'}
                                        </button>
                                        <button
                                            onClick={() => setLanguage('en')}
                                            className={`p-5 rounded-[24px] font-black tracking-tight transition-all border-2 ${language === 'en' ? 'bg-blue-500/20 border-blue-500/50 text-white shadow-[0_0_30px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}
                                        >
                                            {t.english || 'ENGLISH'}
                                        </button>
                                    </div>
                                </div>

                                {/* Volume */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <label className="flex items-center gap-2 text-xs font-black text-white/30 uppercase tracking-[0.2em]">
                                            <Volume2 size={14} /> {t.volume}
                                        </label>
                                        <span className="text-2xl font-black text-white tabular-nums tracking-tighter">
                                            {Math.round(masterVolume * 100)}
                                        </span>
                                    </div>
                                    <div className="relative group p-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={masterVolume}
                                            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                                            className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500 transition-all hover:h-3"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSettingsOpen(false)}
                                className="mt-12 w-full p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {t.back}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 text-center opacity-20 pointer-events-none">
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">
                    {t.version}
                </p>
            </div>
        </div>
    );
};

const MenuButton = ({ icon, label, onClick, primary = false, subtext }: { icon: React.ReactNode, label: string, onClick: () => void, primary?: boolean, subtext?: string }) => (
    <motion.button
        whileHover={{ x: 10, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`w-full group flex items-center justify-between p-6 rounded-[32px] transition-all duration-300 relative overflow-hidden ${primary
            ? 'bg-emerald-500 text-stone-950 shadow-[0_20px_40px_-15px_rgba(16,185,129,0.4)]'
            : 'bg-white/5 border border-white/5 text-white hover:bg-white/10 hover:border-white/10'
            }`}
    >
        <div className="flex items-center gap-6 relative z-10">
            <div className={`p-4 rounded-2xl flex items-center justify-center ${primary ? 'bg-stone-950/20' : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white transition-all'}`}>
                {icon}
            </div>
            <span className="text-xl font-black uppercase tracking-tight">{label}</span>
        </div>
        {subtext ? (
            <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${primary ? 'border-stone-950/20 text-stone-950/40' : 'border-white/10 text-white/20'}`}>
                {subtext}
            </div>
        ) : (
            <ArrowRight size={20} className={`transition-transform duration-300 group-hover:translate-x-2 ${primary ? 'text-stone-950/40' : 'text-white/20'}`} />
        )}

        {primary && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
    </motion.button>
);
