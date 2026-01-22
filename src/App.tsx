import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { Physics } from '@react-three/cannon';
import { World } from './components/3d/World';
import { Player } from './components/3d/Player';
import { CraftingMenu } from './components/ui/CraftingMenu';
import { MainMenu } from './components/ui/MainMenu';
import { Hotbar } from './components/ui/Hotbar';
import { useGameStore } from './store/useGameStore';
import { GAME_CONSTANTS } from './constants/gameConstants';
import { TRANSLATIONS } from './constants/translations';
import { useKeyboard } from './hooks/useKeyboard';
import { useMusic } from './hooks/useAudio';

import { Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Flame, Axe, Mountain, Target, Zap, Droplets, RefreshCw } from 'lucide-react';



const VitalCard = ({ label, value, color, icon, actualValue }: { label: string; value: number; color: string; icon: string; actualValue?: string }) => {
  const isCritical = value < 25;
  return (
    <motion.div
      animate={isCritical ? {
        backgroundColor: ['rgba(28, 25, 23, 0.9)', 'rgba(239, 68, 68, 0.15)', 'rgba(28, 25, 23, 0.9)'],
        scale: [1, 1.01, 1]
      } : {}}
      transition={isCritical ? { repeat: Infinity, duration: 2 } : {}}
      className={`relative overflow-hidden bg-stone-900/40 backdrop-blur-xl rounded-2xl p-3 border-2 transition-all duration-700 ${isCritical ? 'border-rose-500/40 shadow-[0_0_40px_rgba(239,68,68,0.2)]' : 'border-white/5 hover:border-white/20'}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-sm ${isCritical ? 'bg-rose-500/20 text-rose-500' : 'bg-white/5 text-white/50'}`}>
            {icon}
          </div>
          <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">{label}</span>
        </div>
        {isCritical && (
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_10px_#ef4444]"
          />
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className={`text-2xl font-black tabular-nums tracking-tighter ${isCritical ? 'text-rose-400' : 'text-white'}`}>
          {actualValue ? actualValue.split('°')[0] : Math.round(value)}
        </span>
        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{actualValue ? '°C' : '%'}</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(2, Math.min(100, value))}%` }}
          className={`h-full ${color} rounded-full relative`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent opacity-50" />
        </motion.div>
      </div>
    </motion.div>
  );
};

const ResourceCard = ({ icon, count, label }: { icon: React.ReactNode; count: number; label: string }) => (
  <div className="p-3.5 flex items-center justify-between group hover:bg-stone-800/50 transition-all border-b border-white/5 last:border-0 px-5">
    <div className="flex items-center gap-4">
      <div className="opacity-60 group-hover:opacity-100 transition-all scale-110 group-hover:scale-125 group-hover:text-emerald-400">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none group-hover:text-white/40 transition-colors">{label}</span>
      </div>
    </div>
    <span className="text-sm font-black text-white group-hover:text-emerald-400 tabular-nums transition-colors">{count}</span>
  </div>
);

function App() {
  const { day, gameTime, setGameTime, updateVitals, health, hunger, thirst, language, inventory, temperature, notifications, addNotification, bearing, isMenuOpen, setMenuOpen, isMainMenuOpen, setMainMenuOpen, isHovering, isSleeping, isDead } = useGameStore();

  const isAnyMenuOpen = isMenuOpen || isMainMenuOpen;
  const { craft: craftAction } = useKeyboard();
  const t = TRANSLATIONS[language];

  // Cursor and Menu Handling
  useEffect(() => {
    if (isAnyMenuOpen) {
      document.body.style.cursor = 'auto';
    } else {
      document.body.style.cursor = 'none';
    }
  }, [isAnyMenuOpen]);

  // Day Transition Effect
  const [showDayOverlay, setShowDayOverlay] = useState(false);
  useEffect(() => {
    if (day > 1) {
      setShowDayOverlay(true);
      const timer = setTimeout(() => setShowDayOverlay(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [day]);

  // Compass Logic - 3-way display
  const getDisplayDirections = (deg: number) => {
    const allDirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round((deg % 360) / 45) % 8;
    const leftIdx = (idx - 1 + 8) % 8;
    const rightIdx = (idx + 1) % 8;
    return [allDirs[leftIdx], allDirs[idx], allDirs[rightIdx]];
  };
  const [dirLeft, dirCenter, dirRight] = getDisplayDirections(bearing);


  useMusic();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMainMenuOpen(!isMainMenuOpen);
        if (isMenuOpen) {
          setMenuOpen(false);
          addNotification(language === 'tr' ? 'İLERLEME KAYDEDİLDİ' : 'PROGRESS SAVED', 'success');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMainMenuOpen, isMenuOpen]);

  useEffect(() => {
    if (craftAction) setMenuOpen(!isMenuOpen);
  }, [craftAction]);





  useEffect(() => {
    const interval = setInterval(() => {
      // PAUSE GAME Loop if Main Menu is open
      if (useGameStore.getState().isMainMenuOpen) return;

      // 24 minutes = 1440 seconds = 2400 game units
      // 1 second = 1.6666 units
      setGameTime(gameTime + 1.66666);

      // Weather change every 3000 game units
      if (Math.floor(gameTime) % 3000 === 0) {
        const types: ('sunny' | 'rainy' | 'snowy')[] = ['sunny', 'rainy', 'snowy'];
        const nextWeather = types[Math.floor(Math.random() * types.length)];
        useGameStore.getState().setWeather(nextWeather);
      }

      const hungerLoss = -GAME_CONSTANTS.CONSUMPTION.HUNGER;
      const thirstLoss = -GAME_CONSTANTS.CONSUMPTION.THIRST;
      let healthDelta = 0;

      // Critical condition: faster health drain
      const isCriticalHunger = hunger <= 10;
      const isCriticalThirst = thirst <= 10;
      const isCriticalTemp = temperature <= 10;

      if (hunger <= 0 || thirst <= 0) {
        healthDelta = -GAME_CONSTANTS.CONSUMPTION.HEALTH_DRAIN;
      } else if (isCriticalHunger || isCriticalThirst || isCriticalTemp) {
        healthDelta = -GAME_CONSTANTS.CONSUMPTION.HEALTH_DRAIN * 0.5; // Half damage in critical state
      }

      const isNight = gameTime < 600 || gameTime > 1800;
      const baseTemp = isNight ? GAME_CONSTANTS.TEMPERATURE.NIGHT : GAME_CONSTANTS.TEMPERATURE.DAY;
      const weatherModifier = useGameStore.getState().weather === 'snowy' ? -15 : useGameStore.getState().weather === 'rainy' ? -5 : 0;

      // Warmth from Campfires
      const playerPos = useGameStore.getState().playerPosition;
      let warmthModifier = 0;
      let isResting = false;

      useGameStore.getState().placedItems.forEach(item => {
        if (item.type === 'campfire' && item.active) {
          const dist = Math.sqrt(
            Math.pow(item.position[0] - playerPos[0], 2) +
            Math.pow(item.position[2] - playerPos[2], 2)
          );
          if (dist < 3.5) {
            warmthModifier += (3.5 - dist) * 15; // Strong heat when close
            isResting = true;
          }
        }
      });

      // Warmth from Torch
      const activeSlot = useGameStore.getState().activeSlot;
      const slotItems = ['bow', 'torch', 'water', 'meat', 'cooked_meat', 'apple', 'baked_apple', 'campfire'];
      if (slotItems[activeSlot] === 'torch' && (useGameStore.getState().inventory['torch'] || 0) > 0) {
        warmthModifier += 10; // Torch provides steady warmth
      }

      // Warmth from Shelter
      useGameStore.getState().shelters.forEach(shelter => {
        const sPos = shelter.position;
        const distToShelter = Math.sqrt(
          Math.pow(sPos[0] - playerPos[0], 2) +
          Math.pow(sPos[2] - playerPos[2], 2)
        );
        if (distToShelter < 4) {
          warmthModifier += 15; // Shelter is warm
          isResting = true; // Resting in shelter
        }
      });

      // Update Campfire Fuel
      useGameStore.getState().updateCampfires(1); // 1 second delta

      const targetTemp = baseTemp + weatherModifier + warmthModifier;
      const tempDelta = (targetTemp - temperature) * 0.1; // Faster adjustment

      // Resting / Regeneration Logic
      if (isResting && temperature > 30) {
        // If warm and near fire, regenerate health and "energy" (hunger/thirst conservation/regen)
        healthDelta += 0.2;

        // "Enerji artar" -> Recovering hunger/thirst slightly or stopping drain
        // Let's reverse the drain to simulate gaining energy
        healthDelta += GAME_CONSTANTS.CONSUMPTION.HEALTH_DRAIN; // Negate health drain if any

        // Instead of losing hunger/thirst, we regain a tiny bit (resting)
        // Or at least significantly reduce the loss.
        // User said "energy increases", so let's give a small positive tick.
        updateVitals({
          health: healthDelta,
          hunger: hungerLoss * 0.3, // Reduced drain
          thirst: thirstLoss * 0.3,
          temperature: tempDelta
        });
      } else {
        if (temperature < 15 || temperature > 42) healthDelta -= 0.2;
        updateVitals({
          health: healthDelta,
          hunger: hungerLoss,
          thirst: thirstLoss,
          temperature: tempDelta
        });
      }

      // Death check
      const currentHealth = useGameStore.getState().health;
      if (currentHealth <= 0) {
        useGameStore.setState({ isDead: true });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameTime, setGameTime, updateVitals, hunger, thirst, temperature]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className={`fixed inset-0 w-full h-full bg-stone-950 overflow-hidden select-none ${isAnyMenuOpen ? 'cursor-auto' : ''}`}>
      <div className="relative w-full h-full">
        <Canvas shadows camera={{ fov: 75, near: 0.1, far: 1000 }} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
          <Suspense fallback={null}>
            <Environment preset="forest" />

            <Physics gravity={[0, -9.81, 0]}>
              <World />
              <Player />
            </Physics>
          </Suspense>
        </Canvas>
        {/* MODERN CROSSHAIR */}
        {!isAnyMenuOpen && (
          <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
            <div className="relative">
              {/* Center Dot */}
              <div className={`w-1 h-1 rounded-full transition-all duration-300 ${isHovering ? 'bg-emerald-400 scale-150' : 'bg-white/40'}`} />

              {/* Dynamic Rings */}
              <motion.div
                animate={{
                  scale: isHovering ? 1.2 : 1,
                  opacity: isHovering ? 1 : 0.3,
                  rotate: isHovering ? 90 : 0
                }}
                className="absolute -inset-4 border-2 border-white/10 rounded-full"
              />

              {/* Action Preview */}
              <AnimatePresence>
                {isHovering && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                  >
                    <div className="bg-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30">
                      <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] whitespace-nowrap">
                        {t.interact || 'INTERACT'} [E]
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {isMenuOpen && <CraftingMenu onClose={() => setMenuOpen(false)} />}
        <MainMenu />

        {/* CRITICAL CONDITION WARNING */}
        {(health < 20 || hunger < 20 || thirst < 20) && (
          <div className="fixed inset-0 z-[100] pointer-events-none shadow-[inset_0_0_150px_rgba(239,68,68,0.5)] animate-pulse border-[12px] border-rose-500/20" />
        )}

        {/* DAY TRANSITION OVERLAY */}
        <AnimatePresence>
          {showDayOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1500] flex flex-col items-center justify-center pointer-events-none bg-stone-950/20 backdrop-blur-[2px]"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 1.1, opacity: 0 }}
                className="text-center"
              >
                <div className="text-stone-400 font-black tracking-[1.5em] uppercase text-xs mb-4 ml-6">{t.day}</div>
                <h1 className="text-[180px] font-black italic tracking-tighter leading-none text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  {day.toString().padStart(2, '0')}
                </h1>
                <div className="h-1 w-32 bg-emerald-500 mx-auto rounded-full mt-4" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SLEEP OVERLAY */}
        {isSleeping && (
          <div className="fixed inset-0 bg-black z-[1000] animate-in fade-in duration-1000 flex items-center justify-center">
            <div className="text-white font-black text-5xl tracking-[0.5em] animate-pulse">
              {language === 'tr' ? 'UYUYOR...' : 'SLEEPING...'}
            </div>
          </div>
        )}

        {/* GAME OVER SCREEN */}
        {isDead && (
          <div className="fixed inset-0 bg-stone-950/90 z-[2000] flex items-center justify-center backdrop-blur-3xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="text-center max-w-2xl px-8"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                <div className="text-stone-500 font-black tracking-[1em] uppercase text-xs mb-4">Final Moments</div>
                <h2 className="text-rose-600 text-[120px] font-black italic tracking-tighter leading-none mb-6 drop-shadow-[0_0_50px_rgba(225,29,72,0.4)]">
                  {language === 'tr' ? 'VAES GEÇTİN' : 'DEFEATED'}
                </h2>
                <p className="text-white/40 text-lg font-medium leading-relaxed max-w-md mx-auto">
                  {language === 'tr'
                    ? `Doğa bazen en güçlü olanı bile dize getirir. Tam ${day} gün boyunca direndin.`
                    : `Nature sometimes brings down even even the strongest. You endured for ${day} days.`}
                </p>
              </motion.div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
                <button
                  onClick={() => {
                    useGameStore.getState().resetGame();
                    useGameStore.setState({ isDead: false });
                  }}
                  className="group relative px-12 py-6 bg-white text-stone-950 font-black text-xl rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.2)]"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-700" />
                    {language === 'tr' ? 'YENİDEN DENE' : 'TRY AGAIN'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    useGameStore.setState({ isDead: false, isMainMenuOpen: true });
                  }}
                  className="px-12 py-6 bg-white/5 hover:bg-white/10 text-white font-black text-xl rounded-full border border-white/10 transition-all hover:scale-105"
                >
                  {language === 'tr' ? 'ANA MENÜ' : 'MAIN MENU'}
                </button>
              </div>
            </motion.div>
          </div>
        )}


        {/* COMPACT TOP-LEFT HUD */}
        <div className="absolute top-6 left-6 z-50">
          <div className="bg-[#1a1c23]/40 backdrop-blur-2xl p-5 rounded-[32px] shadow-2xl w-[250px] h-[400px] border border-white/10 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 via-emerald-400 to-transparent" />

            <div className="flex justify-between items-end mb-6 relative z-10">
              <div>
                <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">{t.day}</div>
                <div className="text-4xl font-black text-emerald-400 italic leading-none tracking-tighter drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                  {day.toString().padStart(2, '0')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">{t.time}</div>
                <div className="text-lg font-black text-white tabular-nums leading-none">
                  {Math.floor(gameTime / 100).toString().padStart(2, '0')}:
                  {Math.floor((gameTime % 100) * 0.6).toString().padStart(2, '0')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 relative z-10 flex-grow">
              <VitalCard label={t.health} value={health} color="bg-rose-500" icon="❤️" />
              <div className="grid grid-cols-2 gap-2">
                <VitalCard label={t.hunger} value={hunger} color="bg-amber-500" icon="🍗" />
                <VitalCard label={t.thirst} value={thirst} color="bg-blue-500" icon="💧" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <VitalCard label={(t as any).temp || t.temperature} value={(temperature / 50) * 100} color="bg-teal-500" icon="🌡️" actualValue={`${Math.round(temperature)}°C`} />
                <VitalCard label={language === 'tr' ? 'YÜK' : 'LOAD'} value={(Object.values(inventory).reduce((a: number, b: any) => a + (b || 0), 0) / 200) * 100} color="bg-indigo-500" icon="📦" actualValue={`${Object.values(inventory).reduce((a: number, b: any) => a + (b || 0), 0)}`} />
              </div>
            </div>

            {/* Capacity Info */}
            <div className="mt-auto pt-6 border-t border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{language === 'tr' ? 'ENVANTER' : 'INVENTORY'}</span>
                <span className={`text-[11px] font-black tabular-nums ${Object.values(inventory).reduce((a: number, b: any) => a + (b || 0), 0) > 180 ? 'text-rose-500' : 'text-white/40'}`}>
                  {Object.values(inventory).reduce((a: number, b: any) => a + (b || 0), 0)}/200
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(Object.values(inventory).reduce((a: number, b: any) => a + (b || 0), 0) / 200) * 100}%` }}
                  style={{ backgroundColor: Object.values(inventory).reduce((a: number, b: any) => a + (b || 0), 0) > 180 ? '#f43f5e' : '#10b981' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* TOP-RIGHT CONTROLS */}
        <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            <div className="glass bg-stone-950/40 backdrop-blur-3xl rounded-full px-5 py-2.5 flex items-center justify-center gap-4 border-white/5 shadow-2xl scale-[0.85] origin-right">
              <span className="text-[10px] font-black text-white/30 tabular-nums uppercase w-6 text-center">{dirLeft}</span>
              <div className="w-[1px] h-4 bg-white/10" />
              <span className="text-[11px] font-black text-white tabular-nums uppercase w-6 text-center drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{dirCenter}</span>
              <div className="w-[1px] h-4 bg-white/10" />
              <span className="text-[10px] font-black text-white/30 tabular-nums uppercase w-6 text-center">{dirRight}</span>
            </div>

            <button
              onClick={toggleFullScreen}
              className="glass bg-stone-950/40 h-[42px] px-4 rounded-full flex items-center justify-center text-white/40 shadow-2xl hover:bg-white/10 transition-all active:scale-95 border border-white/5 scale-[0.85] origin-right"
            >
              <Maximize size={16} />
            </button>
          </div>

          {/* ITEM LIST - Repositioned under buttons */}
          <div className="bg-[#1a1c23]/90 backdrop-blur-3xl rounded-[24px] border border-white/10 overflow-hidden flex flex-col shadow-2xl min-w-[140px] origin-top-right">
            <ResourceCard icon={<Axe size={14} />} count={inventory.wood || 0} label={t.wood} />
            <ResourceCard icon={<Mountain size={14} />} count={inventory.stone || 0} label={t.stone} />
            <ResourceCard icon={<Zap size={14} />} count={inventory.flint_stone || 0} label={(t as any).flint_stone} />
            <ResourceCard icon={<Droplets size={14} />} count={(inventory.water || 0) + (inventory.waterEmpty || 0)} label={t.water} />
            <ResourceCard icon={<Target size={14} />} count={inventory.arrow || 0} label={(t as any).arrow} />
            <ResourceCard icon={<Flame size={14} />} count={inventory.campfire || 0} label={(t as any).campfire} />
          </div>
        </div>

        {/* HOTBAR (Bottom Center) */}
        <Hotbar />

        {/* DYNAMIC NOTIFICATIONS (Bottom Left) */}
        <div className="absolute bottom-10 left-10 z-50 flex flex-col gap-3">
          {notifications.slice(-5).map((n) => (
            <div key={n.id} className="bg-stone-900/90 backdrop-blur-md px-6 py-4 rounded-[20px] flex items-center gap-4 shadow-2xl border border-white/10 animate-in fade-in slide-in-from-left duration-300">
              <div className={`w-2 h-2 rounded-full ${n.type === 'success' ? 'bg-emerald-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
              <span className="text-[11px] font-black text-white uppercase tracking-tighter">{n.message}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default App;
