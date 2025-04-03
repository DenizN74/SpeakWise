import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Book,
  LogOut,
  Settings,
  Users,
  BarChart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLayout: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => location.pathname === `/admin${path}`;

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, text: 'Dashboard', href: '' },
    { icon: <Book size={20} />, text: 'Lessons', href: '/lessons' },
    { icon: <Users size={20} />, text: 'Users', href: '/users' },
    { icon: <BarChart size={20} />, text: 'Analytics', href: '/analytics' },
    { icon: <Settings size={20} />, text: 'Settings', href: '/settings' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600">Admin Panel</h1>
        </div>
        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(`/admin${item.href}`)}
              className={`flex items-center w-full px-6 py-3 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
                isActive(item.href) ? 'bg-indigo-50 text-indigo-600' : ''
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.text}</span>
            </button>
          ))}
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-6 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={20} />
            <span className="ml-3">Sign Out</span>
          </button>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};