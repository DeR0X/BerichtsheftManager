import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWeek, getYear } from 'date-fns';
import { db, Report, Activity, DayHours } from '../lib/localStorage';
import { useAuth } from '../contexts/AuthContext';
import Calendar from '../components/Reports/Calendar';

type ReportWithActivities = Report & {
  activities: Activity[];
  dayHours: DayHours[];
};

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportWithActivities[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Kalender
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Monatsansicht Ihrer Wochenberichte
        </p>
      </div>

      {/* Calendar Component */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <Calendar
          reports={reports}
          onDateClick={handleDateClick}
        />
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Legende</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Genehmigt</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Eingereicht</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Entwurf</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Kein Bericht</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
