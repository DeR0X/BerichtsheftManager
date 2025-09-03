import React, { useState, useRef } from 'react';
import { Upload, Trash2, Edit, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/localStorage';

interface SignatureManagerProps {
  onSignatureUpdate?: (signature: string) => void;
}

const SignatureManager: React.FC<SignatureManagerProps> = ({ onSignatureUpdate }) => {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [textSignature, setTextSignature] = useState(
    profile?.signature_image || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine Bilddatei aus.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('Die Datei ist zu groß. Bitte wählen Sie eine Datei unter 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      
      // Benutzer aktualisieren
      const updatedUser = db.updateUser(user.id, { signature_image: base64 });
      if (updatedUser) {
        onSignatureUpdate?.(base64);
        alert('Unterschrift erfolgreich hochgeladen!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTextSignatureSave = () => {
    if (!user) return;

    const updatedUser = db.updateUser(user.id, { signature_image: textSignature });
    if (updatedUser) {
      onSignatureUpdate?.(textSignature);
      setIsEditing(false);
      alert('Text-Unterschrift erfolgreich gespeichert!');
    }
  };

  const handleRemoveSignature = () => {
    if (!user) return;

    const updatedUser = db.updateUser(user.id, { signature_image: undefined });
    if (updatedUser) {
      setTextSignature(`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim());
      onSignatureUpdate?.('');
      alert('Unterschrift entfernt!');
    }
  };

  const isImageSignature = profile?.signature_image?.startsWith('data:image/');
  const hasSignature = profile?.signature_image && profile.signature_image.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Meine Unterschrift
        </h3>
        
        <div className="flex items-center space-x-2">
          {hasSignature && (
            <button
              onClick={handleRemoveSignature}
              className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              title="Unterschrift entfernen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bild hochladen
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Aktuelle Unterschrift anzeigen */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Aktuelle Unterschrift:
        </label>
        
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          {isImageSignature ? (
            <img
              src={profile?.signature_image}
              alt="Unterschrift"
              className="max-h-20 max-w-full object-contain"
            />
          ) : (
            <div className="text-lg font-signature text-gray-900 dark:text-white">
              {profile?.signature_image || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()}
            </div>
          )}
        </div>
      </div>

      {/* Text-Unterschrift bearbeiten */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Text-Unterschrift:
          </label>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-2 py-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              <Edit className="h-3 w-3 mr-1" />
              Bearbeiten
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleTextSignatureSave}
                className="inline-flex items-center px-2 py-1 text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
              >
                <Save className="h-3 w-3 mr-1" />
                Speichern
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setTextSignature(profile?.signature_image || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim());
                }}
                className="inline-flex items-center px-2 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-3 w-3 mr-1" />
                Abbrechen
              </button>
            </div>
          )}
        </div>
        
        {isEditing ? (
          <input
            type="text"
            value={textSignature}
            onChange={(e) => setTextSignature(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            placeholder="Ihr Name für die Unterschrift"
          />
        ) : (
          <div className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            {textSignature || 'Keine Text-Unterschrift festgelegt'}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>• Laden Sie ein Bild Ihrer Unterschrift hoch (PNG, JPG, max. 2MB)</p>
        <p>• Oder verwenden Sie eine Text-Unterschrift mit Ihrem Namen</p>
        <p>• Die Unterschrift wird automatisch in genehmigte Wochenberichte eingefügt</p>
      </div>
    </div>
  );
};

export default SignatureManager;