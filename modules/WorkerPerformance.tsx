
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { db } from '../services/mockDatabase';
import { UserRole, WorkLog, MaterialType, WorkCategory } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, Activity, Clock, Target, Calendar, BarChart2 } from 'lucide-react';

// --- EXPANDED COLOR PALETTE ---
const MATERIAL_COLORS: Record<string, string> = {
  [MaterialType.GOLD_PLATE_BOARD]: '#eab308', 
  [MaterialType.RAM]: '#facc15', 
  [MaterialType.PROCESSOR]: '#fbbf24', 
  [MaterialType.PCB]: '#4ade80', 
  [MaterialType.MOTHERBOARD]: '#22c55e', 
  [MaterialType.MEDIUM_BOARD]: '#16a34a', 
  [MaterialType.HIGH_GRADE_BOARD]: '#15803d', 
  [MaterialType.COPPER]: '#f97316', 
  [MaterialType.DIRTY_COPPER]: '#c2410c', 
  [MaterialType.IRON]: '#475569', 
  [MaterialType.METAL]: '#64748b', 
  [MaterialType.ALUMINUM]: '#94a3b8', 
  [MaterialType.BATTERY]: '#ef4444', 
  [MaterialType.PLASTIC]: '#3b82f6', 
  DEFAULT: '#e2e8f0' 
};

const getColorForMaterial = (mat: string) => {
    return MATERIAL_COLORS[mat] || MATERIAL_COLORS.DEFAULT;
};

export const WorkerPerformance: React.FC = () => {
  const { user, hasPermission } = useAuth();
  
  // Use State to hold data to ensure re-render on mount/updates
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [users, setUsers] = useState(db.getUsers());
  
  const [timeRange, setTimeRange] = useState<'WEEK' | 'MONTH' | 'ALL'>('WEEK');
  const [metricMode, setMetricMode] = useState<'WEIGHT' | 'UNITS'>('WEIGHT');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('ALL');

  useEffect(() => {
      if (user) {
          setLogs(db.getLogs(user));
          setUsers(db.getUsers());
      }
  }, [user]);

  if (!user || !hasPermission('VIEW_ANALYTICS')) {
     return <div className="p-10 text-center text-gray-500">You do not have permission to view performance analytics.</div>;
  }

  // --- Data Filtering based on Time Range ---
  const filteredLogs = useMemo(() => {
    let data = logs;
    const now = new Date();
    if (timeRange === 'WEEK') {
        const lastWeek = new Date();
        lastWeek.setDate(now.getDate() - 7);
        data = data.filter(l => new Date(l.date) >= lastWeek);
    } else if (timeRange === 'MONTH') {
        const lastMonth = new Date();
        lastMonth.setMonth(now.getMonth() - 1);
        data = data.filter(l => new Date(l.date) >= lastMonth);
    }
    return data;
  }, [logs, timeRange]);

  const workers = users.filter(u => u.role === UserRole.WORKER || u.role === UserRole.TECHNICIAN);

  // --- Aggregate: All Workers Stacked Data (Team View) ---
  const allWorkersData = useMemo(() => {
      const data: Record<string, any> = {};
      const materialKeys = new Set<string>();

      filteredLogs.forEach(log => {
          if (!data[log.userId]) {
              data[log.userId] = { name: log.userName, totalWeight: 0, totalUnits: 0, totalHours: 0 };
          }
          
          let value = 0;
          let matKey = '';

          // Determine key based on metric mode
          if (metricMode === 'WEIGHT' && log.weightProcessedKg) {
              value = log.weightProcessedKg;
              matKey = log.materialType || 'Mixed';
          } else if (metricMode === 'UNITS' && log.quantityProcessed) {
              value = log.quantityProcessed;
              // Use deviceType for Tech Ops, or materialType for Sorting
              matKey = log.deviceType || log.materialType || 'Units';
          }

          if (value > 0 && matKey) {
              materialKeys.add(matKey);
              data[log.userId][matKey] = (data[log.userId][matKey] || 0) + value;
              if (metricMode === 'WEIGHT') data[log.userId].totalWeight += value;
              else data[log.userId].totalUnits += value;
          }
          
          if (log.hoursWorked && log.category !== WorkCategory.LEAVE) {
              data[log.userId].totalHours += log.hoursWorked;
          }
      });

      const sortedKeys = Array.from(materialKeys).sort();
      const sortKey = metricMode === 'WEIGHT' ? 'totalWeight' : 'totalUnits';

      return {
          chartData: Object.values(data).filter((d:any) => d[sortKey] > 0).sort((a: any, b: any) => b[sortKey] - a[sortKey]), 
          keys: sortedKeys
      };
  }, [filteredLogs, metricMode]);

  // --- Aggregate: Individual Stats View ---
  const individualStats = useMemo(() => {
      if (selectedWorkerId === 'ALL') return null;

      const workerLogs = filteredLogs.filter(l => l.userId === selectedWorkerId);
      const otherLogs = filteredLogs.filter(l => l.userId !== selectedWorkerId);
      const workerName = workers.find(u => u.id === selectedWorkerId)?.name || 'Worker';

      const getValue = (l: WorkLog) => (metricMode === 'WEIGHT' ? (l.weightProcessedKg || 0) : (l.quantityProcessed || 0));

      const myTotal = workerLogs.reduce((acc, l) => acc + getValue(l), 0);
      const uniqueOthers = new Set(otherLogs.map(l => l.userId)).size || 1;
      const othersTotal = otherLogs.reduce((acc, l) => acc + getValue(l), 0);
      const avg = uniqueOthers > 0 ? othersTotal / uniqueOthers : 0;

      // Find Top Performer dynamically
      const totalsByUser: Record<string, number> = {};
      filteredLogs.forEach(l => totalsByUser[l.userId] = (totalsByUser[l.userId] || 0) + getValue(l));
      
      let topPerformerWeight = 0;
      Object.values(totalsByUser).forEach(val => {
          if (val > topPerformerWeight) topPerformerWeight = val;
      });
      
      const comparisonData = [
          { name: workerName, value: myTotal, fill: '#16a34a' },
          { name: 'Team Avg', value: avg, fill: '#94a3b8' }, 
          { name: 'Top Performer', value: topPerformerWeight, fill: '#eab308' } 
      ];

      // Material Distribution Pie
      const materialsDist: Record<string, number> = {};
      workerLogs.forEach(l => {
          const val = getValue(l);
          if (val > 0) {
              const key = metricMode === 'WEIGHT' ? l.materialType : (l.deviceType || l.materialType || 'Units');
              if (key) materialsDist[key] = (materialsDist[key] || 0) + val;
          }
      });
      const pieData = Object.entries(materialsDist).map(([name, value]) => ({ name, value }));

      // Daily Trend (Area Chart)
      const dailyTrend: Record<string, number> = {};
      workerLogs.forEach(l => {
           dailyTrend[l.date] = (dailyTrend[l.date] || 0) + getValue(l);
      });
      const areaData = Object.entries(dailyTrend)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Metrics
      const totalHours = workerLogs.reduce((acc, l) => acc + (l.hoursWorked || 0), 0);
      const efficiency = totalHours > 0 ? (myTotal / totalHours).toFixed(1) : '0';
      const daysWorked = new Set(workerLogs.map(l => l.date)).size;

      return { comparisonData, pieData, areaData, metrics: { totalHours, efficiency, daysWorked, myTotal } };
  }, [selectedWorkerId, filteredLogs, workers, metricMode]);


  return (
    <div className="space-y-6 animate-slide-up pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-blue-600"/> Performance Analytics
          </h1>
          <p className="text-gray-500 text-sm">
            Analysis of output efficiency and material processing
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
            {/* Metric Toggle */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-0.5 flex mr-2">
                <button
                    onClick={() => setMetricMode('WEIGHT')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                        metricMode === 'WEIGHT' ? 'bg-green-50 text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                    Weight (kg)
                </button>
                <button
                    onClick={() => setMetricMode('UNITS')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                        metricMode === 'UNITS' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                    Units (Count)
                </button>
            </div>

            {/* Time Range Selector */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-0.5 flex mr-2">
                {(['WEEK', 'MONTH', 'ALL'] as const).map(range => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                            timeRange === range ? 'bg-gray-100 text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        {range === 'ALL' ? 'All' : range.charAt(0) + range.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>
            
            {/* Worker Selector */}
            <select
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
            >
                <option value="ALL">All Team Overview</option>
                <optgroup label="Staff Members">
                    {workers.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                </optgroup>
            </select>
        </div>
      </div>

      {selectedWorkerId === 'ALL' ? (
          /* --- TEAM OVERVIEW --- */
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-yellow-500"/> Team Leaderboard ({metricMode === 'WEIGHT' ? 'Kg' : 'Units'})
              </h3>
              <div className="h-96 w-full">
                  {allWorkersData.chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                              data={allWorkersData.chartData}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                          >
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9"/>
                              <XAxis type="number" hide/>
                              <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={100} 
                                tick={{fontSize: 12, fontWeight: 600, fill: '#475569'}}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip 
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                              />
                              <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                              
                              {/* Render bars for each material type */}
                              {allWorkersData.keys.map(matKey => (
                                  <Bar 
                                      key={matKey} 
                                      dataKey={matKey} 
                                      stackId="a" 
                                      fill={getColorForMaterial(matKey)} 
                                      radius={[0, 4, 4, 0]}
                                      barSize={30}
                                      name={matKey.replace(/_/g, ' ')}
                                  />
                              ))}
                          </BarChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <BarChart2 className="w-12 h-12 mb-3 opacity-20"/>
                          <p>No {metricMode.toLowerCase()} data found for this period.</p>
                      </div>
                  )}
              </div>
          </div>
      ) : (
          /* --- INDIVIDUAL DASHBOARD --- */
          individualStats && (
            <div className="space-y-6 animate-fade-in">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover-lift">
                         <div className="flex items-center text-gray-500 mb-2">
                             <Target className="w-4 h-4 mr-2"/>
                             <span className="text-xs font-bold uppercase">Total {metricMode}</span>
                         </div>
                         <p className="text-2xl font-bold text-gray-900">{individualStats.metrics.myTotal.toLocaleString()} <span className="text-sm font-normal text-gray-500">{metricMode === 'WEIGHT' ? 'kg' : 'units'}</span></p>
                     </div>
                     <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover-lift">
                         <div className="flex items-center text-gray-500 mb-2">
                             <Activity className="w-4 h-4 mr-2"/>
                             <span className="text-xs font-bold uppercase">Efficiency</span>
                         </div>
                         <p className="text-2xl font-bold text-blue-600">{individualStats.metrics.efficiency} <span className="text-sm font-normal text-gray-500">{metricMode === 'WEIGHT' ? 'kg/hr' : 'units/hr'}</span></p>
                     </div>
                     <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover-lift">
                         <div className="flex items-center text-gray-500 mb-2">
                             <Clock className="w-4 h-4 mr-2"/>
                             <span className="text-xs font-bold uppercase">Total Hours</span>
                         </div>
                         <p className="text-2xl font-bold text-gray-900">{individualStats.metrics.totalHours} <span className="text-sm font-normal text-gray-500">hrs</span></p>
                     </div>
                     <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover-lift">
                         <div className="flex items-center text-gray-500 mb-2">
                             <Calendar className="w-4 h-4 mr-2"/>
                             <span className="text-xs font-bold uppercase">Days Active</span>
                         </div>
                         <p className="text-2xl font-bold text-gray-900">{individualStats.metrics.daysWorked} <span className="text-sm font-normal text-gray-500">days</span></p>
                     </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Performance Comparison Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-gray-700 mb-6">Output Comparison ({metricMode})</h4>
                        <div className="h-64">
                             <ResponsiveContainer width="100%" height="100%">
                                 <BarChart data={individualStats.comparisonData} barSize={60}>
                                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 500}}/>
                                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}}/>
                                     <Tooltip 
                                        cursor={{fill: '#f8fafc'}}
                                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                                     />
                                     <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {individualStats.comparisonData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                     </Bar>
                                 </BarChart>
                             </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Material Composition Pie */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-gray-700 mb-6">Output Breakdown ({metricMode})</h4>
                        <div className="h-64">
                             {individualStats.pieData.length > 0 ? (
                                 <ResponsiveContainer width="100%" height="100%">
                                     <PieChart>
                                         <Pie
                                            data={individualStats.pieData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                         >
                                             {individualStats.pieData.map((entry, index) => (
                                                 <Cell key={`cell-${index}`} fill={getColorForMaterial(entry.name)} />
                                             ))}
                                         </Pie>
                                         <Tooltip 
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                                            formatter={(val: number) => `${val.toFixed(1)} ${metricMode === 'WEIGHT' ? 'kg' : 'u'}`}
                                         />
                                         <Legend 
                                            layout="vertical" 
                                            align="right" 
                                            verticalAlign="middle"
                                            wrapperStyle={{fontSize: '11px'}}
                                            formatter={(val) => val.replace(/_/g, ' ')}
                                         />
                                     </PieChart>
                                 </ResponsiveContainer>
                             ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <p className="text-sm">No data found.</p>
                                </div>
                             )}
                        </div>
                    </div>
                    
                    {/* Daily Trend Area Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2 hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-gray-700 mb-6">Daily Output Trend ({metricMode})</h4>
                        <div className="h-64">
                             {individualStats.areaData.length > 0 ? (
                                 <ResponsiveContainer width="100%" height="100%">
                                     <AreaChart data={individualStats.areaData}>
                                         <defs>
                                             <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                                                 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                                 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                             </linearGradient>
                                         </defs>
                                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                         <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}}/>
                                         <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}}/>
                                         <Tooltip 
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                                         />
                                         <Area 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#3b82f6" 
                                            strokeWidth={3}
                                            fillOpacity={1} 
                                            fill="url(#colorOutput)" 
                                         />
                                     </AreaChart>
                                 </ResponsiveContainer>
                             ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <p className="text-sm">No trend data available.</p>
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>
          )
      )}
    </div>
  );
};
