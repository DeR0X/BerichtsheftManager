import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  FileText,
  Settings,
  Users,
  BarChart,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();

  const navigation = profile?.role === 'azubi' 
    ? [
        { name: 'Dashboard', href: '/dashboard', icon: BarChart },
        { name: 'Wochenberichte', href: '/reports', icon: BookOpen },
        { name: 'Kalender', href: '/calendar', icon: Calendar },
      ]
    : [
        { name: 'Dashboard', href: '/dashboard', icon: BarChart },
        { name: 'Berichte prüfen', href: '/reports', icon: BookOpen },
        { name: 'Freigaben', href: '/approvals', icon: CheckCircle },
        { name: 'Azubis', href: '/students', icon: Users },
        { name: 'Einstellungen', href: '/settings', icon: Settings },
      ];

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
            Berichtsheft
          </span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                  ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <item.icon
                  className={`mr-3 h-6 w-6 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {profile?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {profile?.full_name || 'Unbekannter Benutzer'}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
              {profile?.role || 'Benutzer'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;