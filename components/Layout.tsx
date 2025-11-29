import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  Truck, 
  ClipboardList, 
  Package, 
  Settings, 
  Menu, 
  LogOut,
  CircleUser,
  Wrench,
  Users,
  UserPlus,
  ClipboardCheck,
  BarChart,
  Database,
  Droplets,
  Fingerprint,
  Activity
} from 'lucide-react';
import logoUrl from './recycle-logo.png';

// Helper component for Navigation Items
const NavItem = ({ to, icon: Icon, children, onClick }: any) => {
    const { currentPath, navigate } = useAuth();
    const isActive = currentPath === to;
    
    return (
        <button 
            onClick={() => {
                navigate(to);
                if (onClick) onClick();
            }}
            className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out text-left relative ${
            isActive 
                ? 'bg-green-50 text-green-700 translate-x-1' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1'
            }`}
        >
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-green-500 rounded-r-md"></div>
            )}
            <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
            {children}
        </button>
    );
};

// Custom Three-Leaf Recycle Logo
const Logo = () => (
    <img src={logoUrl} alt="Evergreen Gulf Logo" className="h-10 w-10 mr-3" />
);

/**
 * MAIN LAYOUT COMPONENT
 * Handles the persistent Sidebar (Desktop) / Drawer (Mobile), Header, and content area.
 * Navigation items are conditionally rendered based on Permissions only.
 */
export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, hasPermission, hasRole } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
      if (window.confirm("Are you sure you want to log out?")) {
          logout();
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-800 bg-opacity-50 z-20 lg:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-out lg:transform-none shadow-lg lg:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-20 flex flex-col justify-center px-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
          <div className="flex items-center">
            <Logo />
            <div className="leading-tight animate-fade-in">
               <span className="block text-sm font-bold text-gray-900">Evergreen Gulf</span>
               <span className="block text-xs text-green-600">Recycle Hub LLC</span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-5rem)] custom-scrollbar">
          <div className="mb-6 px-2">
            <p className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-2">Operations</p>
            
            {/* Dashboard is available to everyone logged in */}
            <NavItem to="/" icon={LayoutDashboard} onClick={() => setIsSidebarOpen(false)}>Dashboard</NavItem>
            
            {hasPermission('VIEW_ATTENDANCE') && (
                <NavItem to="/attendance" icon={Fingerprint} onClick={() => setIsSidebarOpen(false)}>Attendance</NavItem>
            )}

            {hasPermission('VIEW_MACHINES') && (
                <NavItem to="/machines" icon={Activity} onClick={() => setIsSidebarOpen(false)}>Machine Status</NavItem>
            )}

            {hasPermission('VIEW_ANALYTICS') && (
               <NavItem to="/performance" icon={BarChart} onClick={() => setIsSidebarOpen(false)}>Performance</NavItem>
            )}

            {/* Task Board: Visible if you can view tasks OR manage them */}
            {(hasPermission('VIEW_TASKS') || hasPermission('MANAGE_TASKS')) && (
                <NavItem to="/tasks" icon={ClipboardCheck} onClick={() => setIsSidebarOpen(false)}>
                {hasPermission('MANAGE_TASKS') ? 'Task Board' : 'My Tasks'}
                </NavItem>
            )}

            {/* Inventory Access Check */}
            {(hasPermission('VIEW_INVENTORY') || hasPermission('MANAGE_INVENTORY')) && (
               <NavItem to="/inventory" icon={Package} onClick={() => setIsSidebarOpen(false)}>Inventory</NavItem>
            )}
            
            {(hasPermission('VIEW_LOGS') || hasPermission('MANAGE_LOGS')) && (
                <NavItem to="/logs" icon={ClipboardList} onClick={() => setIsSidebarOpen(false)}>Daily Logs</NavItem>
            )}
            
            {(hasPermission('VIEW_LOGISTICS') || hasPermission('MANAGE_LOGISTICS')) && (
               <NavItem to="/operations" icon={Truck} onClick={() => setIsSidebarOpen(false)}>Logistics</NavItem>
            )}
            
            {/* Maintenance usually tied to Tech role or Admin, using View Tasks/Logs as proxy or explicit role check */}
            {(hasRole([UserRole.ADMIN, UserRole.TECHNICIAN])) && (
              <NavItem to="/maintenance" icon={Wrench} onClick={() => setIsSidebarOpen(false)}>Maintenance</NavItem>
            )}

            {(hasPermission('VIEW_VISITORS') || hasPermission('MANAGE_VISITORS')) && (
               <NavItem to="/visitors" icon={UserPlus} onClick={() => setIsSidebarOpen(false)}>Visitor Log</NavItem>
            )}

            {hasPermission('VIEW_WATER_LEVEL') && (
               <NavItem to="/water" icon={Droplets} onClick={() => setIsSidebarOpen(false)}>Water Level</NavItem>
            )}
          </div>

          {/* Administration Menu */}
          {(hasPermission('MANAGE_USERS') || hasPermission('MANAGE_SYSTEM')) && (
            <div className="mb-6 px-2">
                <div className="h-px bg-gray-100 mb-4 mx-2"></div>
                <p className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Administration</p>
                
                {hasPermission('MANAGE_USERS') && (
                    <NavItem to="/admin/users" icon={Users} onClick={() => setIsSidebarOpen(false)}>User Access</NavItem>
                )}
                
                {hasPermission('MANAGE_SYSTEM') && (
                   <NavItem to="/admin/system" icon={Database} onClick={() => setIsSidebarOpen(false)}>System Config</NavItem>
                )}
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Glassmorphism Header */}
        <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-gray-200/80 bg-white/80 backdrop-blur-md transition-all duration-200">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 flex justify-end items-center">
            <div className="flex items-center space-x-4">
               {/* User Profile Info */}
               <div className="hidden md:flex flex-col items-end animate-fade-in">
                 <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                 <span className="text-xs text-gray-500">{user?.jobTitle || user?.role}</span>
               </div>
               
               {user?.photoUrl ? (
                   <img src={user.photoUrl} alt="Profile" className="h-9 w-9 rounded-full object-cover border-2 border-green-100 shadow-sm transition-transform hover:scale-105" />
               ) : (
                   <div className="h-9 w-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 border-2 border-green-200 shadow-sm transition-transform hover:scale-105">
                     <CircleUser className="h-5 w-5" />
                   </div>
               )}
               
               <div className="h-6 w-px bg-gray-200 mx-2"></div>
               <button 
                 onClick={handleLogout}
                 className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                 title="Logout"
               >
                 <LogOut className="h-5 w-5" />
               </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 scroll-smooth custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};