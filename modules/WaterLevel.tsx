
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/mockDatabase';
import { Droplets, ArrowUp, Zap, RefreshCw, Wifi, Activity, ArrowDown } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const WaterLevel: React.FC = () => {
  const { hasPermission, notify } = useAuth();
  
  // Initial State (Load from DB)
  const [levels, setLevels] = useState(db.getWaterLevels());

  // Pump Status (Read-only from IoT) - Local state for simulation visual only
  const [pumps, setPumps] = useState({
      intake: false,       // Underground -> Ground
      transferNormal: false, // Normal -> Overhead 1
      transferDrinking: false // Drinking -> Overhead 2
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>(new Date().toLocaleTimeString());

  // Reload levels if DB changes externally (optional, but good practice if multiple tabs)
  useEffect(() => {
     setLevels(db.getWaterLevels());
  }, []);

  if (!hasPermission('VIEW_WATER_LEVEL')) {
      return <div className="p-10 text-center text-gray-500">Access Denied</div>;
  }

  // Simulate receiving data from IoT sensors
  const syncIoTData = () => {
      setIsSyncing(true);
      setTimeout(() => {
          // Simulate Level Changes
          const newLevels = {
              fire: Math.min(100, Math.max(0, levels.fire + (Math.random() * 4 - 2))),
              normal: Math.min(100, Math.max(0, levels.normal + (Math.random() * 6 - 3))),
              drinking: Math.min(100, Math.max(0, levels.drinking + (Math.random() * 4 - 2))),
              overhead1: Math.min(100, Math.max(0, levels.overhead1 + (Math.random() * 5 - 2.5))),
              overhead2: Math.min(100, Math.max(0, levels.overhead2 + (Math.random() * 5 - 2.5)))
          };
          
          setLevels(newLevels);
          db.updateWaterLevels(newLevels); // Persist to DB for Dashboard Alerting

          // Simulate Pump Status Changes
          const newPumps = {
              intake: Math.random() > 0.6,
              transferNormal: Math.random() > 0.6,
              transferDrinking: Math.random() > 0.6
          };
          setPumps(newPumps);
          
          setLastSync(new Date().toLocaleTimeString());
          setIsSyncing(false);
          
          // Notify if pumps changed state (Simulating alert)
          if (newPumps.intake) notify("IoT Alert: Intake Pump Active");
          if (newPumps.transferNormal) notify("IoT Alert: Normal Transfer Pump Active");
      }, 1200);
  };

  // Tank Component
  const Tank = ({ name, level, color = 'bg-blue-500', size = 'large' }: any) => (
      <div className={`relative border-2 border-gray-400 bg-gray-50 rounded-lg overflow-hidden flex flex-col justify-end ${size === 'large' ? 'h-48 w-28 sm:h-64 sm:w-32' : 'h-24 w-20 sm:h-32 sm:w-24'} shadow-inner`}>
          <div 
            className={`absolute bottom-0 w-full transition-all duration-1000 ease-in-out ${color} opacity-80`} 
            style={{ height: `${level.toFixed(1)}%` }}
          >
              <div className="absolute top-0 w-full h-2 bg-white opacity-20 animate-pulse"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-white/70 px-1.5 py-0.5 rounded backdrop-blur-sm text-center">
                  <span className="text-gray-900 font-bold block text-sm">{level.toFixed(0)}%</span>
              </div>
          </div>
          <div className="absolute -bottom-8 w-full text-center text-xs font-bold text-gray-600 uppercase tracking-wide">
              {name}
          </div>
      </div>
  );

  // Pump Indicator Component
  const PumpIndicator = ({ active, label, direction = 'up' }: { active: boolean, label: string, direction?: 'up' | 'down' | 'right' }) => (
      <div className="flex flex-col items-center justify-center mx-2 z-10">
           {direction === 'up' && active && <div className="h-8 w-1 bg-blue-300 animate-pulse mb-1"></div>}
           
           <div className={`p-3 rounded-full border-4 shadow-sm transition-all duration-500 ${active ? 'bg-green-100 border-green-500 ring-4 ring-green-50' : 'bg-gray-100 border-gray-300'}`}>
                <Zap className={`w-5 h-5 ${active ? 'text-green-600 fill-current' : 'text-gray-400'}`} />
           </div>
           
           <span className={`text-[10px] font-bold uppercase mt-2 px-2 py-0.5 rounded-full ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
               {active ? 'ON' : 'OFF'}
           </span>
           <span className="text-[10px] text-gray-500 mt-1 max-w-[80px] text-center">{label}</span>
           
           {direction === 'down' && active && <div className="h-8 w-1 bg-blue-300 animate-pulse mt-1"></div>}
      </div>
  );

  return (
      <div className="space-y-8 animate-slide-up p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Droplets className="w-6 h-6 mr-2 text-blue-600"/> Water Management
                </h1>
                <p className="text-gray-500 text-sm flex items-center mt-1">
                    <Wifi className="w-3 h-3 mr-1 text-green-500" /> 
                    IoT Live Feed • Last Sync: {lastSync}
                </p>
            </div>
            <Button onClick={syncIoTData} isLoading={isSyncing} className="shadow-md bg-blue-600 hover:bg-blue-700">
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`}/>
                Sync IoT Data
            </Button>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 flex flex-col items-center gap-8 relative max-w-5xl mx-auto">
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4 hidden sm:flex flex-col items-end space-y-1">
                  <div className="flex items-center text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                      <Activity className="w-3 h-3 mr-1 text-green-500 animate-pulse"/> 
                      Monitoring Active
                  </div>
              </div>

              {/* LEVEL 1: OVERHEAD TANKS */}
              <div className="w-full">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Rooftop Level (Upper Tanks)</h3>
                  <div className="flex justify-center gap-16 sm:gap-32 pb-8">
                      <Tank name="Overhead 1 (Normal)" level={levels.overhead1} size="small" />
                      <Tank name="Overhead 2 (Drinking)" level={levels.overhead2} size="small" color="bg-cyan-400" />
                  </div>
              </div>

              {/* LEVEL 2: TRANSFER PUMPS */}
              <div className="flex justify-center gap-16 sm:gap-32 -my-4 relative z-20">
                   <div className="flex flex-col items-center">
                       {/* Line from Normal Ground to Overhead 1 */}
                       <div className={`absolute h-24 w-1 bg-gray-200 -z-10 bottom-0 left-[calc(50%-4rem)] sm:left-[calc(50%-8rem)] ${pumps.transferNormal ? 'bg-blue-200' : ''}`}></div>
                       <PumpIndicator active={pumps.transferNormal} label="Transfer Pump 1" direction="up" />
                   </div>
                   <div className="flex flex-col items-center">
                       {/* Line from Drinking Ground to Overhead 2 */}
                       <div className={`absolute h-24 w-1 bg-gray-200 -z-10 bottom-0 right-[calc(50%-4rem)] sm:right-[calc(50%-8rem)] ${pumps.transferDrinking ? 'bg-cyan-200' : ''}`}></div>
                       <PumpIndicator active={pumps.transferDrinking} label="Transfer Pump 2" direction="up" />
                   </div>
              </div>

              {/* LEVEL 3: GROUND TANKS */}
              <div className="w-full pt-8">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Ground Level (Storage Tanks)</h3>
                  <div className="flex flex-wrap justify-center gap-6 sm:gap-12 items-end">
                      <Tank name="Normal Use" level={levels.normal} color="bg-blue-500" />
                      <Tank name="Drinking Water" level={levels.drinking} color="bg-cyan-500" />
                      <div className="border-l border-gray-200 pl-6 sm:pl-12">
                          <Tank name="Fire Reserve" level={levels.fire} color="bg-red-500" />
                      </div>
                  </div>
              </div>

              {/* LEVEL 4: INTAKE PUMP */}
              <div className="pt-8 w-full flex justify-center border-t border-dashed border-gray-200 mt-4 relative">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                       <ArrowDown className="w-4 h-4 text-gray-300" />
                   </div>
                   <div className="flex items-center gap-4">
                       <span className="text-xs font-bold text-gray-500 uppercase">Underground Source</span>
                       <div className={`h-1 w-16 bg-gray-200 ${pumps.intake ? 'bg-blue-300 animate-pulse' : ''}`}></div>
                       <PumpIndicator active={pumps.intake} label="Main Intake Pump" direction="right" />
                       <div className={`h-1 w-16 bg-gray-200 ${pumps.intake ? 'bg-blue-300 animate-pulse' : ''}`}></div>
                       <span className="text-xs font-bold text-gray-500 uppercase">To Ground Tanks</span>
                   </div>
              </div>

          </div>
      </div>
  );
};
