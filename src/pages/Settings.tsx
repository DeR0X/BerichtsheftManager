import React from 'react';
import { User, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SignatureManager from '../components/Reports/SignatureManager';

const Settings: React.FC = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Einstellungen
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Verwalten Sie Ihre Kontoeinstellungen und Unterschrift
        </p>
      </div>

      {/* Benutzerinformationen */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <User className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Benutzerinformationen
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <div className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
              {profile?.full_name || 'Nicht verfügbar'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              E-Mail
            </label>
            <div className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
              {profile?.email || 'Nicht verfügbar'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rolle
            </label>
            <div className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white capitalize">
              {profile?.role === 'azubi' ? 'Auszubildende/r' : 'Ausbilder/in'}
            </div>
          </div>
          
          {profile?.company && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unternehmen
              </label>
              <div className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
                {profile.company}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unterschriftenverwaltung */}
      <SignatureManager />
    </div>
  );
};

export default Settings;