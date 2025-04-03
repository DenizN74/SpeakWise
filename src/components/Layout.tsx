import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  Book,
  Users,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Mic,
  Settings
} from 'lucide-react';
import { NetworkStatus } from './NetworkStatus';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  if (!user && location.pathname !== '/login' && location.pathname !== '/register' && location.pathname !== '/') {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <div className="flex flex-col lg:flex-row">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-indigo-600">LangLearn</h1>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Sidebar */}
          <nav
            className={`${
              isMobileMenuOpen ? 'block' : 'hidden'
            } lg:block fixed lg:relative w-full lg:w-64 bg-white shadow-lg h-full z-50`}
          >
            <div className="p-4 hidden lg:block">
              <h1 className="text-2xl font-bold text-indigo-600">LangLearn</h1>
            </div>
            <div className="space-y-2 p-4">
              <NavItem
                icon={<Home size={20} />}
                text="Home"
                href="/"
                active={isActive('/')}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavItem
                icon={<LayoutDashboard size={20} />}
                text="Dashboard"
                href="/dashboard"
                active={isActive('/dashboard')}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavItem
                icon={<Book size={20} />}
                text="Lessons"
                href="/lessons"
                active={isActive('/lessons')}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavItem
                icon={<Mic size={20} />}
                text="Speaking"
                href="/speaking"
                active={isActive('/speaking')}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavItem
                icon={<Users size={20} />}
                text="Community"
                href="/community"
                active={isActive('/community')}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavItem
                icon={<Settings size={20} />}
                text="Settings"
                href="/settings"
                active={isActive('/settings')}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <button
                onClick={() => {
                  handleSignOut();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>

          {/* Main content */}
          <main className="flex-1 lg:ml-64 p-4 lg:p-8">
            {children}
          </main>
        </div>
      ) : (
        // Non-authenticated layout
        <main className="container mx-auto px-4">
          {children}
        </main>
      )}
      
      <NetworkStatus />
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  text: string;
  href: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, text, href, active, onClick }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => {
        navigate(href);
        onClick();
      }}
      className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-indigo-50 text-indigo-600'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
};