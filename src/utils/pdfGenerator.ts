import jsPDF from 'jspdf';
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown, PDFOptionList } from 'pdf-lib';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { Report, Activity, User, DayHours } from '../lib/localStorage';
import { generateReportFromWordTemplate } from './docxGenerator';
import pdfMake from 'pdfmake/build/pdfmake';

// pdfmake Fonts dynamisch laden
let pdfFontsLoaded = false;

const loadPdfFonts = async () => {
  if (pdfFontsLoaded) return;
  
  try {
    // Fonts komplett deaktivieren um Roboto-Fehler zu vermeiden
    (pdfMake as any).vfs = {};
    pdfFontsLoaded = true;
    console.log('pdfmake Fonts deaktiviert - verwende Standard-Fonts');
  } catch (error) {
    console.error('Fehler beim Laden der pdfmake Fonts:', error);
    // Fallback: Verwende Standard-Fonts
    (pdfMake as any).vfs = {};
  }
};

interface DayActivity {
  day_of_week: number;
  date: string;
  activity_text: string;
  hours: number;
}

export interface PDFTemplate {
  name: string;
  url: string;
  description: string;
  type: 'pdf' | 'docx';
}

// Verfügbare PDF-Vorlagen
export const availableTemplates: PDFTemplate[] = [
  {
    name: 'Berichtsheft Vorlage (Text)',
    url: '/templates/berichtsheft_vorlage.txt',
    description: 'Umfassende Berichtsheft-Vorlage mit allen wichtigen Feldern',
    type: 'docx'
  },
  {
    name: 'Berichtsheft Vorlage (Mehrere Tätigkeiten)',
    url: '/templates/berichtsheft_vorlage_mehrere_taetigkeiten.pdf',
    description: 'Professionelle Vorlage für Wochenberichte mit mehreren Tätigkeiten pro Tag',
    type: 'pdf'
  },
  {
    name: 'Standard Wochenbericht',
    url: '/templates/standard-wochenbericht.pdf',
    description: 'Standard-Vorlage für Wochenberichte',
    type: 'pdf'
  },
  {
    name: 'Detaillierter Wochenbericht',
    url: '/templates/detaillierter-wochenbericht.pdf',
    description: 'Erweiterte Vorlage mit mehr Details',
    type: 'pdf'
  }
];

// PDF mit Vorlage generieren
export const generateReportWithTemplate = async (
  report: Report,
  activities: Activity[],
  dayHours: DayHours[],
  user: User,
  templateUrl: string
) => {
  try {
    console.log(`Verwende Vorlage: ${templateUrl}`);
    
    // Prüfen, ob es sich um eine Word-Vorlage handelt
    if (templateUrl.endsWith('.docx')) {
      console.log('Verarbeite Word-Vorlage...');
      
      // Word-Dokument generieren
      const docxBuffer = await generateReportFromWordTemplate(report, activities, dayHours, user, templateUrl);
      
      // DOCX herunterladen (als Alternative zur PDF)
      const blob = new Blob([docxBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Wochenbericht_KW${report.week_number}_${report.week_year}_Word_Vorlage.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log('Word-Dokument erfolgreich aus Vorlage generiert!');
      return true;
    }
    
    // PDF-Vorlage verarbeiten (bestehende Funktionalität)
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error(`Fehler beim Laden der Vorlage: ${response.statusText}`);
    }
    
    const templateBytes = await response.arrayBuffer();
    
    // PDF-Dokument öffnen
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    
    // Verfügbare Formularfelder finden
    const fields = form.getFields();
    console.log('Verfügbare Formularfelder:', fields.map(f => f.getName()));
    
    // Daten in die Vorlage einfügen
    try {
      // Versuche, Standard-Felder zu füllen
      const fillStandardFields = () => {
        // Name des Auszubildenden
        try {
          const nameField = form.getTextField('name') || form.getTextField('full_name') || form.getTextField('azubi_name');
          if (nameField) {
            nameField.setText(user.full_name || '');
          }
        } catch (e) {
          console.log('Name-Feld nicht gefunden');
        }
        
        // Unternehmen
        try {
          const companyField = form.getTextField('company') || form.getTextField('unternehmen') || form.getTextField('firma');
          if (companyField && user.company) {
            companyField.setText(user.company);
          }
        } catch (e) {
          console.log('Unternehmen-Feld nicht gefunden');
        }
        
        // Kalenderwoche
        try {
          const weekField = form.getTextField('week') || form.getTextField('kalenderwoche') || form.getTextField('kw');
          if (weekField) {
            weekField.setText(`KW ${report.week_number}/${report.week_year}`);
          }
        } catch (e) {
          console.log('Kalenderwoche-Feld nicht gefunden');
        }
        
        // Datum
        try {
          const dateField = form.getTextField('date') || form.getTextField('datum') || form.getTextField('erstellt_am');
          if (dateField) {
            dateField.setText(format(new Date(report.created_at), 'dd.MM.yyyy', { locale: de }));
          }
        } catch (e) {
          console.log('Datum-Feld nicht gefunden');
        }
      };
      
      fillStandardFields();
      
      // Tätigkeiten nach Tagen gruppieren
      const activitiesByDay = activities.reduce((acc, activity) => {
        const dayKey = activity.day_of_week;
        if (!acc[dayKey]) {
          acc[dayKey] = [];
        }
        acc[dayKey].push(activity);
        return acc;
      }, {} as Record<number, Activity[]>);
      
      // Tätigkeiten in die entsprechenden Felder eintragen
      const dayNames = ['', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
      
      for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
        const dayActivities = activitiesByDay[dayOfWeek] || [];
        const dayName = dayNames[dayOfWeek];
        
        if (dayActivities.length > 0) {
          // Erste Tätigkeit in das Hauptfeld eintragen
          try {
            const mainField = form.getTextField(`${dayName}_taetigkeit`) || form.getTextField(`${dayName}_haupttaetigkeit`);
            if (mainField) {
              mainField.setText(dayActivities[0].activity_text);
            }
          } catch (e) {
            console.log(`${dayName} Haupttätigkeit-Feld nicht gefunden`);
          }
          
          // Weitere Tätigkeiten in separate Felder eintragen
          for (let i = 1; i < dayActivities.length; i++) {
            try {
              const additionalField = form.getTextField(`${dayName}_taetigkeit_${i + 1}`) || form.getTextField(`${dayName}_zusaetzlich_${i + 1}`);
              if (additionalField) {
                additionalField.setText(dayActivities[i].activity_text);
              }
            } catch (e) {
              console.log(`${dayName} Zusatztätigkeit ${i + 1}-Feld nicht gefunden`);
            }
          }
          
          // Stunden eintragen
          try {
            const hoursField = form.getTextField(`${dayName}_stunden`) || form.getTextField(`${dayName}_zeit`);
            if (hoursField) {
              // Stunden aus dayHours extrahieren
              const dayHoursData = dayHours.find(dh => dh.day_of_week === dayOfWeek);
              const totalHours = dayHoursData ? dayHoursData.hours + (dayHoursData.minutes / 60) : 0;
              hoursField.setText(`${Math.round(totalHours * 10) / 10}h`);
            }
          } catch (e) {
            console.log(`${dayName} Stunden-Feld nicht gefunden`);
          }
        }
      }
      
      // Gesamtstunden
      try {
        const totalHoursField = form.getTextField('gesamtstunden') || form.getTextField('total_hours') || form.getTextField('wochenstunden');
        if (totalHoursField) {
          const totalHours = dayHours.reduce((sum, dh) => sum + dh.hours + (dh.minutes / 60), 0);
          totalHoursField.setText(`${Math.round(totalHours * 10) / 10}h`);
        }
      } catch (e) {
        console.log('Gesamtstunden-Feld nicht gefunden');
      }
      
    } catch (fieldError) {
      console.log('Fehler beim Ausfüllen der Felder:', fieldError);
    }
    
    // PDF generieren und herunterladen
    const modifiedPdfBytes = await pdfDoc.save();
    const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Download starten
    const link = document.createElement('a');
    link.href = url;
    link.download = `Wochenbericht_KW${report.week_number}_${report.week_year}_mit_Vorlage.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // URL freigeben
    URL.revokeObjectURL(url);
    
    console.log('PDF erfolgreich mit Vorlage generiert!');
    return true;
    
  } catch (error) {
    console.error('Fehler beim Laden der Vorlage:', error);
    console.log('Verwende Standard-Generator als Fallback');
    
    // Fallback: Verwende den bestehenden Generator
    return await generateReportPDF(report, activities as any, user);
  }
};

// PDF mit ausgewählter Vorlage generieren
export const generateReportWithSelectedTemplate = async (
  report: Report,
  activities: Activity[],
  dayHours: DayHours[],
  user: User,
  selectedTemplate: string | null
) => {
  if (selectedTemplate) {
    return await generateReportWithTemplate(report, activities, dayHours, user, selectedTemplate);
  } else {
    return await generateReportPDF(report, activities as any, user);
  }
};

// PDF ohne Vorlage generieren (bestehende Funktionalität)
export const generateReportPDF = async (
  report: Report,
  activities: DayActivity[],
  user: User
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Ausbildungsnachweis', 20, 30);
  
  doc.setFontSize(12);
  doc.text(`Kalenderwoche ${report.week_number}/${report.week_year}`, 20, 45);
  
  // User information
  doc.setFontSize(10);
  doc.text(`Auszubildende/r: ${user.full_name}`, 20, 60);
  if (user.company) {
    doc.text(`Unternehmen: ${user.company}`, 20, 70);
  }
  doc.text(`Erstellt am: ${format(new Date(report.created_at), 'dd.MM.yyyy', { locale: de })}`, 20, 80);
  
  let currentY = 100;
  
  // Group activities by day
  const activitiesByDay = activities.reduce((acc, activity) => {
    const dayKey = activity.day_of_week;
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(activity);
    return acc;
  }, {} as Record<number, DayActivity[]>);
  
  // Days of the week
  const dayNames = ['', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  
  for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
    const dayActivities = activitiesByDay[dayOfWeek] || [];
    
    // Day header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dayNames[dayOfWeek]}`, 20, currentY);
    
    if (dayActivities.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Keine Tätigkeiten', 30, currentY + 10);
      currentY += 25;
      continue;
    }
    
    currentY += 15;
    
    dayActivities.forEach((activity) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Activity text (wrap text if too long)
      const splitText = doc.splitTextToSize(activity.activity_text, 140);
      doc.text(splitText, 30, currentY);
      
      // Hours
      doc.text(`${activity.hours}h`, 175, currentY);
      
      currentY += splitText.length * 5 + 5;
      
      // Check if we need a new page
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
    });
    
    currentY += 10;
  }
  
  // Total hours
  const totalHours = activities.reduce((sum, activity) => sum + activity.hours, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`Gesamtstunden: ${totalHours}h`, 20, currentY + 10);
  
  // Save the PDF
  doc.save(`Wochenbericht_KW${report.week_number}_${report.week_year}.pdf`);
};

export const generateCombinedPDF = async (
  reports: (Report & { activities: Activity[]; dayHours: DayHours[] })[],
  user: User
) => {
  const doc = new jsPDF();
  
  // Title page
  doc.setFontSize(24);
  doc.text('Ausbildungsnachweise222', 20, 40);
  
  doc.setFontSize(14);
  doc.text(`${user.full_name}`, 20, 60);
  if (user.company) {
    doc.text(`${user.company}`, 20, 75);
  }
  doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`, 20, 90);
  
  // Overview table
  doc.setFontSize(12);
  doc.text('Übersicht der Wochenberichte:', 20, 120);
  
  let currentY = 135;
  reports.forEach((report) => {
    const totalHours = report.dayHours.reduce((sum, dh) => sum + dh.hours + (dh.minutes / 60), 0);
    doc.setFontSize(10);
    doc.text(`KW ${report.week_number}/${report.week_year}`, 20, currentY);
    doc.text(`${Math.round(totalHours * 10) / 10}h`, 100, currentY);
    doc.text(report.status === 'approved' ? 'Genehmigt' : report.status, 130, currentY);
    currentY += 10;
  });
  
  // Individual reports
  reports.forEach((report, index) => {
    doc.addPage();
    
    // Use the same logic as single report generation
    doc.setFontSize(20);
    doc.text('Ausbildungsnachweis', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Kalenderwoche ${report.week_number}/${report.week_year}`, 20, 45);
    
    doc.setFontSize(10);
    doc.text(`Auszubildende/r: ${user.full_name}`, 20, 60);
    if (user.company) {
      doc.text(`Unternehmen: ${user.company}`, 20, 70);
    }
    
    currentY = 100;
    
    // Activities by day
    const activitiesByDay = report.activities.reduce((acc: Record<number, Activity[]>, activity) => {
      const dayKey = activity.day_of_week;
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(activity);
      return acc;
    }, {});

    const dayHoursByDay = report.dayHours.reduce((acc: Record<number, DayHours>, dh) => {
      acc[dh.day_of_week] = dh;
      return acc;
    }, {});
    
    const dayNames = ['', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
      const dayActivities = activitiesByDay[dayOfWeek] || [];
      const dayHours = dayHoursByDay[dayOfWeek];
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${dayNames[dayOfWeek]}`, 20, currentY);
      
      if (dayHours) {
        const totalMinutes = dayHours.hours * 60 + dayHours.minutes;
        const hoursText = totalMinutes > 0 ? `${dayHours.hours}h ${dayHours.minutes}min` : '';
        doc.text(hoursText, 150, currentY);
      }
      
      if (dayActivities.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Keine Tätigkeiten', 30, currentY + 10);
        currentY += 25;
        continue;
      }
      
      currentY += 15;
      
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
    
    const totalHours = report.dayHours.reduce((sum, dh) => sum + dh.hours + (dh.minutes / 60), 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Gesamtstunden: ${Math.round(totalHours * 10) / 10}h`, 20, currentY + 10);
  });
  
  doc.save(`Alle_Wochenberichte_${user.full_name.replace(/\s+/g, '_')}.pdf`);
};

// PDF mit pdfmake generieren (Berichtsheft-Stil)
export const generateBerichtsheftPDF = async (
  report: Report,
  activities: Activity[],
  dayHours: DayHours[],
  user: User
): Promise<void> => {
  try {
    console.log('Generiere Berichtsheft-PDF mit pdfmake...');
    
    // Fonts laden
    await loadPdfFonts();
    
    // Wochendatum-Bereich berechnen
    const weekStart = new Date(report.week_year, 0, 1 + (report.week_number - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekDateRange = `${format(weekStart, 'dd.MM.', { locale: de })} - ${format(weekEnd, 'dd.MM.yyyy', { locale: de })}`;
    
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
    
    // Gesamtstunden berechnen
    const totalHours = Object.values(hoursByDay).reduce((sum, hours) => sum + hours, 0);
    const avgHoursPerDay = totalHours / 5;
    
    const docDefinition = {
      content: [
        { text: "Berichtsheft – Wochenübersicht", style: "header" },
        {
          table: {
            widths: ["auto", "*", "auto", "*"],
            body: [
              ["Name:", user.full_name || "_________________", "Ausbildungsberuf:", "_________________"],
              ["Ausbildungsjahr:", "____", "Betrieb:", user.company || "_________________"],
              ["Woche vom:", weekDateRange, "KW:", `${report.week_number}/${report.week_year}`],
            ],
          },
          margin: [0, 20, 0, 20] as [number, number, number, number],
        },
        ...["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"].map((day, index) => {
          const dayOfWeek = index + 1;
          const dayActivities = activitiesByDay[dayOfWeek] || [];
          const dayHours = hoursByDay[dayOfWeek] || 0;
          const dayDate = format(addDays(weekStart, index), 'dd.MM.yyyy', { locale: de });
          
          return {
            table: {
              widths: ["auto", "*", "auto"],
              body: [
                [{ text: day, colSpan: 3, style: "dayHeader" }, {}, {}],
                ["Datum:", dayDate, `Stunden: ${Math.round(dayHours * 10) / 10}h`],
                ...dayActivities.map((activity, i) => [`Tätigkeit ${i + 1}:`, activity.activity_text, ""]),
                ...Array.from({ length: Math.max(0, 5 - dayActivities.length) }).map((_, i) => 
                  [`Tätigkeit ${dayActivities.length + i + 1}:`, "", ""]
                ),
              ],
            },
            margin: [0, 10, 0, 10] as [number, number, number, number],
          };
        }),
        {
          table: {
            widths: ["auto", "*"],
            body: [
              ["Gesamtstunden der Woche:", `${Math.round(totalHours * 10) / 10}h`],
              ["Durchschnitt pro Tag:", `${Math.round(avgHoursPerDay * 10) / 10}h`],
            ],
          },
          margin: [0, 20, 0, 20] as [number, number, number, number],
        },
        { text: "\nUnterschrift Azubi: ____________________", margin: [0, 20, 0, 5] as [number, number, number, number] },
        { text: "Unterschrift Ausbilder: ____________________" },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: "center" as const,
          margin: [0, 0, 0, 20] as [number, number, number, number],
        },
        dayHeader: {
          fillColor: "#d9e8fb",
          bold: true,
        },
      },
      // Keine spezifischen Fonts verwenden
      defaultStyle: {
        fontSize: 10
      }
    };

    pdfMake.createPdf(docDefinition).download(`Berichtsheft_KW${report.week_number}_${report.week_year}.pdf`);
    
    console.log('Berichtsheft-PDF erfolgreich generiert!');
    
  } catch (error) {
    console.error('Fehler beim Generieren der Berichtsheft-PDF:', error);
    throw error;
  }
};