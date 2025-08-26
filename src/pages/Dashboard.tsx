import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, FileText, TrendingUp, TestTube, Download, FileDown } from 'lucide-react';
import { getWeek, getYear } from 'date-fns';
import { db, Report, DayHours } from '../lib/localStorage';
import { useAuth } from '../contexts/AuthContext';
import { testWordTemplate } from '../utils/docxGenerator';
import ReportsPopup from '../components/Dashboard/ReportsPopup';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalReports: number;
  draftReports: number;
  submittedReports: number;
  approvedReports: number;
  totalHours: number;
  currentWeekStatus: 'draft' | 'submitted' | 'approved' | 'none';
}

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    draftReports: 0,
    submittedReports: 0,
    approvedReports: 0,
    totalHours: 0,
    currentWeekStatus: 'none',
  });
  const [loading, setLoading] = useState(true);
  const [testingTemplate, setTestingTemplate] = useState(false);
  const [showReportsPopup, setShowReportsPopup] = useState(false);
  const [popupReports, setPopupReports] = useState<any[]>([]);
  const [popupTitle, setPopupTitle] = useState('');

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      const currentWeek = getWeek(new Date());
      const currentYear = getYear(new Date());

      // Load reports
      const reports = db.getReportsByUserId(user.id);
      
      let totalHours = 0;
      reports.forEach(report => {
        const dayHours = db.getDayHoursByReportId(report.id);
        const reportHours = dayHours.reduce((sum, dh) => sum + dh.hours + (dh.minutes / 60), 0);
        totalHours += reportHours;
      });

      const currentWeekReport = reports.find(r => r.week_number === currentWeek && r.week_year === currentYear);

      setStats({
        totalReports: reports.length,
        draftReports: reports.filter(r => r.status === 'draft').length,
        submittedReports: reports.filter(r => r.status === 'submitted').length,
        approvedReports: reports.filter(r => r.status === 'approved').length,
        totalHours,
        currentWeekStatus: currentWeekReport?.status || 'none',
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'submitted':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      case 'draft':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
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
        return 'Nicht erstellt';
    }
  };

  const handleTestWordTemplate = async () => {
    setTestingTemplate(true);
    
    try {
      const templateUrl = '/templates/wochenbericht_vorlage.docx';
      console.log('Teste Word-Vorlage:', templateUrl);
      
      const result = await testWordTemplate(templateUrl);
      
      console.log('Test erfolgreich! Gefundene Parameter:', result.parameters);
      
      // DOCX herunterladen
      const docxBlob = new Blob([result.docxBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const docxUrl = URL.createObjectURL(docxBlob);
      
      const docxLink = document.createElement('a');
      docxLink.href = docxUrl;
      docxLink.download = 'Test_Word_Vorlage_Ausgefuellt.docx';
      document.body.appendChild(docxLink);
      docxLink.click();
      document.body.removeChild(docxLink);
      URL.revokeObjectURL(docxUrl);
      
      // PDF herunterladen
      const pdfBlob = new Blob([result.pdfBuffer], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const pdfLink = document.createElement('a');
      pdfLink.href = pdfUrl;
      pdfLink.download = 'Test_Word_Vorlage_Als_PDF.pdf';
      document.body.appendChild(pdfLink);
      pdfLink.click();
      document.body.removeChild(pdfLink);
      URL.revokeObjectURL(pdfUrl);
      
      alert(`Word-Vorlage erfolgreich getestet!\n\nGefundene Parameter: ${result.parameters.length}\n- ${result.parameters.join('\n- ')}\n\nDie ausgefüllte DOCX-Datei und PDF wurden heruntergeladen.`);
      
    } catch (error) {
      console.error('Fehler beim Testen der Word-Vorlage:', error);
      alert('Fehler beim Testen der Word-Vorlage. Bitte überprüfen Sie die Konsole für Details.');
    } finally {
      setTestingTemplate(false);
    }
  };

  const handleShowReports = (status: string) => {
    if (!user) return;
    
    const userReports = db.getReportsByUserId(user.id);
    const filteredReports = userReports.filter(r => r.status === status);
    
    const reportsWithActivities = filteredReports.map(report => ({
      ...report,
      activities: db.getActivitiesByReportId(report.id),
      dayHours: db.getDayHoursByReportId(report.id),
    }));
    
    setPopupReports(reportsWithActivities);
    setPopupTitle(`${getStatusText(status)} Wochenberichte`);
    setShowReportsPopup(true);
  };

  const handleViewReport = (year: number, week: number) => {
    navigate(`/reports/${year}/${week}/view`);
    setShowReportsPopup(false);
  };

  const handleEditReport = (year: number, week: number) => {
    navigate(`/reports/${year}/${week}/edit`);
    setShowReportsPopup(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {profile?.role === 'azubi' ? 'Mein Dashboard' : 'Ausbilder Dashboard'}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Übersicht über Ihre Ausbildungsnachweise
        </p>
      </div>

      {/* Current Week Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Aktuelle Woche (KW {getWeek(new Date())})
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Status Ihres aktuellen Wochenberichts
            </p>
          </div>
          <div className="flex items-center">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(stats.currentWeekStatus)}`}>
              {stats.currentWeekStatus === 'approved' && <CheckCircle className="h-4 w-4 mr-1" />}
              {stats.currentWeekStatus === 'submitted' && <Clock className="h-4 w-4 mr-1" />}
              {stats.currentWeekStatus === 'draft' && <FileText className="h-4 w-4 mr-1" />}
              {stats.currentWeekStatus === 'none' && <AlertCircle className="h-4 w-4 mr-1" />}
              {getStatusText(stats.currentWeekStatus)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="cursor-pointer transform hover:scale-105 transition-transform"
          onClick={() => handleShowReports('all')}
        >
          <StatCard
            title="Gesamt Berichte"
            value={stats.totalReports}
            icon={<FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
            color="bg-blue-100 dark:bg-blue-900"
          />
        </div>
        
        <div 
          className="cursor-pointer transform hover:scale-105 transition-transform"
          onClick={() => handleShowReports('draft')}
        >
          <StatCard
            title="Entwürfe"
            value={stats.draftReports}
            icon={<AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />}
            color="bg-yellow-100 dark:bg-yellow-900"
          />
        </div>
        
        <div 
          className="cursor-pointer transform hover:scale-105 transition-transform"
          onClick={() => handleShowReports('submitted')}
        >
          <StatCard
            title="Eingereicht"
            value={stats.submittedReports}
            icon={<Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
            color="bg-blue-100 dark:bg-blue-900"
          />
        </div>
        
        <div 
          className="cursor-pointer transform hover:scale-105 transition-transform"
          onClick={() => handleShowReports('approved')}
        >
          <StatCard
            title="Genehmigt"
            value={stats.approvedReports}
            icon={<CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />}
            color="bg-green-100 dark:bg-green-900"
          />
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamtstunden</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalHours}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900">
              <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Durchschnitt/Woche</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalReports > 0 ? Math.round(stats.totalHours / stats.totalReports * 10) / 10 : 0}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Schnellzugriff
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/reports')}
            className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">Neuer Bericht</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Wochenbericht erstellen</p>
          </button>
          
          <button 
            onClick={() => navigate('/calendar')}
            className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Calendar className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">Kalender</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Wochenübersicht anzeigen</p>
          </button>
          
          <button 
            onClick={() => navigate('/reports')}
            className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">Statistiken</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Fortschritt verfolgen</p>
          </button>
          
          <button 
            onClick={handleTestWordTemplate}
            disabled={testingTemplate}
            className="p-4 text-left border border-orange-200 dark:border-orange-600 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TestTube className="h-6 w-6 text-orange-600 dark:text-orange-400 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">
              {testingTemplate ? 'Teste...' : 'Word-Vorlage testen'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {testingTemplate ? 'Bitte warten...' : 'Parameter extrahieren & ausfüllen'}
            </p>
          </button>
        </div>
      </div>

      {/* Reports Popup */}
      <ReportsPopup
        isOpen={showReportsPopup}
        onClose={() => setShowReportsPopup(false)}
        reports={popupReports}
        title={popupTitle}
        onViewReport={handleViewReport}
        onEditReport={handleEditReport}
      />
    </div>
  );
};

export default Dashboard;