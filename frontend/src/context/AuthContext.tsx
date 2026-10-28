import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ROLE_CREDENTIALS: Record<UserRole, { username: string; pass: string; title: string }> = {
  SUPER_ADMIN: { username: 'superadmin', pass: 'Admin@123', title: 'Super Administrator' },
  PLANT_ADMIN: { username: 'plantadmin', pass: 'Plant@123', title: 'Plant Operations Admin' },
  CONTROL_ROOM_OPERATOR: { username: 'operator', pass: 'Operator@123', title: 'Control-Room Operator' },
  SAFETY_OFFICER: { username: 'safety', pass: 'Safety@123', title: 'Chief Safety Officer' },
  SECURITY_PERSONNEL: { username: 'security', pass: 'Security@123', title: 'Plant Security Unit' },
  MAINTENANCE_ENGINEER: { username: 'maintenance', pass: 'Maint@123', title: 'Reliability Engineer' },
  WORKER: { username: 'worker', pass: 'Worker@123', title: 'Floor Worker / Operator' },
  READ_ONLY_AUDITOR: { username: 'auditor', pass: 'Auditor@123', title: 'ISO Compliance Auditor' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const me = await api.getMe();
          setUser(me);
          setRole(me.role as UserRole);
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    setRole(res.role as UserRole);
    const me = await api.getMe();
    setUser(me);
  };

  const quickLogin = async (targetRole: UserRole) => {
    const creds = ROLE_CREDENTIALS[targetRole];
    if (creds) {
      await login(creds.username, creds.pass);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        quickLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
