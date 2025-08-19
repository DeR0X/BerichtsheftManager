import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getWeek, getYear, startOfWeek, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Report, Activity, DayHours } from '../../lib/localStorage';

type ReportWithActivities = Report & {
  activities: Activity[];
  dayHours: DayHours[];
};

interface CalendarProps {
  reports: ReportWithActivities[];
  onDateClick: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ reports, onDateClick, onMonthChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = startOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  };

  const prevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  };

  const getReportsForDate = (date: Date) => {
    const weekNumber = getWeek(date, { weekStartsOn: 1 });
    const year = getYear(date);
    
    return reports.filter(report => 
      report.week_number === weekNumber && report.week_year === year
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'submitted':
        return <Clock className="h-3 w-3 text-blue-600" />;
      case 'draft':
        return <AlertCircle className="h-3 w-3 text-yellow-600" />;
      default:
        return <AlertCircle className="h-3 w-3 text-gray-400" />;
    }
  };

  const getTotalHours = (dayHours: DayHours[]) => {
    return dayHours.reduce((sum, dh) => sum + dh.hours + (dh.minutes / 60), 0);
  };

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(currentDate, 'MMMM yyyy', { locale: de })}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={prevMonth}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                onMonthChange?.(today);
              }}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
            >
              Heute
            </button>
            
            <button
              onClick={nextMonth}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const dayReports = getReportsForDate(day);
            const hasReports = dayReports.length > 0;
            
            return (
              <div
                key={index}
                className={`
                  min-h-[80px] p-2 border border-gray-100 dark:border-gray-600 rounded-lg cursor-pointer transition-colors
                  ${isCurrentMonth 
                    ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' 
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500'
                  }
                  ${isToday ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                `}
                onClick={() => onDateClick(day)}
              >
                <div className="text-right">
                  <span className={`
                    text-sm font-medium
                    ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}
                    ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                {/* Reports indicators */}
                {hasReports && (
                  <div className="mt-1 space-y-1">
                    {dayReports.slice(0, 2).map((report, reportIndex) => (
                      <div
                        key={report.id}
                        className="flex items-center space-x-1 p-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs"
                      >
                        {getStatusIcon(report.status)}
                        <span className="text-blue-700 dark:text-blue-300 font-medium">
                          KW {report.week_number}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {Math.round(getTotalHours(report.dayHours) * 10) / 10}h
                        </span>
                      </div>
                    ))}
                    {dayReports.length > 2 && (
                      <div className="text-center text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded px-1 py-0.5">
                        +{dayReports.length - 2} weitere
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-gray-600 dark:text-gray-400">Genehmigt</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-gray-600 dark:text-gray-400">Eingereicht</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-gray-600 dark:text-gray-400">Entwurf</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
