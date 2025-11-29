





import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/mockDatabase';
import { Button } from '../components/ui/Button';
import { Activity, Power, Thermometer, Zap, RotateCw, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { Machine } from '../types';

export const MachineStatus: React.FC = () => {
  const { hasPermission, notify } = useAuth();
  const [machines, setMachines] = useState<Machine[]>(db.getMachines());
  const [isSyncing, setIsSyncing] = useState(false);

  if (!hasPermission('VIEW_MACHINES')) {
      return <div className="p-10 text-center text-gray-500">Access Denied</div>;
  }

  const syncMachineData = () => {
      setIsSyncing(true);
      
      setTimeout(() => {
          // Simulate fetching fresh data from IoT Gateway
          const updatedMachines = machines.map(m => {
              if (m.isManualControl) return m; // Skip manual override machines

              // If machine is offline or maintenance, minimal change
              if (m.status !== 'OPERATIONAL') return m;

              // If Operational, simulate fluctuations
              const newTemp = 40 + Math.floor(Math.random() * 40); // 40-80 deg C
              const newRpm = m.name.includes('Conveyor') ? 0 : 1000 + Math.floor(Math.random() * 2000); // Random RPM
              const newPower = 10 + Math.random() * 20; // 10-30 kW

              return {
                  ...m,
                  temperature: newTemp,
                  rpm: newRpm,
                  powerUsage: parseFloat(newPower.toFixed(1))
              };
          });

          // Save simulation updates to DB just for session persistence if needed
          updatedMachines.forEach(m => db.updateMachineStatus(m.id, m));
          setMachines(updatedMachines);
          setIsSyncing(false);
          notify("Machine Telemetry Synced Successfully");
      }, 2000);
  };
  
  const toggleMachine = (id: string) => {
      const updated: Machine[] = machines.map(m => {
          if (m.id === id) {
              const newStatus: 'OPERATIONAL' | 'OFFLINE' = m.status === 'OPERATIONAL' ? 'OFFLINE' : 'OPERATIONAL';
              return { 
                  ...m, 
                  status: newStatus,
                  isManualControl: true, // Lock to manual
                  rpm: newStatus === 'OFFLINE' ? 0 : 1200,
                  powerUsage: newStatus === 'OFFLINE' ? 0 : 25,
                  temperature: newStatus === 'OFFLINE' ? 25 : 60
              };
          }
          return m;
      });
      updated.forEach(m => db.updateMachineStatus(m.id, m));
      setMachines(updated);
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'OPERATIONAL': return 'bg-green-500';
          case 'MAINTENANCE': return 'bg-yellow-500';
          case 'OFFLINE': return 'bg-gray-400';
          default: return 'bg-gray-400';
      }
  };

  return (
      <div className="space-y-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Activity className="w-6 h-6 mr-2 text-indigo-600"/> Machine Status
              </h1>
              <p className="text-gray-500 text-sm">
                Live monitoring of plant machinery health and performance.
              </p>
            </div>
            <Button onClick={syncMachineData} isLoading={isSyncing} className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`}/> 
                Sync IoT Data
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {machines.map(machine => (
                  <div key={machine.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover-lift transition-all">
                      {/* Header */}
                      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                          <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(machine.status)} animate-pulse shadow-sm`}></div>
                              <h3 className="font-bold text-gray-800">{machine.name}</h3>
                          </div>
                          
                          <div className="flex items-center gap-2">
                              {/* Manual Toggle Switch */}
                              <button onClick={() => toggleMachine(machine.id)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                                  {machine.status === 'OPERATIONAL' ? (
                                      <ToggleRight className="w-8 h-8 text-green-500" />
                                  ) : (
                                      <ToggleLeft className="w-8 h-8 text-gray-300" />
                                  )}
                              </button>
                          </div>
                      </div>

                      {/* Stats */}
                      <div className="p-6 grid grid-cols-2 gap-6">
                          <div className="flex items-start space-x-3">
                              <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                                  <Thermometer className="w-5 h-5"/>
                              </div>
                              <div>
                                  <p className="text-xs text-gray-500 uppercase font-semibold">Temp</p>
                                  <p className="text-xl font-bold text-gray-900">{machine.temperature || 0}°C</p>
                              </div>
                          </div>

                          <div className="flex items-start space-x-3">
                              <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                  <RotateCw className="w-5 h-5"/>
                              </div>
                              <div>
                                  <p className="text-xs text-gray-500 uppercase font-semibold">RPM</p>
                                  <p className="text-xl font-bold text-gray-900">{machine.rpm || 0}</p>
                              </div>
                          </div>

                          <div className="flex items-start space-x-3">
                              <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                                  <Zap className="w-5 h-5"/>
                              </div>
                              <div>
                                  <p className="text-xs text-gray-500 uppercase font-semibold">Power</p>
                                  <p className="text-xl font-bold text-gray-900">{machine.powerUsage || 0} kW</p>
                              </div>
                          </div>

                           <div className="flex items-start space-x-3">
                              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                  <Power className="w-5 h-5"/>
                              </div>
                              <div>
                                  <p className="text-xs text-gray-500 uppercase font-semibold">Uptime</p>
                                  <p className="text-xl font-bold text-gray-900">
                                      {machine.status === 'OPERATIONAL' ? 'Active' : 'Idle'}
                                  </p>
                              </div>
                          </div>
                      </div>
                      
                      {/* Footer Info */}
                      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
                          <span>Last Service: {machine.lastServiceDate}</span>
                          <span>ID: {machine.id}</span>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );
};