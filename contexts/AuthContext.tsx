
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, Permission } from '../types';
import { db } from '../services/mockDatabase';

interface AuthContextType {
  user: User | null;
  login: (userId: string) => void;
  logout: () => void;
  refreshProfile: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
  currentPath: string;
  navigate: (path: string) => void;
  notify: (message: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AUTH PROVIDER
 * Manages global user state, session persistence (memory/navigation), 
 * and shared utilities like notifications (toasts).
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // Custom Hash Router implementation since we don't have a backend server
  const [currentPath, setCurrentPath] = useState(window.location.hash.replace('#', '') || '/');
  
  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Listen for hash changes to update the view
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.replace('#', '') || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const notify = (message: string) => {
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 3000); // Auto-dismiss
  };

  const login = (userId: string) => {
    const foundUser = db.getUserById(userId);
    if (foundUser) {
      setUser(foundUser);
      notify(`Welcome back, ${foundUser.name}`);
      navigate('/');
    } else {
      notify('User profile not found');
    }
  };

  const logout = () => {
    setUser(null);
    notify('Logged out successfully');
    navigate('/login');
  };

  // Re-fetches user data from DB to reflect permission changes instantly
  const refreshProfile = () => {
    if (user) {
        const updatedUser = db.getUserById(user.id);
        if (updatedUser) {
            setUser(updatedUser);
        }
    }
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const hasPermission = (permission: Permission) => {
    if (!user) return false;
    // Yasin (u1) is the System Architect and retains full access always
    if (user.id === 'u1') return true; 
    
    // STRICT MODE: Removed blanket Admin access. 
    // Permissions must be explicitly assigned for the module to show.
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshProfile, isAuthenticated: !!user, hasRole, hasPermission, currentPath, navigate, notify }}>
      {children}
      
      {/* Global Toast Notification Component */}
      {toastMessage && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
              <div className="bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2 border border-gray-700">
                  <span className="w-2 h-2 bg-green-50 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium">{toastMessage}</span>
              </div>
          </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
