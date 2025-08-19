import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, FileText, TrendingUp, BarChart3, List, CalendarDays } from 'lucide-react';
import { getWeek, getYear } from 'date-fns';
import { db, Report, DayHours } from '../lib/localStorage';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReportsPopup from '../components/Dashboard/ReportsPopup';

interface DashboardStats {
  totalReports: number;
  draftReports: number;
  submittedReports: number;
  approvedReports: number;
  totalHours: number;
  currentWeekStatus: 'draft' | 'submitted' | 'approved' | 'none' | 'rejected';
}

type PopupType = 'total' | 'draft' | 'submitted' | 'approved' | null;

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
  const [reports, setReports] = useState<any[]>([]);
  const [popupType, setPopupType] = useState<PopupType>(null);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      const currentWeek = getWeek(new Date());
      const currentYear = getYear(new Date());

      // Load reports
      const userReports = db.getReportsByUserId(user.id);
      const reportsWithActivities = userReports.map(report => ({
        ...report,
        activities: db.getActivitiesByReportId(report.id),
        dayHours: db.getDayHoursByReportId(report.id),
      }));
      
      setReports(reportsWithActivities);
      
      let totalHours = 0;
      userReports.forEach(report => {
        const dayHours = db.getDayHoursByReportId(report.id);
        const reportHours = dayHours.reduce((sum, dh) => sum + dh.hours + (dh.minutes / 60), 0);
        totalHours += reportHours;
      });

      const currentWeekReport = userReports.find(r => r.week_number === currentWeek && r.week_year === currentYear);

      setStats({
        totalReports: userReports.length,
        draftReports: userReports.filter(r => r.status === 'draft').length,
        submittedReports: userReports.filter(r => r.status === 'submitted').length,
        approvedReports: userReports.filter(r => r.status === 'approved').length,
        totalHours,
        currentWeekStatus: currentWeekReport?.status || 'none',
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPopup = (type: PopupType) => {
    setPopupType(type);
  };

  const closePopup = () => {
    setPopupType(null);
  };

  const getFilteredReports = () => {
    switch (popupType) {
      case 'draft':
        return reports.filter(r => r.status === 'draft');
      case 'submitted':
        return reports.filter(r => r.status === 'submitted');
      case 'approved':
        return reports.filter(r => r.status === 'approved');
      case 'total':
      default:
        return reports;
    }
  };

  const getPopupTitle = () => {
    switch (popupType) {
      case 'total':
        return 'Wochenberichte - Alle Berichte';
      case 'draft':
        return 'Entwürfe - Bearbeitung erforderlich';
      case 'submitted':
        return 'Eingereichte Berichte - Warten auf Genehmigung';
      case 'approved':
        return 'Genehmigte Berichte - Abgeschlossen';
      default:
        return '';
    }
  };

  const handleViewReport = (year: number, week: number) => {
    navigate(`/reports/${year}/${week}/view`);
    closePopup();
  };

  const handleEditReport = (year: number, week: number) => {
    navigate(`/reports/${year}/${week}/edit`);
    closePopup();
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
    description?: string;
    variant?: 'default' | 'highlight' | 'info';
  }> = ({ title, value, icon, color, onClick, description, variant = 'default' }) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'highlight':
          return 'ring-2 ring-blue-500 ring-opacity-50 shadow-lg';
        case 'info':
          return 'border-dashed border-2 border-gray-300 dark:border-gray-600';
        default:
          return '';
      }
    };

    return (
      <div 
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''} ${getVariantStyles()}`}
        onClick={onClick}
      >
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${color}`}>
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

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
          Übersicht über Ihre Ausbildungsnachweise und Fortschritt
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

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Wochenberichte"
          value={stats.totalReports}
          icon={<FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
          color="bg-blue-100 dark:bg-blue-900"
          onClick={() => openPopup('total')}
          description="Alle Wochenberichte anzeigen"
          variant="highlight"
        />
        
        <StatCard
          title="Entwürfe"
          value={stats.draftReports}
          icon={<AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />}
          color="bg-yellow-100 dark:bg-yellow-900"
          onClick={() => openPopup('draft')}
          description="Noch zu bearbeiten"
        />
        
        <StatCard
          title="Eingereicht"
          value={stats.submittedReports}
          icon={<Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
          color="bg-blue-100 dark:bg-blue-900"
          onClick={() => openPopup('submitted')}
          description="Warten auf Genehmigung"
        />
        
        <StatCard
          title="Genehmigt"
          value={stats.approvedReports}
          icon={<CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />}
          color="bg-green-100 dark:bg-green-900"
          onClick={() => openPopup('approved')}
          description="Abgeschlossen"
        />
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Gesamte Ausbildungszeit</p>
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ø Stunden pro Woche</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Schnellzugriff
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <button 
            onClick={() => navigate('/reports')}
            className="p-6 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group hover:shadow-md"
          >
            <CalendarDays className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Wochenberichte</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kalender, Übersicht und Verwaltung Ihrer Ausbildungsnachweise</p>
          </button>
          
          <button 
            onClick={() => openPopup('total')}
            className="p-6 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group hover:shadow-md"
          >
            <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Statistiken</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Detaillierte Übersicht und Fortschrittsverfolgung</p>
          </button>
        </div>
      </div>

      {/* Reports Popup */}
      <ReportsPopup
        isOpen={popupType !== null}
        onClose={closePopup}
        reports={getFilteredReports()}
        title={getPopupTitle()}
        onViewReport={handleViewReport}
        onEditReport={handleEditReport}
      />
    </div>
  );
};

export default Dashboard;