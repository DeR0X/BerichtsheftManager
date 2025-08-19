import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Send, ArrowLeft, Plus, Trash2, Download } from 'lucide-react';
import { format, startOfWeek, addDays, getWeek, getYear } from 'date-fns';
import { de } from 'date-fns/locale';
import { db, Report, Activity, PredefinedActivity, DayHours } from '../../lib/localStorage';
import { useAuth } from '../../contexts/AuthContext';
import { generateReportPDF } from '../../utils/pdfGenerator';
import { generateReportFromWordTemplate, generatePDFFromWordTemplate } from '../../utils/docxGenerator';

interface DayActivity {
  id?: string;
  day_of_week: number;
  date: string;
  activity_text: string;
}

const ReportEditor: React.FC = () => {
  const { weekYear, weekNumber } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [activities, setActivities] = useState<DayActivity[]>([]);
  const [dayHours, setDayHours] = useState<DayHours[]>([]);
  const [predefinedActivities, setPredefinedActivities] = useState<PredefinedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentWeekYear = parseInt(weekYear || getYear(new Date()).toString());
  const currentWeekNumber = parseInt(weekNumber || getWeek(new Date()).toString());
  
  const weekStart = startOfWeek(new Date(currentWeekYear, 0, 1 + (currentWeekNumber - 1) * 7), { 
    weekStartsOn: 1 
  });

  useEffect(() => {
    loadData();
  }, [weekYear, weekNumber, user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load predefined activities
      const predefined = db.getPredefinedActivities();
      setPredefinedActivities(predefined);

      // Load or create report
      let existingReport = db.getReportByWeek(user.id, currentWeekYear, currentWeekNumber);

      if (!existingReport) {
        existingReport = db.createReport({
          user_id: user.id,
          week_year: currentWeekYear,
          week_number: currentWeekNumber,
          status: 'draft',
          submitted_at: null,
          approved_at: null,
          approved_by: null,
        });
      }

      setReport(existingReport);

      // Load activities
      const reportActivities = db.getActivitiesByReportId(existingReport.id);

      // Load day hours
      const reportDayHours = db.getDayHoursByReportId(existingReport.id);
      setDayHours(reportDayHours);

      if (reportActivities.length > 0) {
        setActivities(reportActivities.map(activity => ({
          id: activity.id,
          day_of_week: activity.day_of_week,
          date: activity.date,
          activity_text: activity.activity_text,
        })));
      } else {
        // Initialize empty activities for the week
        const weekActivities: DayActivity[] = [];
        for (let i = 1; i <= 7; i++) {
          const date = addDays(weekStart, i - 1);
          weekActivities.push({
            day_of_week: i,
            date: format(date, 'yyyy-MM-dd'),
            activity_text: '',
          });
        }
        setActivities(weekActivities);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addActivity = (dayOfWeek: number) => {
    const date = format(addDays(weekStart, dayOfWeek - 1), 'yyyy-MM-dd');
    const newActivity: DayActivity = {
      day_of_week: dayOfWeek,
      date,
      activity_text: '',
    };
    setActivities([...activities, newActivity]);
  };

  const updateActivity = (index: number, field: keyof DayActivity, value: string | number) => {
    const updatedActivities = [...activities];
    updatedActivities[index] = { ...updatedActivities[index], [field]: value };
    setActivities(updatedActivities);
  };

  const updateDayHours = (dayOfWeek: number, hours: number, minutes: number) => {
    if (!report) return;

    const existingDayHours = dayHours.find(dh => dh.day_of_week === dayOfWeek);
    const date = format(addDays(weekStart, dayOfWeek - 1), 'yyyy-MM-dd');

    if (existingDayHours) {
      const updated = db.updateDayHours(existingDayHours.id, { hours, minutes });
      if (updated) {
        setDayHours(dayHours.map(dh => dh.id === existingDayHours.id ? updated : dh));
      }
    } else {
      const newDayHours = db.createDayHours({
        report_id: report.id,
        day_of_week: dayOfWeek,
        date,
        hours,
        minutes,
      });
      setDayHours([...dayHours, newDayHours]);
    }
  };

  const getDayHoursForDay = (dayOfWeek: number) => {
    return dayHours.find(dh => dh.day_of_week === dayOfWeek) || { hours: 0, minutes: 0 };
  };

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const saveReport = async (submit = false) => {
    if (!report || !user) return;

    setSaving(true);
    
    try {
      // Update report status if submitting
      if (submit && report.status === 'draft') {
        const updatedReport = db.updateReport(report.id, {
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        });
        if (updatedReport) {
          setReport(updatedReport);
        }
      }

      // Save activities
      const activitiesToSave = activities.filter(activity => 
        activity.activity_text.trim() !== ''
      );

      // Delete existing activities
      db.deleteActivitiesByReportId(report.id);

      // Insert new activities
      activitiesToSave.forEach(activity => {
        db.createActivity({
          report_id: report.id,
          day_of_week: activity.day_of_week,
          date: activity.date,
          activity_text: activity.activity_text,
        });
      });

      if (submit) {
        navigate('/reports');
      }
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setSaving(false);
    }
  };

  const generatePDF = async () => {
    if (!report || !profile) return;
    
    try {
      // Verwende die Word-Vorlage für die PDF-Generierung
      const wordTemplateUrl = '/templates/wochenbericht_vorlage.docx';
      
      // PDF aus der Word-Vorlage generieren
      const pdfBuffer = await generatePDFFromWordTemplate(report, activities as Activity[], dayHours, profile, wordTemplateUrl);
      
      // PDF herunterladen
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Wochenbericht_KW${currentWeekNumber}_${currentWeekYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log('PDF erfolgreich aus Word-Vorlage generiert!');
      
    } catch (error) {
      console.error('Fehler beim Generieren der PDF aus Word-Vorlage:', error);
      
      // Fallback: Verwende den Standard-PDF-Generator
      console.log('Verwende Standard-PDF-Generator als Fallback...');
      
      const activitiesWithHours = activities.map(activity => {
        const dayHoursData = getDayHoursForDay(activity.day_of_week);
        return {
          ...activity,
          hours: dayHoursData.hours + (dayHoursData.minutes / 60),
        };
      });
      
      await generateReportPDF(report, activitiesWithHours, profile);
    }
  };

  const getDayActivities = (dayOfWeek: number) => {
    return activities.filter(activity => activity.day_of_week === dayOfWeek);
  };

  const getDayName = (dayOfWeek: number) => {
    const date = addDays(weekStart, dayOfWeek - 1);
    return format(date, 'EEEE', { locale: de });
  };

  const getDayDate = (dayOfWeek: number) => {
    const date = addDays(weekStart, dayOfWeek - 1);
    return format(date, 'dd.MM.yyyy');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/reports')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Wochenbericht KW {currentWeekNumber}/{currentWeekYear}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {format(weekStart, 'dd.MM.yyyy', { locale: de })} - {format(addDays(weekStart, 6), 'dd.MM.yyyy', { locale: de })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={generatePDF}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </button>
            
            <button
              onClick={() => saveReport(false)}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </button>
            
            {report?.status === 'draft' && (
              <button
                onClick={() => saveReport(true)}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                Einreichen
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map(dayOfWeek => {
          const dayActivities = getDayActivities(dayOfWeek);
          
          return (
            <div key={dayOfWeek} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Arbeitszeit:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                        value={getDayHoursForDay(dayOfWeek).hours || ''}
                        onChange={(e) => updateDayHours(dayOfWeek, parseInt(e.target.value) || 0, getDayHoursForDay(dayOfWeek).minutes)}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">h</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        step="15"
                        className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                        value={getDayHoursForDay(dayOfWeek).minutes || ''}
                        onChange={(e) => updateDayHours(dayOfWeek, getDayHoursForDay(dayOfWeek).hours, parseInt(e.target.value) || 0)}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">min</span>
                    </div>
                    <button
                      onClick={() => addActivity(dayOfWeek)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Aktivität hinzufügen
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {dayActivities.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Keine Aktivitäten für diesen Tag
                  </p>
                ) : (
                  dayActivities.map((activity, index) => {
                    const globalIndex = activities.findIndex(a => a === activity);
                    return (
                      <div key={globalIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-start space-x-4">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Tätigkeit
                            </label>
                            <select
                              className="block w-full mb-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateActivity(globalIndex, 'activity_text', e.target.value);
                                }
                              }}
                              value=""
                            >
                              <option value="">Vordefinierte Tätigkeit wählen...</option>
                              {predefinedActivities.map((predefined) => (
                                <option key={predefined.id} value={predefined.name}>
                                  {predefined.name} ({predefined.category})
                                </option>
                              ))}
                            </select>
                            <textarea
                              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                              rows={3}
                              placeholder="Beschreibung der Tätigkeit..."
                              value={activity.activity_text}
                              onChange={(e) => updateActivity(globalIndex, 'activity_text', e.target.value)}
                            />
                          </div>
                          
                          <div className="flex-shrink-0 pt-8">
                            <button
                              onClick={() => removeActivity(globalIndex)}
                              className="inline-flex items-center justify-center p-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900 dark:text-red-200 dark:border-red-600 dark:hover:bg-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportEditor;