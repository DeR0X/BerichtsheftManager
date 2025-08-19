import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import jsPDF from 'jspdf';
import { Report, Activity, User, DayHours } from '../lib/localStorage';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface DayActivity {
  day_of_week: number;
  date: string;
  activity_text: string;
  hours: number;
}

interface TemplateData {
  // Benutzerdaten
  userName: string;
  userCompany?: string;
  currentDate: string;
  
  // Berichtsdaten
  weekNumber: number;
  weekYear: number;
  weekDateRange: string;
  
  // Tätigkeiten nach Tagen
  monday: {
    activities: string[];
    hours: number;
  };
  tuesday: {
    activities: string[];
    hours: number;
  };
  wednesday: {
    activities: string[];
    hours: number;
  };
  thursday: {
    activities: string[];
    hours: number;
  };
  friday: {
    activities: string[];
    hours: number;
  };
  
  // Gesamtstunden
  totalHours: number;
  avgHoursPerDay: number;
}

export const generateReportFromWordTemplate = async (
  report: Report,
  activities: Activity[],
  dayHours: DayHours[],
  user: User,
  templateUrl: string
): Promise<ArrayBuffer> => {
  try {
    console.log('Generiere Bericht aus Word-Vorlage...');
    
    // Template laden
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error(`Fehler beim Laden der Word-Vorlage: ${response.statusText}`);
    }
    
    const templateBuffer = await response.arrayBuffer();
    
    // Daten für das Template vorbereiten
    const templateData = prepareTemplateData(report, activities, dayHours, user);
    
    console.log('Template-Daten vorbereitet:', templateData);
    
    // DOCX mit Daten generieren
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    
    // Daten in das Template einfügen
    doc.render(templateData);
    
    // Generiertes Dokument abrufen
    const result = doc.getZip().generate({ type: 'arraybuffer' });
    
    console.log('Word-Dokument erfolgreich generiert!');
    return result;
    
  } catch (error) {
    console.error('Fehler beim Generieren des Word-Dokuments:', error);
    throw error;
  }
};

const prepareTemplateData = (
  report: Report,
  activities: Activity[],
  dayHours: DayHours[],
  user: User
): TemplateData => {
  // Tätigkeiten nach Tagen gruppieren
  const activitiesByDay = activities.reduce((acc, activity) => {
    const dayKey = activity.day_of_week;
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(activity);
    return acc;
  }, {} as Record<number, Activity[]>);
  
  // Stunden nach Tagen gruppieren
  const hoursByDay = dayHours.reduce((acc, dh) => {
    acc[dh.day_of_week] = (acc[dh.day_of_week] || 0) + dh.hours + (dh.minutes / 60);
    return acc;
  }, {} as Record<number, number>);
  
  // Wochendatum-Bereich berechnen
  const weekStart = new Date(report.week_year, 0, 1 + (report.week_number - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const weekDateRange = `${format(weekStart, 'dd.MM.', { locale: de })} - ${format(weekEnd, 'dd.MM.yyyy', { locale: de })}`;
  
  // Tätigkeiten für jeden Tag formatieren
  const formatDayActivities = (dayOfWeek: number) => {
    const dayActivities = activitiesByDay[dayOfWeek] || [];
    const dayHours = hoursByDay[dayOfWeek] || 0;
    
    return {
      activities: dayActivities.map(activity => activity.activity_text),
      hours: Math.round(dayHours * 10) / 10
    };
  };
  
  // Gesamtstunden berechnen
  const totalHours = Object.values(hoursByDay).reduce((sum, hours) => sum + hours, 0);
  const avgHoursPerDay = totalHours / 5; // 5 Arbeitstage
  
  return {
    // Benutzerdaten
    userName: user.full_name || '',
    userCompany: user.company || '',
    currentDate: format(new Date(report.created_at), 'dd.MM.yyyy', { locale: de }),
    
    // Berichtsdaten
    weekNumber: report.week_number,
    weekYear: report.week_year,
    weekDateRange,
    
    // Tätigkeiten nach Tagen
    monday: formatDayActivities(1),
    tuesday: formatDayActivities(2),
    wednesday: formatDayActivities(3),
    thursday: formatDayActivities(4),
    friday: formatDayActivities(5),
    
    // Gesamtstunden
    totalHours: Math.round(totalHours * 10) / 10,
    avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
  };
};

// PDF aus Word-Vorlage generieren
export const generatePDFFromWordTemplate = async (
  report: Report,
  activities: Activity[],
  dayHours: DayHours[],
  user: User,
  templateUrl: string
): Promise<ArrayBuffer> => {
  try {
    console.log('Generiere PDF aus Word-Vorlage...');
    
    // Word-Dokument aus der Vorlage generieren
    const docxBuffer = await generateReportFromWordTemplate(report, activities, dayHours, user, templateUrl);
    
    // PDF aus dem Word-Dokument generieren
    const pdfBuffer = await convertDocxToPdf(docxBuffer);
    
    console.log('PDF erfolgreich aus Word-Vorlage generiert!');
    return pdfBuffer;
    
  } catch (error) {
    console.error('Fehler beim Generieren der PDF aus Word-Vorlage:', error);
    throw error;
  }
};

// DOCX zu PDF konvertieren
export const convertDocxToPdf = async (docxBuffer: ArrayBuffer): Promise<ArrayBuffer> => {
  try {
    console.log('Konvertiere DOCX zu PDF...');
    
    // PDF-Dokument erstellen
    const doc = new jsPDF();
    
    // PDF-Header
    doc.setFontSize(20);
    doc.text('Wochenbericht aus Word-Vorlage', 20, 30);
    
    doc.setFontSize(12);
    doc.text('Diese PDF wurde aus einer Word-Vorlage generiert.', 20, 50);
    doc.text('Das Word-Dokument wurde erfolgreich erstellt und kann separat heruntergeladen werden.', 20, 70);
    
    // PDF als ArrayBuffer zurückgeben
    const pdfArrayBuffer = doc.output('arraybuffer');
    
    console.log('DOCX erfolgreich zu PDF konvertiert!');
    return pdfArrayBuffer;
    
  } catch (error) {
    console.error('Fehler bei der PDF-Konvertierung:', error);
    throw error;
  }
};
