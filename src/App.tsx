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

import { Maximize, Flame, Axe, Mountain, Target } from 'lucide-react';
import { Environment } from '@react-three/drei';
import { motion } from 'framer-motion';



function App() {
  const { day, gameTime, setGameTime, updateVitals, health, hunger, thirst, language, setLanguage, inventory, temperature, notifications, bearing, isMenuOpen, setMenuOpen, isMainMenuOpen, setMainMenuOpen, isHovering, isSleeping } = useGameStore();

  const { craft: craftAction } = useKeyboard();
  const t = TRANSLATIONS[language];

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
        if (isMenuOpen) setMenuOpen(false);
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
      if (useGameStore.getState().shelterLevel > 0 && useGameStore.getState().shelterPosition) {
        const sPos = useGameStore.getState().shelterPosition!;
        const distToShelter = Math.sqrt(
          Math.pow(sPos[0] - playerPos[0], 2) +
          Math.pow(sPos[2] - playerPos[2], 2)
        );
        if (distToShelter < 4) {
          warmthModifier += 15; // Shelter is warm
          isResting = true; // Resting in shelter
        }
      }

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
    <div className="fixed inset-0 w-full h-full bg-stone-950 overflow-hidden select-none">
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

      {isMenuOpen && <CraftingMenu onClose={() => setMenuOpen(false)} />}
      <MainMenu />

      {/* CROSSHAIR */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-200 shadow-[0_0_10px_rgba(255,255,255,1)] ${isHovering
          ? 'bg-yellow-400 scale-150 shadow-[0_0_15px_rgba(250,204,21,1)]'
          : 'bg-white opacity-60'
          }`} />
      </div>

      {/* SLEEP OVERLAY */}
      {isSleeping && (
        <div className="fixed inset-0 bg-black z-[200] animate-in fade-in duration-500 flex items-center justify-center">
          <div className="text-white font-black text-4xl tracking-tighter animate-pulse uppercase">
            {language === 'tr' ? 'UYUYOR...' : 'SLEEPING...'}
          </div>
        </div>
      )}


      {/* TOP-LEFT HUD */}
      <div className="absolute top-8 left-8 z-50">
        <div className="glass bg-stone-950/40 backdrop-blur-3xl p-6 rounded-[32px] border border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col gap-6 min-w-[280px]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase mb-1">{t.time || 'SURVIVAL CLOCK'}</div>
              <h2 className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none">
                {String(Math.floor(gameTime / 100)).padStart(2, '0')}<span className="animate-pulse">:</span>{String(Math.floor((gameTime % 100) * 0.6)).padStart(2, '0')}
              </h2>
            </div>
            <div className="bg-white/5 px-3 py-1 rounded-full border border-white/10 text-[10px] font-black text-white/60 tracking-widest uppercase">
              {t.day} {day}
            </div>
          </div>

          <div className="space-y-5">
            <VitalRow label={t.health} value={health} color="bg-rose-500" icon="❤️" />
            <VitalRow label={t.hunger} value={hunger} color="bg-amber-500" icon="🍖" />
            <VitalRow label={t.thirst} value={thirst} color="bg-cyan-500" icon="💧" />
            <VitalRow label={t.temp} value={(temperature / 50) * 100} color="bg-orange-400" actualValue={`${Math.round(temperature)}°C`} icon="🌡️" />
          </div>
        </div>
      </div>

      {/* TOP-RIGHT CONTROLS */}
      <div className="absolute top-8 right-8 z-50 flex items-center gap-4">
        <div className="glass bg-stone-950/40 backdrop-blur-3xl rounded-full px-8 py-4 flex items-center justify-center gap-6 border-white/5 shadow-2xl">
          <span className="text-xs font-black text-white/30 tabular-nums uppercase transition-all duration-300 w-8 text-center">{dirLeft}</span>
          <div className="w-[1px] h-6 bg-white/10" />
          <span className="text-sm font-black text-white tabular-nums uppercase transition-all scale-125 w-8 text-center drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{dirCenter}</span>
          <div className="w-[1px] h-6 bg-white/10" />
          <span className="text-xs font-black text-white/30 tabular-nums uppercase transition-all duration-300 w-8 text-center">{dirRight}</span>
        </div>

        <button onClick={() => setLanguage(language === 'en' ? 'tr' : 'en')} className="glass bg-stone-950/40 w-14 h-14 rounded-2xl flex items-center justify-center text-[11px] font-black text-white shadow-2xl hover:bg-white/10 transition-all active:scale-95 border border-white/5 uppercase">
          {language}
        </button>
        <button onClick={toggleFullScreen} className="glass bg-stone-950/40 w-14 h-14 rounded-2xl flex items-center justify-center text-white/40 shadow-2xl hover:bg-white/10 transition-all active:scale-95 border border-white/5">
          <Maximize size={20} />
        </button>
      </div>

      {/* RESOURCE SUMMARY (Right Side) - Compact */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
        <ResourceCard icon={<Target size={16} className="text-rose-400" />} count={inventory.arrow || 0} />
        <ResourceCard icon={<Flame size={16} className="text-orange-400" />} count={inventory.torch || 0} />
        <ResourceCard icon={<Axe size={16} className="text-stone-400" />} count={inventory.wood || 0} />
        <ResourceCard icon={<Mountain size={16} className="text-slate-200" />} count={inventory.stone || 0} />
      </div>

      {/* HOTBAR (Bottom Center) */}
      <Hotbar />

      {/* DYNAMIC NOTIFICATIONS (Bottom Left) */}
      <div className="absolute bottom-10 left-10 z-50 flex flex-col gap-3">
        {notifications.slice(-5).map((n) => (
          <div key={n.id} className="bg-stone-900/90 backdrop-blur-md px-6 py-4 rounded-[20px] flex items-center gap-4 shadow-2xl border border-white/10 animate-in fade-in slide-in-from-left duration-300">
            <div className={`w-2 h-2 rounded-full ${n.type === 'success' ? 'bg-emerald-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
            <span className="text-xs font-black text-white uppercase tracking-tighter">{n.message}</span>
          </div>
        ))}
      </div>

    </div >
  );
}

const VitalRow = ({ label, value, color, icon, actualValue }: { label: string; value: number; color: string; icon: string; actualValue?: string }) => (
  <div className="flex flex-col gap-1.5 group">
    <div className="flex justify-between items-center px-1">
      <div className="flex items-center gap-2">
        <span className="text-sm scale-110 grayscale group-hover:grayscale-0 transition-all">{icon}</span>
        <span className="text-[10px] font-black text-white/40 tracking-[0.1em] uppercase group-hover:text-white/60 transition-colors">{label}</span>
      </div>
      <span className="text-[10px] font-black text-white/80 tabular-nums">{actualValue || `${Math.round(value)}%`}</span>
    </div>
    <div className="h-[4px] w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full ${color} shadow-[0_0_12px_rgba(255,255,255,0.2)]`}
      />
    </div>
  </div>
);

const ResourceCard = ({ icon, count }: { icon: any; count: number }) => (
  <div className="glass bg-stone-950/40 backdrop-blur-3xl px-5 py-4 rounded-2xl flex items-center gap-4 border border-white/5 shadow-xl min-w-[100px] transition-all hover:translate-x-[-12px] hover:bg-white/5 group">
    <div className="bg-white/5 p-2 rounded-lg group-hover:bg-white/10 transition-colors">
      {icon}
    </div>
    <span className="text-lg font-black text-white tabular-nums tracking-tight">{count}</span>
  </div>
);

export default App;
