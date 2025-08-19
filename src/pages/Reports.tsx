import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Calendar as CalendarIcon, Download, Clock, CheckCircle, AlertCircle, Grid3X3, BarChart3, FileText, TrendingUp, FileDown } from 'lucide-react';
import { getWeek, getYear, format, startOfWeek, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { db, Report, Activity, DayHours } from '../lib/localStorage';
import { useAuth } from '../contexts/AuthContext';
import { generateCombinedPDF, generateReportWithTemplate, generateReportWithSelectedTemplate, availableTemplates } from '../utils/pdfGenerator';
import { generateReportFromWordTemplate } from '../utils/docxGenerator';
import Calendar from '../components/Reports/Calendar';
import TemplateSelector from '../components/Reports/TemplateSelector';

type ReportWithActivities = Report & {
  activities: Activity[];
  dayHours: DayHours[];
};

type ViewMode = 'calendar' | 'table' | 'overview';

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [reports, setReports] = useState<ReportWithActivities[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  useEffect(() => {
    loadReports();
  }, [user]);

  const loadReports = async () => {
    if (!user) return;

    try {
      const userReports = db.getReportsByUserId(user.id);
      const reportsWithActivities = userReports.map(report => ({
        ...report,
        activities: db.getActivitiesByReportId(report.id),
        dayHours: db.getDayHoursByReportId(report.id),
      }));

      // Sort by week year and week number (descending)
      reportsWithActivities.sort((a, b) => {
        if (a.week_year !== b.week_year) {
          return b.week_year - a.week_year;
        }
        return b.week_number - a.week_number;
      });

      setReports(reportsWithActivities);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewReport = () => {
    const currentWeek = getWeek(new Date());
    const currentYear = getYear(new Date());
    navigate(`/reports/${currentYear}/${currentWeek}/edit`);
  };

  const handleDateClick = (date: Date) => {
    const weekNumber = getWeek(date, { weekStartsOn: 1 });
    const year = getYear(date);
    
    // Check if a report exists for this week
    const existingReport = reports.find(report => 
      report.week_number === weekNumber && report.week_year === year
    );
    
    if (existingReport) {
      navigate(`/reports/${year}/${weekNumber}/view`);
    } else {
      navigate(`/reports/${year}/${weekNumber}/edit`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'submitted':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'draft':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
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
      default:
        return 'Unbekannt';
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
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getWeekDateRange = (year: number, week: number) => {
    const weekStart = startOfWeek(new Date(year, 0, 1 + (week - 1) * 7), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    
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
    };

    return { totalHours, avgHoursPerWeek, statusCounts };
  };

  const exportAllReports = async () => {
    const approvedReports = reports.filter(r => r.status === 'approved');
    
    if (approvedReports.length === 0) {
      alert('Keine genehmigten Berichte zum Exportieren vorhanden.');
      return;
    }

    if (!profile) return;

    await generateCombinedPDF(approvedReports, profile);
  };

  const exportReportWithTemplate = async (report: ReportWithActivities) => {
    if (!profile) return;

    try {
      if (selectedTemplate) {
        // Prüfen, ob es sich um eine Word-Vorlage handelt
        if (selectedTemplate.endsWith('.docx')) {
          // Word-Vorlage verwenden
          const docxBuffer = await generateReportFromWordTemplate(report, report.activities, report.dayHours, profile, selectedTemplate);
          
          // DOCX herunterladen
          const blob = new Blob([docxBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `Wochenbericht_KW${report.week_number}_${report.week_year}_Word.docx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          URL.revokeObjectURL(url);
          
          console.log('Word-Dokument erfolgreich generiert!');
        } else {
          // PDF-Vorlage verwenden (bestehende Funktionalität)
          await generateReportWithTemplate(report, report.activities, report.dayHours, profile, selectedTemplate);
        }
      } else {
        // Keine Vorlage ausgewählt - verwende Standard
        alert('Bitte wählen Sie zuerst eine Vorlage aus.');
      }
    } catch (error) {
      console.error('Fehler beim Generieren der PDF:', error);
      alert('Fehler beim Generieren der PDF. Bitte versuchen Sie es erneut.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Wochenberichte
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Kalender, Übersicht und Verwaltung Ihrer Ausbildungsnachweise
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowTemplateSelector(!showTemplateSelector)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Vorlagen
          </button>
          
          <button
            onClick={exportAllReports}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Alle als PDF
          </button>
          
          <button
            onClick={createNewReport}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neuer Wochenbericht
          </button>
        </div>
      </div>

      {/* Template Selector */}
      {showTemplateSelector && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <TemplateSelector
            templates={availableTemplates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={setSelectedTemplate}
            onPreview={(templateUrl) => {
              // Öffne Vorlage in neuem Tab
              window.open(templateUrl, '_blank');
            }}
          />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{reports.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entwürfe</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.statusCounts.draft}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Eingereicht</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.statusCounts.submitted}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Genehmigt</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.statusCounts.approved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setViewMode('overview')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm transition-colors
              ${viewMode === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Übersicht</span>
            </div>
          </button>
          
          <button
            onClick={() => setViewMode('calendar')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm transition-colors
              ${viewMode === 'calendar'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4" />
              <span>Kalender</span>
            </div>
          </button>
          
          <button
            onClick={() => setViewMode('table')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm transition-colors
              ${viewMode === 'table'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <Grid3X3 className="h-4 w-4" />
              <span>Tabelle</span>
            </div>
          </button>
        </nav>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Noch keine Wochenberichte
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Erstellen Sie Ihren ersten Wochenbericht.
          </p>
          <div className="mt-6">
            <button
              onClick={createNewReport}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ersten Wochenbericht erstellen
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Overview View */}
          {viewMode === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                      <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamtstunden</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{Math.round(stats.totalHours * 10) / 10}h</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Gesamte Ausbildungszeit</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900">
                      <CalendarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Durchschnitt/Woche</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {Math.round(stats.avgHoursPerWeek * 10) / 10}h
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ø Stunden pro Woche</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Reports */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Letzte Wochenberichte
                  </h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.slice(0, 5).map((report) => (
                    <div key={report.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              KW {report.week_number}/{report.week_year}
                            </h4>
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
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => navigate(`/reports/${report.week_year}/${report.week_number}/view`)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Ansehen"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {report.status === 'draft' && (
                            <button
                              onClick={() => navigate(`/reports/${report.week_year}/${report.week_number}/edit`)}
                              className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Bearbeiten"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => exportReportWithTemplate(report)}
                            className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Als PDF mit Vorlage exportieren"
                          >
                            <FileDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <Calendar
              reports={reports}
              onDateClick={handleDateClick}
            />
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Kalenderwoche
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Zeitraum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Stunden
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Erstellt
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Aktionen</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          KW {report.week_number}/{report.week_year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {getWeekDateRange(report.week_year, report.week_number)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {Math.round(getTotalHours(report.dayHours) * 10) / 10}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(report.status)}
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                              {getStatusText(report.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(report.created_at), 'dd.MM.yyyy', { locale: de })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigate(`/reports/${report.week_year}/${report.week_number}/view`)}
                              className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
                              title="Ansehen"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {report.status === 'draft' && (
                              <button
                                onClick={() => navigate(`/reports/${report.week_year}/${report.week_number}/edit`)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                                title="Bearbeiten"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => exportReportWithTemplate(report)}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 transition-colors"
                              title="Als PDF mit Vorlage exportieren"
                            >
                              <FileDown className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;