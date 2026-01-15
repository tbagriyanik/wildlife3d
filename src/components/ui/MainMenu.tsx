import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Settings, Play, RefreshCw, X } from 'lucide-react';

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

    if (!isMainMenuOpen) return null;


    const handleNewGame = () => {
        if (window.confirm(language === 'tr' ? 'Yeni oyun başlatmak istediğine emin misin? Tüm ilerlemen silinecek.' : 'Are you sure you want to start a new game? All progress will be lost.')) {
            resetGame();
            setMainMenuOpen(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-md p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl flex flex-col gap-6 text-white overflow-hidden">
                {/* Background Glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl" />

                <div className="flex flex-col items-center gap-2 mb-4">
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        WILD LANDS
                    </h1>
                    <div className="h-1 w-24 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full" />
                </div>

                {!isSettingsOpen ? (
                    <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500">
                        <button
                            onClick={() => setMainMenuOpen(false)}
                            className="group flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300 transform hover:scale-[1.02]"
                        >
                            <div className="flex items-center gap-3">
                                <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                                <span className="font-bold uppercase tracking-wider">{language === 'tr' ? 'DEVAM ET' : 'CONTINUE'}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10">
                                <span className="text-xs opacity-50">ESC</span>
                            </div>
                        </button>

                        <button
                            onClick={handleNewGame}
                            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300 transform hover:scale-[1.02]"
                        >
                            <RefreshCw className="w-5 h-5 text-blue-400" />
                            <span className="font-bold uppercase tracking-wider">{language === 'tr' ? 'YENİ OYUN' : 'NEW GAME'}</span>
                        </button>

                        <button
                            onClick={() => setSettingsOpen(true)}
                            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300 transform hover:scale-[1.02]"
                        >
                            <Settings className="w-5 h-5 text-orange-400" />
                            <span className="font-bold uppercase tracking-wider">{language === 'tr' ? 'AYARLAR' : 'SETTINGS'}</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-400">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                {language === 'tr' ? 'AYARLAR' : 'SETTINGS'}
                            </h2>
                            <button
                                onClick={() => setSettingsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Language Setting */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium opacity-60 uppercase tracking-widest">
                                {language === 'tr' ? 'DİL SEÇİMİ' : 'LANGUAGE'}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setLanguage('tr')}
                                    className={`p-3 rounded-xl border transition-all ${language === 'tr' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                >
                                    TÜRKÇE
                                </button>
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`p-3 rounded-xl border transition-all ${language === 'en' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                >
                                    ENGLISH
                                </button>
                            </div>
                        </div>

                        {/* Volume Setting */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium opacity-60 uppercase tracking-widest">
                                    {language === 'tr' ? 'SES SEVİYESİ' : 'MASTER VOLUME'}
                                </label>
                                <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded">
                                    {Math.round(masterVolume * 100)}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={masterVolume}
                                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                            />
                        </div>

                        <button
                            onClick={() => setSettingsOpen(false)}
                            className="mt-4 p-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-2xl font-bold uppercase tracking-widest transition-all"
                        >
                            {language === 'tr' ? 'KAYDET VE DÖN' : 'SAVE & BACK'}
                        </button>
                    </div>
                )}

                <div className="mt-4 text-center">
                    <p className="text-[10px] opacity-30 uppercase tracking-[0.2em]">
                        Wild Lands v0.1.0 • Built with Three.js
                    </p>
                </div>
            </div>
        </div>
    );
};
