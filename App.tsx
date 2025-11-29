




import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './modules/Dashboard';
import { Inventory } from './modules/Inventory';
import { DailyLogs } from './modules/DailyLogs';
import { Operations } from './modules/Operations';
import { Maintenance } from './modules/Maintenance';
import { UserManagement } from './modules/UserManagement';
import { VisitorLog } from './modules/VisitorLog';
import { TaskBoard } from './modules/TaskBoard';
import { WorkerPerformance } from './modules/WorkerPerformance';
import { SystemConfig } from './modules/SystemConfig';
import { Attendance } from './modules/Attendance';
import { WaterLevel } from './modules/WaterLevel';
import { MachineStatus } from './modules/MachineStatus';
import { db } from './services/mockDatabase';
import { UserRole } from './types';
import { Lock, Server, ArrowRight, CircleHelp } from 'lucide-react';
import { Button } from './components/ui/Button';
import logoUrl from './components/recycle-logo.png';

const LoginScreen = () => {
  const { login, notify } = useAuth();
  const users = db.getUsers();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedUserId) return;
      
      const user = db.getUserById(selectedUserId);
      if (user) {
          if (user.password === password) {
              login(user.id);
          } else {
              setError('Incorrect Password');
              notify('Incorrect Password');
          }
      }
  };

  const handleForgotPassword = () => {
      alert("Please contact System Architect Yasin or the Admin team to reset your password.");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration - very subtle light blobs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-green-50 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row z-10">
        
        {/* Left Side: Brand (Clean White with Green Accents) */}
        <div className="md:w-1/2 p-12 bg-white flex flex-col justify-between border-r border-gray-100">
           <div>
               <img src={logoUrl} alt="Evergreen Gulf Logo" className="w-16 h-16 mb-8" />
               <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Evergreen Gulf</h1>
               <p className="text-green-600 font-medium text-lg">Recycle Hub LLC</p>
           </div>
           
           <div className="space-y-6 mt-12">
              <p className="text-sm text-gray-500 leading-relaxed">
                 Advanced E-Waste Management System. 
                 <br/>Secure, scalable, and AI-driven operations.
              </p>
              <div className="flex items-center text-xs text-green-600 bg-green-50 w-fit px-3 py-1.5 rounded-full">
                  <Server className="w-3 h-3 mr-2" />
                  <span className="font-semibold">System Online</span>
              </div>
           </div>
        </div>

        {/* Right Side: Login */}
        <div className="md:w-1/2 p-12 bg-gray-50/50">
           <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
              Staff Login
           </h2>
           <p className="text-gray-400 text-sm mb-8">Select your profile to continue.</p>
           
           {!selectedUserId ? (
               <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {users.map(u => (
                    <button
                        key={u.id}
                        onClick={() => { setSelectedUserId(u.id); setError(''); }}
                        className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all group text-left"
                    >
                        <div>
                        <p className="font-bold text-gray-800 group-hover:text-green-700">{u.name}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold group-hover:text-green-600/70">{u.jobTitle || u.role}</p>
                        </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                            <ArrowRight className="text-gray-400 group-hover:text-green-600 w-4 h-4" />
                        </div>
                    </button>
                ))}
               </div>
           ) : (
               <div className="animate-fade-in">
                   <div className="mb-6 flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                             {users.find(u => u.id === selectedUserId)?.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                             <p className="font-bold text-gray-900">{users.find(u => u.id === selectedUserId)?.name}</p>
                             <button onClick={() => {setSelectedUserId(null); setPassword('');}} className="text-xs text-blue-500 hover:underline">Change User</button>
                        </div>
                   </div>
                   
                   <form onSubmit={handleLogin} className="space-y-4">
                       <div>
                           <div className="flex justify-between items-center mb-1">
                               <label className="block text-sm font-medium text-gray-700">Enter Password</label>
                           </div>
                           <input 
                               type="password"
                               autoFocus
                               required
                               className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white"
                               placeholder="••••••"
                               value={password}
                               onChange={(e) => setPassword(e.target.value)}
                           />
                           {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                       </div>
                       
                       <Button type="submit" className="w-full py-3">Login</Button>
                       
                       <div className="flex justify-between items-center mt-4">
                           <button type="button" onClick={handleForgotPassword} className="text-xs text-gray-500 hover:text-green-600 flex items-center">
                               <CircleHelp className="w-3 h-3 mr-1" /> Forgot Password?
                           </button>
                           <p className="text-xs text-gray-400">Default: 123</p>
                       </div>
                   </form>
               </div>
           )}
           
           <div className="mt-8 pt-6 border-t border-gray-200 text-center">
               <p className="text-xs text-gray-400">System Architect: Yasin • v2.8.0</p>
           </div>
        </div>
      </div>
    </div>
  );
};

// Protected Route Logic
const ProtectedContent = () => {
  const { isAuthenticated, hasRole, currentPath, navigate } = useAuth();

  if (!isAuthenticated) {
      return <LoginScreen />;
  }

  // Router Switch
  switch (currentPath) {
    case '/':
      return <Layout><Dashboard /></Layout>;
    case '/performance':
      return <Layout><WorkerPerformance /></Layout>;
    case '/inventory':
      return <Layout><Inventory /></Layout>;
    case '/tasks':
      return <Layout><TaskBoard /></Layout>;
    case '/logs':
      return <Layout><DailyLogs /></Layout>;
    case '/operations':
      return <Layout><Operations /></Layout>;
    case '/maintenance':
      return <Layout><Maintenance /></Layout>;
    case '/visitors':
      return <Layout><VisitorLog /></Layout>;
    case '/attendance':
      return <Layout><Attendance /></Layout>;
    case '/water':
      return <Layout><WaterLevel /></Layout>;
    case '/machines':
      return <Layout><MachineStatus /></Layout>;
    case '/admin/users':
      return <Layout><UserManagement /></Layout>;
    case '/admin/system':
      return <Layout><SystemConfig /></Layout>;
    case '/login':
      return <LoginScreen />;
    default:
      navigate('/');
      return null;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <ProtectedContent />
    </AuthProvider>
  );
}