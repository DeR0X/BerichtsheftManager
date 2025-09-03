import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, CheckCircle, Clock, Send, X } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { db, Report, ReportFeedback } from '../../lib/localStorage';
import { useAuth } from '../../contexts/AuthContext';

interface FeedbackManagerProps {
  report: Report;
  onStatusChange?: (newStatus: Report['status']) => void;
}

const FeedbackManager: React.FC<FeedbackManagerProps> = ({ report, onStatusChange }) => {
  const { user, profile } = useAuth();
  const [feedback, setFeedback] = useState<ReportFeedback[]>([]);
  const [isAddingFeedback, setIsAddingFeedback] = useState(false);
  const [newFeedbackMessage, setNewFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'correction' | 'approval' | 'rejection'>('correction');
  const [fieldCorrections, setFieldCorrections] = useState<{ field: string; message: string }[]>([]);

  useEffect(() => {
    loadFeedback();
  }, [report.id]);

  const loadFeedback = () => {
    const reportFeedback = db.getFeedbackByReportId(report.id);
    setFeedback(reportFeedback);
  };

  const handleAddFeedback = () => {
    if (!user || !newFeedbackMessage.trim()) return;

    const newFeedback = db.createReportFeedback({
      report_id: report.id,
      feedback_type: feedbackType,
      message: newFeedbackMessage.trim(),
      field_corrections: fieldCorrections.length > 0 ? fieldCorrections : undefined,
      created_by: user.id,
    });

    // Report-Status aktualisieren
    let newStatus: Report['status'] = report.status;
    const updateData: Partial<Report> = {};

    switch (feedbackType) {
      case 'correction':
        newStatus = 'needs_correction';
        updateData.correction_requested_at = new Date().toISOString();
        break;
      case 'approval':
        newStatus = 'approved';
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user.id;
        // Ausbilder-Unterschrift hinzufügen
        if (profile?.signature_image) {
          updateData.ausbilder_signature = profile.signature_image;
        } else {
          updateData.ausbilder_signature = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
        }
        updateData.signed_at = new Date().toISOString();
        break;
      case 'rejection':
        newStatus = 'rejected';
        updateData.rejected_at = new Date().toISOString();
        break;
    }

    updateData.status = newStatus;
    const updatedReport = db.updateReport(report.id, updateData);

    if (updatedReport) {
      onStatusChange?.(newStatus);
      loadFeedback();
      setIsAddingFeedback(false);
      setNewFeedbackMessage('');
      setFieldCorrections([]);
    }
  };

  const addFieldCorrection = () => {
    setFieldCorrections([...fieldCorrections, { field: '', message: '' }]);
  };

  const updateFieldCorrection = (index: number, field: 'field' | 'message', value: string) => {
    const updated = [...fieldCorrections];
    updated[index][field] = value;
    setFieldCorrections(updated);
  };

  const removeFieldCorrection = (index: number) => {
    setFieldCorrections(fieldCorrections.filter((_, i) => i !== index));
  };

  const getFeedbackIcon = (type: ReportFeedback['feedback_type']) => {
    switch (type) {
      case 'approval':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejection':
        return <X className="h-4 w-4 text-red-600" />;
      case 'correction':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const getFeedbackTypeText = (type: ReportFeedback['feedback_type']) => {
    switch (type) {
      case 'approval':
        return 'Genehmigt';
      case 'rejection':
        return 'Abgelehnt';
      case 'correction':
        return 'Korrektur erforderlich';
      default:
        return 'Feedback';
    }
  };

  const getFeedbackColor = (type: ReportFeedback['feedback_type']) => {
    switch (type) {
      case 'approval':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'rejection':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'correction':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const canAddFeedback = profile?.role === 'ausbilder' && ['submitted', 'needs_correction'].includes(report.status);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Feedback & Korrekturen
        </h3>
        
        {canAddFeedback && !isAddingFeedback && (
          <button
            onClick={() => setIsAddingFeedback(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Feedback hinzufügen
          </button>
        )}
      </div>

      {/* Feedback hinzufügen */}
      {isAddingFeedback && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feedback-Typ:
              </label>
              <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value as any)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="correction">Korrektur erforderlich</option>
                <option value="approval">Genehmigen</option>
                <option value="rejection">Ablehnen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nachricht:
              </label>
              <textarea
                value={newFeedbackMessage}
                onChange={(e) => setNewFeedbackMessage(e.target.value)}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                placeholder="Ihr Feedback oder Ihre Korrekturen..."
              />
            </div>

            {feedbackType === 'correction' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Spezifische Feldkorrekturen:
                  </label>
                  <button
                    onClick={addFieldCorrection}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    + Feldkorrektur hinzufügen
                  </button>
                </div>
                
                {fieldCorrections.map((correction, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={correction.field}
                      onChange={(e) => updateFieldCorrection(index, 'field', e.target.value)}
                      placeholder="Feld (z.B. Montag, Dienstag...)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="text"
                      value={correction.message}
                      onChange={(e) => updateFieldCorrection(index, 'message', e.target.value)}
                      placeholder="Korrekturhinweis"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      onClick={() => removeFieldCorrection(index)}
                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-3">
              <button
                onClick={handleAddFeedback}
                disabled={!newFeedbackMessage.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                Feedback senden
              </button>
              
              <button
                onClick={() => {
                  setIsAddingFeedback(false);
                  setNewFeedbackMessage('');
                  setFieldCorrections([]);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback-Liste */}
      <div className="space-y-4">
        {feedback.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Noch kein Feedback
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {canAddFeedback 
                ? 'Fügen Sie Feedback für diesen Wochenbericht hinzu.'
                : 'Warten Sie auf Feedback vom Ausbilder.'
              }
            </p>
          </div>
        ) : (
          feedback.map((item) => {
            const creator = db.getUserById(item.created_by);
            return (
              <div
                key={item.id}
                className={`border rounded-lg p-4 ${getFeedbackColor(item.feedback_type)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getFeedbackIcon(item.feedback_type)}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getFeedbackTypeText(item.feedback_type)}
                    </span>
                  </div>
                  
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    <p>{creator?.full_name || 'Unbekannt'}</p>
                    <p>{format(new Date(item.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {item.message}
                </p>
                
                {item.field_corrections && item.field_corrections.length > 0 && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Spezifische Korrekturen:
                    </h4>
                    <div className="space-y-2">
                      {item.field_corrections.map((correction, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {correction.field}:
                          </span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {correction.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FeedbackManager;