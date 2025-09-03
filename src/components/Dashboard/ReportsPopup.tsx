import React, { useState, useEffect } from 'react';
import { X, Eye, Edit, Clock, CheckCircle, AlertCircle, Calendar, BarChart3, List, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Report, Activity, DayHours } from '../../lib/localStorage';

type ReportWithActivities = Report & {
  activities: Activity[];
  dayHours: DayHours[];
};

type ViewMode = 'list' | 'calendar' | 'stats';

interface ReportsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  reports: ReportWithActivities[];
  title: string;
  onViewReport: (year: number, week: number) => void;
  onEditReport: (year: number, week: number) => void;
}

const ReportsPopup: React.FC<ReportsPopupProps> = ({
  isOpen,
  onClose,
  reports,
  title,
  onViewReport,
  onEditReport,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'needs_correction':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'needs_correction':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Genehmigt';
      case 'submitted':
        return 'Eingereicht';
      case 'draft':
        return 'Entwurf';
      case 'needs_correction':
        return 'Korrektur erforderlich';
      case 'rejected':
        return 'Abgelehnt';
      default:
        return 'Unbekannt';
    }
  };

  const getWeekDateRange = (year: number, week: number) => {
    const weekStart = new Date(year, 0, 1 + (week - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return `${format(weekStart, 'dd.MM.', { locale: de })} - ${format(weekEnd, 'dd.MM.yyyy', { locale: de })}`;
  };

  const getTotalHours = (dayHours: DayHours[]) => {
    return dayHours.reduce((sum, dh) => sum + dh.hours + (dh.minutes / 60), 0);
  };

  const getStats = () => {
    const totalHours = reports.reduce((sum, report) => sum + getTotalHours(report.dayHours), 0);
    const avgHoursPerWeek = reports.length > 0 ? totalHours / reports.length : 0;
    const statusCounts = {
      draft: reports.filter(r => r.status === 'draft').length,
      submitted: reports.filter(r => r.status === 'submitted').length,
      approved: reports.filter(r => r.status === 'approved').length,
      needs_correction: reports.filter(r => r.status === 'needs_correction').length,
      rejected: reports.filter(r => r.status === 'rejected').length,
    };

    return { totalHours, avgHoursPerWeek, statusCounts };
  };

  const stats = getStats();

  const renderListView = () => (
    <div className="space-y-4">
      {reports.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Keine Wochenberichte vorhanden
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {title.includes('Wochenberichte') ? 'Sie haben noch keine Wochenberichte erstellt.' : `Keine ${title.toLowerCase()} vorhanden.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Header */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                  Wochenberichte Übersicht
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {reports.length} Bericht{reports.length !== 1 ? 'e' : ''} • {Math.round(stats.totalHours * 10) / 10} Gesamtstunden
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700 dark:text-blue-300">Durchschnitt</p>
                <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {Math.round(stats.avgHoursPerWeek * 10) / 10}h/Woche
                </p>
              </div>
            </div>
          </div>

          {/* Reports List */}
          {reports.map((report) => (
            <div
              key={report.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      KW {report.week_number}/{report.week_year}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      <span className="ml-1">{getStatusText(report.status)}</span>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Zeitraum:</span> {getWeekDateRange(report.week_year, report.week_number)}
                    </div>
                    <div>
                      <span className="font-medium">Stunden:</span> {Math.round(getTotalHours(report.dayHours) * 10) / 10}h
                    </div>
                    <div>
                      <span className="font-medium">Erstellt:</span> {format(new Date(report.created_at), 'dd.MM.yyyy', { locale: de })}
                    </div>
                  </div>

                  {report.activities.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Aktivitäten: {report.activities.length}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onViewReport(report.week_year, report.week_number)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title="Ansehen"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  {(report.status === 'draft' || report.status === 'needs_correction') && (
                    <button
                      onClick={() => onEditReport(report.week_year, report.week_number)}
                      className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      title="Bearbeiten"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStatsView = () => (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Gesamtstunden</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{Math.round(stats.totalHours * 10) / 10}h</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Durchschnitt/Woche</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{Math.round(stats.avgHoursPerWeek * 10) / 10}h</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Wochenberichte</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{reports.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Status der Wochenberichte</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Entwürfe</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.statusCounts.draft}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Eingereicht</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.statusCounts.submitted}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Korrektur erforderlich</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.statusCounts.needs_correction}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Abgelehnt</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.statusCounts.rejected}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Genehmigt</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.statusCounts.approved}</span>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Letzte Wochenberichte</h3>
        <div className="space-y-2">
          {reports.slice(0, 5).map((report) => (
            <div key={report.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                KW {report.week_number}/{report.week_year}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                {getStatusText(report.status)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl max-h-[90vh] overflow-hidden m-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <nav className="flex space-x-4">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <List className="h-4 w-4" />
                <span>Wochenberichte</span>
              </div>
            </button>
            
            <button
              onClick={() => setViewMode('stats')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'stats'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Statistiken</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {viewMode === 'list' ? renderListView() : renderStatsView()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {reports.length} Wochenbericht{reports.length !== 1 ? 'e' : ''} gefunden
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPopup;