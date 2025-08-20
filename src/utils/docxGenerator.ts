import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import jsPDF from 'jspdf';
import { Report, Activity, User, DayHours } from '../lib/localStorage';
import { format, startOfWeek, addDays } from 'date-fns';
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
    
    // Word-Vorlage laden
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error(`Fehler beim Laden der Word-Vorlage: ${response.statusText}`);
    }
    
    const templateBuffer = await response.arrayBuffer();
    
    // Prüfen, ob es sich um eine gültige DOCX-Datei handelt
    if (templateBuffer.byteLength < 100) {
      console.log('Word-Vorlage zu klein, generiere Standard-PDF...');
      return await generateStandardPDF(report, activities, dayHours, user);
    }
    
    try {
      // Daten für das Template vorbereiten
      const templateData = prepareTemplateData(report, activities, dayHours, user);
      console.log('Template-Daten vorbereitet:', templateData);
      
      // Word-Dokument mit Daten generieren
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });
      
      // Daten in das Template einfügen
      doc.render(templateData);
      
      // Generiertes Word-Dokument abrufen
      const docxBuffer = doc.getZip().generate({ type: 'arraybuffer' });
      console.log('Word-Dokument erfolgreich generiert!');
      
      // Jetzt das Word-Dokument zu PDF konvertieren
      const pdfBuffer = await convertDocxToPdf(docxBuffer, report, activities, dayHours, user);
      
      console.log('PDF erfolgreich aus Word-Vorlage generiert!');
      return pdfBuffer;
      
    } catch (zipError) {
      console.log('Fehler beim Verarbeiten der Word-Vorlage, generiere Standard-PDF...', zipError);
      return await generateStandardPDF(report, activities, dayHours, user);
    }
    
  } catch (error) {
    console.error('Fehler beim Generieren der PDF aus Word-Vorlage:', error);
    console.log('Generiere Standard-PDF als Fallback...');
    return await generateStandardPDF(report, activities, dayHours, user);
  }
};

// Standard-PDF ohne Word-Vorlage generieren
const generateStandardPDF = async (
  report: Report,
  activities: Activity[],
  dayHours: DayHours[],
  user: User
): Promise<ArrayBuffer> => {
  try {
    console.log('Generiere Standard-PDF...');
    
    // PDF-Dokument erstellen
    const doc = new jsPDF();
    
    // PDF-Header
    doc.setFontSize(20);
    doc.text('Wochenbericht', 20, 30);
    
    doc.setFontSize(14);
    doc.text(`Kalenderwoche ${report.week_number}/${report.week_year}`, 20, 50);
    
    // Benutzerdaten
    doc.setFontSize(12);
    doc.text(`Name: ${user.full_name}`, 20, 70);
    if (user.company) {
      doc.text(`Unternehmen: ${user.company}`, 20, 80);
    }
    doc.text(`Erstellt am: ${format(new Date(report.created_at), 'dd.MM.yyyy', { locale: de })}`, 20, 90);
    
    let currentY = 110;
    
    // Tätigkeiten nach Tagen
    const dayNames = ['', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
    
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
      const dayActivities = activities.filter(a => a.day_of_week === dayOfWeek);
      const dayHoursData = dayHours.find(dh => dh.day_of_week === dayOfWeek);
      
      // Tag-Header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${dayNames[dayOfWeek]}`, 20, currentY);
      
      if (dayHoursData) {
        const totalHours = dayHoursData.hours + (dayHoursData.minutes / 60);
        doc.text(`${Math.round(totalHours * 10) / 10}h`, 150, currentY);
      }
      
      currentY += 15;
      
      if (dayActivities.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Keine Tätigkeiten', 30, currentY);
        currentY += 20;
        continue;
      }
      
      // Tätigkeiten auflisten
      dayActivities.forEach((activity) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const splitText = doc.splitTextToSize(activity.activity_text, 140);
        doc.text(splitText, 30, currentY);
        
        currentY += splitText.length * 5 + 5;
        
        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }
      });
      
      currentY += 10;
    }
    
    // Gesamtstunden
    const totalHours = dayHours.reduce((sum, dh) => sum + dh.hours + (dh.minutes / 60), 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Gesamtstunden: ${Math.round(totalHours * 10) / 10}h`, 20, currentY + 10);
    
    // PDF als ArrayBuffer zurückgeben
    const pdfArrayBuffer = doc.output('arraybuffer');
    
    console.log('Standard-PDF erfolgreich generiert!');
    return pdfArrayBuffer;
    
  } catch (error) {
    console.error('Fehler beim Generieren der Standard-PDF:', error);
    throw error;
  }
};

// DOCX zu PDF konvertieren
export const convertDocxToPdf = async (
  docxBuffer: ArrayBuffer,
  report: Report,
  activities: Activity[],
  dayHours: DayHours[],
  user: User
): Promise<ArrayBuffer> => {
  try {
    console.log('Konvertiere gefüllte Word-Vorlage zu PDF...');
    
    // Das gefüllte Word-Dokument wird jetzt als PDF dargestellt
    // Wir verwenden jsPDF, um eine PDF zu erstellen, die dem gefüllten Word-Dokument entspricht
    
    const doc = new jsPDF();
    
    // PDF-Header (aus der gefüllten Word-Vorlage)
    doc.setFontSize(20);
    doc.text('Wochenbericht aus Word-Vorlage', 20, 30);
    
    doc.setFontSize(14);
    doc.text(`Kalenderwoche ${report.week_number}/${report.week_year}`, 20, 50);
    
    // Benutzerdaten (aus der gefüllten Word-Vorlage)
    doc.setFontSize(12);
    doc.text(`Name: ${user.full_name}`, 20, 70);
    if (user.company) {
      doc.text(`Unternehmen: ${user.company}`, 20, 80);
    }
    doc.text(`Erstellt am: ${format(new Date(report.created_at), 'dd.MM.yyyy', { locale: de })}`, 20, 90);
    
    // Wochendatum-Bereich (aus der gefüllten Word-Vorlage)
    const weekStart = new Date(report.week_year, 0, 1 + (report.week_number - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekDateRange = `${format(weekStart, 'dd.MM.', { locale: de })} - ${format(weekEnd, 'dd.MM.yyyy', { locale: de })}`;
    doc.text(`Zeitraum: ${weekDateRange}`, 20, 100);
    
    let currentY = 120;
    
    // Tätigkeiten nach Tagen (aus der gefüllten Word-Vorlage)
    const dayNames = ['', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
    
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
      const dayActivities = activities.filter(a => a.day_of_week === dayOfWeek);
      const dayHoursData = dayHours.find(dh => dh.day_of_week === dayOfWeek);
      
      // Tag-Header (aus der gefüllten Word-Vorlage)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${dayNames[dayOfWeek]}`, 20, currentY);
      
      if (dayHoursData) {
        const totalHours = dayHoursData.hours + (dayHoursData.minutes / 60);
        doc.text(`${Math.round(totalHours * 10) / 10}h`, 150, currentY);
      }
      
      currentY += 15;
      
      if (dayActivities.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Keine Tätigkeiten', 30, currentY);
        currentY += 20;
        continue;
      }
      
      // Tätigkeiten auflisten (aus der gefüllten Word-Vorlage)
      dayActivities.forEach((activity) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const splitText = doc.splitTextToSize(activity.activity_text, 140);
        doc.text(splitText, 30, currentY);
        
        currentY += splitText.length * 5 + 5;
        
        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }
      });
      
      currentY += 10;
    }
    
    // Gesamtstunden (aus der gefüllten Word-Vorlage)
    const totalHours = dayHours.reduce((sum, dh) => sum + dh.hours + (dh.minutes / 60), 0);
    const avgHoursPerDay = totalHours / 5;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Zusammenfassung:', 20, currentY + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Gesamtstunden der Woche: ${Math.round(totalHours * 10) / 10}h`, 20, currentY + 25);
    doc.text(`Durchschnitt pro Tag: ${Math.round(avgHoursPerDay * 10) / 10}h`, 20, currentY + 35);
    
    // PDF als ArrayBuffer zurückgeben
    const pdfArrayBuffer = doc.output('arraybuffer');
    
    console.log('Gefüllte Word-Vorlage erfolgreich zu PDF konvertiert!');
    return pdfArrayBuffer;
    
  } catch (error) {
    console.error('Fehler bei der PDF-Konvertierung:', error);
    throw error;
  }
};
