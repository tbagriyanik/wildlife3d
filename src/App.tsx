import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
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

import { Maximize, Flame, Axe, Mountain, Target, Zap, Droplets } from 'lucide-react';
import { Environment } from '@react-three/drei';
import { motion } from 'framer-motion';



const VitalCard = ({ label, value, color, icon, actualValue }: { label: string; value: number; color: string; icon: string; actualValue?: string }) => {
  const isCritical = value < 20;
  return (
    <motion.div
      animate={isCritical ? { scale: [1, 1.02, 1] } : {}}
      transition={isCritical ? { repeat: Infinity, duration: 1 } : {}}
      className={`relative overflow-hidden bg-stone-900/90 rounded-2xl p-3 border-2 transition-all duration-500 ${isCritical ? 'border-rose-500/60 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'border-white/10'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xl ${isCritical ? 'animate-bounce' : ''}`}>{icon}</span>
          <span className="text-[12px] font-black text-white/50 uppercase tracking-wide">{label}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className={`text-2xl font-black tabular-nums ${isCritical ? 'text-rose-400' : 'text-white'}`}>
          {actualValue ? actualValue.split('°')[0] : Math.round(value)}
        </span>
        <span className="text-sm font-bold text-white/40">{actualValue ? '°C' : '%'}</span>
      </div>
      <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(2, Math.min(100, value))}%` }}
          className={`h-full ${color} rounded-full relative shadow-lg`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent" />
        </motion.div>
      </div>
    </motion.div>
  );
};

const ResourceCard = ({ icon, count }: { icon: React.ReactNode; count: number }) => (
  <div className="p-3.5 flex items-center justify-between group hover:bg-white/5 transition-colors">
    <div className="opacity-60 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">{icon}</div>
    <span className="text-[13px] font-black text-white/80 tabular-nums">{count}</span>
  </div>
);

function App() {
  const { day, gameTime, setGameTime, updateVitals, health, hunger, thirst, language, inventory, temperature, notifications, addNotification, bearing, isMenuOpen, setMenuOpen, isMainMenuOpen, setMainMenuOpen, isHovering, isSleeping } = useGameStore();

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
  useEffect(() => {
    if (day > 1) {
      useGameStore.getState().addNotification(`☀️ ${t.day} ${day} ${language === 'tr' ? 'BAŞLADI' : 'HAS BEGUN'}`, 'info');
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
      if (hunger <= 0 || thirst <= 0) healthDelta = -GAME_CONSTANTS.CONSUMPTION.HEALTH_DRAIN;

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
          hunger: 0.05, // Recover hunger slowly
          thirst: 0.05, // Recover thirst slowly
          health: healthDelta,
          temperature: tempDelta
        });
      } else {
        if (temperature < 15 || temperature > 42) healthDelta -= 0.2;
        updateVitals({ hunger: hungerLoss, thirst: thirstLoss, health: healthDelta, temperature: tempDelta });
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
      </div>

      {isMainMenuOpen && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[150] pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10"
          >
            <span className="text-white/40 text-[11px] font-black tracking-[0.5em] uppercase">
              {language === 'tr' ? 'OYUN DURAKLATILDI' : 'GAME PAUSED'}
            </span>
          </motion.div>
        </div>
      )}

      {isMenuOpen && <CraftingMenu onClose={() => setMenuOpen(false)} />}
      <MainMenu />

      {/* CROSSHAIR */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-200 shadow-[0_0_10px_rgba(255,255,255,1)] ${isHovering
          ? 'bg-yellow-400 scale-150 shadow-[0_0_15px_rgba(250,204,21,1)]'
          : 'bg-white opacity-60'
          }`} />
      </div>

      {/* CRITICAL CONDITION WARNING */}
      {(health < 20 || hunger < 20 || thirst < 20) && (
        <div className="fixed inset-0 z-[100] pointer-events-none shadow-[inset_0_0_150px_rgba(239,68,68,0.5)] animate-pulse border-[12px] border-rose-500/20" />
      )}

      {/* SLEEP OVERLAY */}
      {isSleeping && (
        <div className="fixed inset-0 bg-black z-[1000] animate-in fade-in duration-1000 flex items-center justify-center">
          <div className="text-white font-black text-5xl tracking-[0.5em] animate-pulse">
            {language === 'tr' ? 'UYUYOR...' : 'SLEEPING...'}
          </div>
        </div>
      )}


      {/* TOP-LEFT HUD - Larger & More Readable */}
      <div className="absolute top-6 left-6 z-50">
        <div className="bg-[#1a1c23]/95 backdrop-blur-3xl p-5 rounded-[24px] shadow-2xl w-[280px] border border-white/10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{t.day}</div>
              <div className="text-4xl font-black text-emerald-400 italic leading-none tracking-tighter">
                {day}
              </div>
            </div>
            <div className="text-2xl font-black text-white tabular-nums tracking-tighter opacity-90">
              {String(Math.floor(gameTime / 100)).padStart(2, '0')}:{String(Math.floor((gameTime % 100) * 0.6)).padStart(2, '0')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <VitalCard label={t.health} value={health} color="bg-rose-500/20" icon="❤️" />
            <VitalCard label={t.hunger} value={hunger} color="bg-amber-500/20" icon="🍞" />
            <VitalCard label={t.thirst} value={thirst} color="bg-cyan-500/20" icon="💧" />
            <VitalCard label={(t as any).temp || t.temperature} value={(temperature / 50) * 100} color="bg-purple-500/20" icon="🔥" actualValue={`${Math.round(temperature)}°C`} />
          </div>
        </div>
      </div>

      {/* TOP-RIGHT CONTROLS - Smaller Compass (25% reduction) */}
      <div className="absolute top-8 right-8 z-50 flex items-center gap-4">
        <div className="glass bg-stone-950/40 backdrop-blur-3xl rounded-full px-6 py-3 flex items-center justify-center gap-4 border-white/5 shadow-2xl scale-[0.75]">
          <span className="text-[11px] font-black text-white/30 tabular-nums uppercase transition-all duration-300 w-6 text-center">{dirLeft}</span>
          <div className="w-[1px] h-5 bg-white/10" />
          <span className="text-[12px] font-black text-white tabular-nums uppercase transition-all scale-125 w-6 text-center drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{dirCenter}</span>
          <div className="w-[1px] h-5 bg-white/10" />
          <span className="text-[11px] font-black text-white/30 tabular-nums uppercase transition-all duration-300 w-6 text-center">{dirRight}</span>
        </div>

        <button onClick={toggleFullScreen} className="glass bg-stone-950/40 w-14 h-14 rounded-2xl flex items-center justify-center text-white/40 shadow-2xl hover:bg-white/10 transition-all active:scale-95 border border-white/5">
          <Maximize size={20} />
        </button>
      </div>

      {/* RIGHT RESOURCES - List Style */}
      <div className="absolute top-1/2 -translate-y-1/2 right-6 z-50">
        <div className="bg-[#1a1c23]/80 backdrop-blur-2xl rounded-[28px] border border-white/5 overflow-hidden flex flex-col divide-y divide-white/5 shadow-2xl min-w-[120px]">
          <ResourceCard icon={<Axe size={16} className="text-emerald-400" />} count={inventory.wood || 0} />
          <ResourceCard icon={<Mountain size={16} className="text-stone-400" />} count={inventory.stone || 0} />
          <ResourceCard icon={<Zap size={16} className="text-amber-400" />} count={inventory.flint_stone || 0} />
          <ResourceCard icon={<Droplets size={16} className="text-cyan-400" />} count={(inventory.water || 0) + (inventory.waterEmpty || 0)} />
          <ResourceCard icon={<Target size={16} className="text-rose-400" />} count={inventory.arrow || 0} />
          <ResourceCard icon={<Flame size={16} className="text-orange-400" />} count={inventory.campfire || 0} />
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

    </div >
  );
}

export default App;
