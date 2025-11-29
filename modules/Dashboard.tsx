
import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  Line,
  ComposedChart,
  Legend
} from 'recharts';
import { db } from '../services/mockDatabase';
import { generateInventoryInsights } from '../services/geminiService';
import { Sparkles, ArrowUpRight, ArrowDownRight, Package, Megaphone, Pencil, Activity, Users, UserCheck, AlertTriangle, Calendar, Clock, Truck, CheckSquare, BarChart as BarChartIcon, Scale, Layers } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Initialize with empty/loading state to prevent hydration mismatches
  const [inventory, setInventory] = useState(db.getInventory());
  const [machines, setMachines] = useState(db.getMachines());
  const [logs, setLogs] = useState(db.getLogs(user!));
  const [config, setConfig] = useState(db.getConfig());
  const [waterLevels, setWaterLevels] = useState(db.getWaterLevels());
  const [upcomingMaintenance, setUpcomingMaintenance] = useState(db.getUpcomingMaintenance());
  const [lastVisitor, setLastVisitor] = useState(db.getVisitors()[0]);
  const [lastLogistics, setLastLogistics] = useState(db.getLogisticsEntries()[0]);
  const [myTasks, setMyTasks] = useState(db.getAssignedTasks(user!).filter(t => t.status !== 'DONE').slice(0, 3));
  const [yesterdayStats, setYesterdayStats] = useState(db.getYesterdayPerformance());

  const [insight, setInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [newRemark, setNewRemark] = useState(config.adminRemark);
  
  // Chart Toggles
  const [inventoryMetric, setInventoryMetric] = useState<'WEIGHT' | 'UNITS'>('WEIGHT');

  // Force refresh data on mount to ensure "interconnectedness"
  useEffect(() => {
      setInventory(db.getInventory());
      setMachines(db.getMachines());
      setLogs(db.getLogs(user!));
      setConfig(db.getConfig());
      setWaterLevels(db.getWaterLevels());
      setUpcomingMaintenance(db.getUpcomingMaintenance());
      setLastVisitor(db.getVisitors()[0]);
      setLastLogistics(db.getLogisticsEntries()[0]);
      setMyTasks(db.getAssignedTasks(user!).filter(t => t.status !== 'DONE').slice(0, 3));
      setYesterdayStats(db.getYesterdayPerformance());
  }, [user]);

  // --- KPI CALCULATIONS ---

  // 1. Current Stock (Raw Material Inventory)
  const totalWeight = inventory.filter(i => i.status === 'CURRENT').reduce((acc, item) => acc + item.quantityKg, 0);
  const totalUnits = inventory.filter(i => i.status === 'CURRENT').reduce((acc, item) => acc + (item.quantityUnits || 0), 0);
  
  // 2. Active Machines
  const activeMachines = machines.filter(m => m.status === 'OPERATIONAL').length;
  
  // 3. Daily Output (Real-time from Work Logs)
  const todayStr = new Date().toISOString().split('T')[0];
  const dailyWeightProcessed = logs
    .filter(l => l.date === todayStr)
    .reduce((acc, l) => acc + (l.weightProcessedKg || 0), 0);
  
  const dailyUnitsProcessed = logs
    .filter(l => l.date === todayStr)
    .reduce((acc, l) => acc + (l.quantityProcessed || 0), 0);

  // 4. Attendance (Mock for now)
  const staffCount = db.getUsers().filter(u => u.role !== UserRole.ADMIN).length;
  const presentCount = db.getAttendanceByDate(todayStr).filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;

  
  // --- CHART DATA PREPARATION ---

  // Pie Chart: Inventory Composition
  const chartData = inventory
    .filter(i => i.status === 'CURRENT')
    .map(item => ({
        name: item.type,
        value: inventoryMetric === 'WEIGHT' ? item.quantityKg : (item.quantityUnits || 0)
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value); // Sort descending

  // Bar Chart: Weekly Volume (Last 7 Days from Logs)
  const getWeeklyData = () => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
        
        const dayLogs = logs.filter(l => l.date === dStr);
        const weight = dayLogs.reduce((acc, l) => acc + (l.weightProcessedKg || 0), 0);
        const units = dayLogs.reduce((acc, l) => acc + (l.quantityProcessed || 0), 0);
            
        data.push({ day: dayLabel, weight, units });
    }
    return data;
  };
  const weeklyChartData = getWeeklyData();
  const hasWeeklyData = weeklyChartData.some(d => d.weight > 0 || d.units > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4'];

  // Calls Gemini API to analyze inventory data
  const handleGetInsight = async () => {
    setLoadingAi(true);
    const result = await generateInventoryInsights(inventory, machines);
    setInsight(result);
    setLoadingAi(false);
  };

  // Updates the global Admin announcement banner
  const handleUpdateRemark = () => {
    db.updateAdminRemark(newRemark);
    setConfig(db.getConfig());
    setIsEditingRemark(false);
  };

  const StatCard = ({ title, value, subValue, icon: Icon, trend, delay, subtext }: any) => (
    <div 
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover-lift animate-slide-up"
        style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {subValue && <div className="text-sm font-semibold text-gray-600 mt-0.5">{subValue}</div>}
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} flex items-center`}>
            {trend === 'up' ? <ArrowUpRight size={12} className="mr-1"/> : <ArrowDownRight size={12} className="mr-1"/>}
            Live
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of facility operations</p>
        </div>
        <div className="flex space-x-2">
           <Button onClick={handleGetInsight} isLoading={loadingAi} className="w-full sm:w-auto shadow-md">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Smart Analysis
           </Button>
        </div>
      </div>

      {/* Admin Remarks Section */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-sm">
         <div className="flex justify-between items-start">
             <div className="flex items-start space-x-4">
                 <div className="bg-amber-100 p-2 rounded-full">
                     <Megaphone className="w-6 h-6 text-amber-600" />
                 </div>
                 <div className="flex-1">
                     <h3 className="text-amber-900 font-bold text-lg">Admin Remarks</h3>
                     {!isEditingRemark ? (
                        <p className="text-amber-800 mt-2 leading-relaxed">{config.adminRemark}</p>
                     ) : (
                        <div className="mt-3 animate-fade-in">
                             <textarea 
                                className="w-full p-3 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                                rows={3}
                                value={newRemark}
                                onChange={(e) => setNewRemark(e.target.value)}
                             />
                             <div className="flex space-x-2 mt-3">
                                <Button size="sm" onClick={handleUpdateRemark}>Save Update</Button>
                                <Button size="sm" variant="ghost" onClick={() => setIsEditingRemark(false)}>Cancel</Button>
                             </div>
                        </div>
                     )}
                 </div>
             </div>
             {user?.role === UserRole.ADMIN && !isEditingRemark && (
                 <button 
                    onClick={() => setIsEditingRemark(true)} 
                    className="text-amber-600 hover:text-amber-800 hover:bg-amber-100 p-2 rounded-full transition-colors"
                 >
                     <Pencil className="w-4 h-4" />
                 </button>
             )}
         </div>
      </div>

      {/* ALERTS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Water Alerts */}
          {(waterLevels.fire < 25 || waterLevels.normal < 25 || waterLevels.drinking < 25) ? (
               <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center shadow-sm">
                   <AlertTriangle className="w-6 h-6 text-red-600 mr-3"/>
                   <div>
                       <h4 className="font-bold text-red-900">Critical Water Level Alert</h4>
                       <p className="text-sm text-red-700">One or more tanks are below 25%. Please check Water Level module immediately.</p>
                   </div>
                   <Button size="sm" variant="danger" className="ml-auto" onClick={() => window.location.hash = '#/water'}>Check</Button>
               </div>
          ) : (
             <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center shadow-sm">
                 <CheckSquare className="w-6 h-6 text-green-600 mr-3"/>
                 <div>
                     <h4 className="font-bold text-green-900">Water Levels Normal</h4>
                     <p className="text-sm text-green-700">All tanks functioning within optimal range.</p>
                 </div>
             </div>
          )}

          {/* Maintenance Alerts */}
          {upcomingMaintenance.length > 0 ? (
               <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center shadow-sm">
                   <Clock className="w-6 h-6 text-yellow-600 mr-3"/>
                   <div>
                       <h4 className="font-bold text-yellow-900">Maintenance Due</h4>
                       <p className="text-sm text-yellow-700">{upcomingMaintenance.length} tasks scheduled for the upcoming week.</p>
                   </div>
                   <Button size="sm" variant="secondary" className="ml-auto" onClick={() => window.location.hash = '#/maintenance'}>View</Button>
               </div>
          ) : (
               <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center shadow-sm">
                   <CheckSquare className="w-6 h-6 text-blue-600 mr-3"/>
                   <div>
                       <h4 className="font-bold text-blue-900">Maintenance Clear</h4>
                       <p className="text-sm text-blue-700">No upcoming maintenance tasks for this week.</p>
                   </div>
               </div>
          )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
            title="Current Stock" 
            value={`${totalWeight.toLocaleString()} kg`} 
            subValue={`${totalUnits.toLocaleString()} Items`}
            icon={Package} 
            trend="up" 
            delay={100} 
            subtext="Total Inventory" 
        />
        <StatCard 
            title="Active Machines" 
            value={`${activeMachines} / ${machines.length}`} 
            icon={Activity} 
            delay={200} 
            subtext="Live Status" 
        />
        <StatCard 
            title="Daily Output" 
            value={`${dailyWeightProcessed.toLocaleString()} kg`} 
            subValue={`${dailyUnitsProcessed.toLocaleString()} Units`}
            icon={Package} 
            trend={(dailyWeightProcessed > 0 || dailyUnitsProcessed > 0) ? 'up' : undefined} 
            delay={300} 
            subtext="Today's Processing" 
        />
        <StatCard 
            title="Staff Present" 
            value={`${presentCount} / ${staffCount}`} 
            icon={Users} 
            delay={400} 
            subtext="Today's Attendance" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity Feed */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-blue-500"/> Recent Activity
              </h3>
              <div className="space-y-4">
                  {lastVisitor ? (
                      <div className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="bg-blue-100 p-2 rounded-full mr-3 text-blue-600">
                              <UserCheck className="w-4 h-4"/>
                          </div>
                          <div>
                              <p className="text-xs font-bold text-gray-500 uppercase">Last Visitor</p>
                              <p className="text-sm font-bold text-gray-800">{lastVisitor.name}</p>
                              <p className="text-xs text-gray-500">{lastVisitor.purpose} • {lastVisitor.inTime}</p>
                          </div>
                      </div>
                  ) : (
                      <div className="text-xs text-gray-400 p-2 text-center">No recent visitors</div>
                  )}
                  {lastLogistics ? (
                      <div className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="bg-green-100 p-2 rounded-full mr-3 text-green-600">
                              <Truck className="w-4 h-4"/>
                          </div>
                          <div>
                              <p className="text-xs font-bold text-gray-500 uppercase">Last Load</p>
                              <p className="text-sm font-bold text-gray-800">{lastLogistics.customerName}</p>
                              <p className="text-xs text-gray-500">{lastLogistics.totalNetWeight} kg • {new Date(lastLogistics.date).toLocaleDateString()}</p>
                          </div>
                      </div>
                  ) : (
                      <div className="text-xs text-gray-400 p-2 text-center">No recent logistics</div>
                  )}
                  {myTasks.length > 0 && (
                      <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                           <p className="text-xs font-bold text-indigo-500 uppercase mb-2">My Pending Tasks</p>
                           <ul className="space-y-2">
                               {myTasks.map(t => (
                                   <li key={t.id} className="text-xs text-indigo-900 flex justify-between">
                                       <span>• {t.title}</span>
                                       <span className="font-bold">{t.dueDate}</span>
                                   </li>
                               ))}
                           </ul>
                      </div>
                  )}
              </div>
          </div>

          {/* Yesterday's Performance */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
               <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-orange-500"/> Yesterday's Performance
               </h3>
               <div className="space-y-6">
                   <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                       <p className="text-xs font-bold text-orange-400 uppercase">Total Processed (Current Stocks Added)</p>
                       <p className="text-3xl font-bold text-orange-600">{yesterdayStats.totalWeight.toLocaleString()} kg</p>
                       <p className="text-xs text-gray-400 mt-1">Old + New Entries</p>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                       <div>
                           <p className="text-xs font-bold text-gray-500 uppercase">Top Performer</p>
                           <p className="text-lg font-bold text-gray-800">{yesterdayStats.topPerformer.name}</p>
                       </div>
                       <div className="text-right">
                           <p className="text-xl font-bold text-green-600">{yesterdayStats.topPerformer.weight} kg</p>
                           <p className="text-xs text-gray-400">Contribution</p>
                       </div>
                   </div>
               </div>
          </div>

          {/* AI Insights Display Area */}
          <div className="lg:col-span-1">
            {insight ? (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 animate-fade-in shadow-sm h-full">
                <h3 className="flex items-center text-indigo-900 font-semibold mb-3">
                    <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
                    Gemini Insights
                </h3>
                <div className="prose prose-sm text-indigo-800 max-w-none bg-white/50 p-4 rounded-lg border border-indigo-50 h-[200px] overflow-y-auto custom-scrollbar">
                    <div className="whitespace-pre-line leading-relaxed">{insight}</div>
                </div>
                </div>
            ) : (
                 <div className="h-full bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center p-6 text-center text-gray-400 text-sm">
                     <p>Click "AI Smart Analysis" to generate operational insights.</p>
                 </div>
            )}
          </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Breakdown Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Inventory Composition</h3>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button 
                    onClick={() => setInventoryMetric('WEIGHT')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${inventoryMetric === 'WEIGHT' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                  >
                      By Weight
                  </button>
                  <button 
                    onClick={() => setInventoryMetric('UNITS')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${inventoryMetric === 'UNITS' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                  >
                      By Count
                  </button>
              </div>
          </div>
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={5}
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value: number) => `${value.toLocaleString()} ${inventoryMetric === 'WEIGHT' ? 'kg' : 'units'}`}
                    />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Package className="w-12 h-12 mb-2 opacity-20"/>
                    <p className="text-sm">No inventory stock data found.</p>
                </div>
            )}
          </div>
        </div>

        {/* Weekly Efficiency Composed Chart (Lines + Bars) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Weekly Processing Volume</h3>
          <div className="h-80 w-full">
            {hasWeeklyData ? (
                <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={weeklyChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#22c55e'}} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#3b82f6'}} />
                    <Tooltip 
                        cursor={{fill: '#f9fafb'}} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="weight" name="Weight (kg)" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={30} />
                    <Line yAxisId="right" type="monotone" dataKey="units" name="Units (Count)" stroke="#3b82f6" strokeWidth={3} dot={{r:4}} />
                </ComposedChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <BarChartIcon className="w-12 h-12 mb-2 opacity-20"/>
                    <p className="text-sm">No processing data for this week.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
