import React, { useState } from 'react';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';

const DocxGeneratorDemo: React.FC = () => {
  const [generating, setGenerating] = useState(false);

  const generateSimpleDocx = async () => {
    setGenerating(true);
    try {
      // Einfaches DOCX-Dokument mit der docx-Bibliothek erstellen
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Wochenbericht - DOCX Demo",
                  bold: true,
                  size: 24
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Name: Max Mustermann",
                  size: 12
                })
              ],
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Unternehmen: Musterfirma GmbH",
                  size: 12
                })
              ],
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Datum: " + new Date().toLocaleDateString('de-DE'),
                  size: 12
                })
              ],
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "MONTAG:",
                  bold: true,
                  size: 14
                })
              ],
              spacing: { before: 300, after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Tätigkeiten:",
                  bold: true,
                  size: 12
                })
              ],
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "• Test-Tätigkeit 1",
                  size: 12
                })
              ],
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "• Test-Tätigkeit 2",
                  size: 12
                })
              ],
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Arbeitszeit: 8 Stunden",
                  size: 12
                })
              ],
              spacing: { after: 200 }
            })
          ]
        }]
      });

      // DOCX als Buffer generieren
      const buffer = await Packer.toBuffer(doc);
      
      // Als Blob herunterladen
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Redocx_Demo_Wochenbericht.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      alert('DOCX erfolgreich mit der docx-Bibliothek generiert!');
      
    } catch (error) {
      console.error('Fehler beim Generieren des DOCX:', error);
      alert('Fehler beim Generieren des DOCX: ' + error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        DOCX Generator Demo
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Diese Demo zeigt, wie die docx-Bibliothek verwendet wird, um DOCX-Dokumente zu erstellen.
        Die docx-Bibliothek ist eine stabile und bewährte Lösung für DOCX-Generierung in React.
      </p>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Vorteile der docx-Bibliothek:
          </h3>
          <ul className="text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Stabile und bewährte Lösung</li>
            <li>• Vollständige TypeScript-Unterstützung</li>
            <li>• Keine problematischen Abhängigkeiten</li>
            <li>• Einfache React-Integration</li>
            <li>• Aktive Wartung</li>
          </ul>
        </div>
        
        <button
          onClick={generateSimpleDocx}
          disabled={generating}
          className={`
            w-full px-4 py-2 rounded-lg font-medium transition-colors
            ${generating
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          {generating ? 'Generiere DOCX...' : 'DOCX mit docx-Bibliothek generieren'}
        </button>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Das generierte DOCX wird automatisch heruntergeladen.
        </div>
      </div>
    </div>
  );
};

export default DocxGeneratorDemo;
