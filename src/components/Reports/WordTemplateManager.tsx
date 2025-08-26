import React, { useState, useEffect } from 'react';
import { Upload, Download, Eye, FileText, TestTube, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { loadTemplateAndExtractParameters, testWordTemplate, generateReportFromWordTemplateWithCustomData } from '../../utils/docxGenerator';
import DocxGeneratorDemo from './RedocxDemo';

interface WordTemplateManagerProps {
  onTemplateSelect?: (templateUrl: string) => void;
  selectedTemplate?: string | null;
}

interface TemplateInfo {
  url: string;
  name: string;
  parameters: string[];
  lastTested?: Date;
  isValid: boolean;
  error?: string;
}

const WordTemplateManager: React.FC<WordTemplateManagerProps> = ({
  onTemplateSelect,
  selectedTemplate
}) => {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    loadAvailableTemplates();
  }, []);

  const loadAvailableTemplates = async () => {
    setLoading(true);
    
    const defaultTemplates = [
      '/templates/wochenbericht_vorlage.txt',
      '/templates/wochenbericht_vorlage_erweitert.txt'
    ];

    const templateInfos: TemplateInfo[] = [];

    for (const templateUrl of defaultTemplates) {
      try {
        const parameters = await loadTemplateAndExtractParameters(templateUrl);
        templateInfos.push({
          url: templateUrl,
          name: templateUrl.split('/').pop() || 'Unbekannt',
          parameters,
          isValid: parameters.length > 0
        });
      } catch (error) {
        console.error(`Fehler beim Laden der Vorlage ${templateUrl}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
        templateInfos.push({
          url: templateUrl,
          name: templateUrl.split('/').pop() || 'Unbekannt',
          parameters: [],
          isValid: false,
          error: errorMessage
        });
      }
    }

    setTemplates(templateInfos);
    setLoading(false);
  };

  const handleTestTemplate = async (templateUrl: string) => {
    setTesting(templateUrl);
    
    try {
      const result = await testWordTemplate(templateUrl);
      
      // DOCX herunterladen
      const docxBlob = new Blob([result.docxBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const docxUrl = URL.createObjectURL(docxBlob);
      
      const docxLink = document.createElement('a');
      docxLink.href = docxUrl;
      docxLink.download = `Test_${templateUrl.split('/').pop()?.replace('.docx', '')}_Ausgefuellt.docx`;
      document.body.appendChild(docxLink);
      docxLink.click();
      document.body.removeChild(docxLink);
      URL.revokeObjectURL(docxUrl);
      
      // Template-Info aktualisieren
      setTemplates(prev => prev.map(t => 
        t.url === templateUrl 
          ? { ...t, lastTested: new Date(), parameters: result.parameters, isValid: true }
          : t
      ));
      
      alert(`Vorlage erfolgreich getestet!\nParameter: ${result.parameters.length}\nDie ausgefüllte DOCX wurde heruntergeladen.`);
      
    } catch (error) {
      console.error('Fehler beim Testen der Vorlage:', error);
      alert('Fehler beim Testen der Vorlage. Bitte überprüfen Sie die Konsole.');
    } finally {
      setTesting(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.name.endsWith('.docx') || file.name.endsWith('.txt'))) {
      setUploadedFile(file);
      // Hier könnten wir die Datei verarbeiten und zu den Templates hinzufügen
      alert('Datei-Upload ist in dieser Demo-Version nicht implementiert. Verwenden Sie die vordefinierten Vorlagen.');
    } else {
      alert('Bitte wählen Sie eine .docx oder .txt Datei aus.');
    }
  };

  const handlePreviewTemplate = (templateUrl: string) => {
    // Öffne die Vorlage in einem neuen Tab
    window.open(templateUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* DOCX Generator Demo */}
      <DocxGeneratorDemo />
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Template-Verwaltung
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Unterstützt .txt und .docx Dateien. .txt Dateien können in Word geöffnet und als .docx gespeichert werden.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <label className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Vorlage hochladen
            <input
              type="file"
              accept=".docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          
          <button
            onClick={loadAvailableTemplates}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Laden...' : 'Aktualisieren'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {templates.map((template) => (
            <div
              key={template.url}
              className={`
                border rounded-lg p-4 transition-all duration-200
                ${selectedTemplate === template.url
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </h4>
                    {template.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {template.error ? (
                      <div className="text-red-600 dark:text-red-400">
                        <p className="font-medium">Fehler beim Laden:</p>
                        <p className="truncate">{template.error}</p>
                      </div>
                    ) : (
                      <>
                        <p>Parameter: {template.parameters.length}</p>
                        {template.parameters.length > 0 && (
                          <p className="truncate">
                            {template.parameters.slice(0, 5).join(', ')}
                            {template.parameters.length > 5 && '...'}
                          </p>
                        )}
                        {template.lastTested && (
                          <p>Zuletzt getestet: {template.lastTested.toLocaleString('de-DE')}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handlePreviewTemplate(template.url)}
                    disabled={!template.isValid}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title={template.isValid ? "Vorschau" : "Vorschau nicht verfügbar - Template ungültig"}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleTestTemplate(template.url)}
                    disabled={testing === template.url || !template.isValid}
                    className="p-2 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title={template.isValid ? "Testen" : "Test nicht verfügbar - Template ungültig"}
                  >
                    <TestTube className="h-4 w-4" />
                  </button>
                  
                  <a
                    href={template.url}
                    download
                    className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                    title="Herunterladen"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  
                  {onTemplateSelect && (
                    <button
                      onClick={() => onTemplateSelect(template.url)}
                      disabled={!template.isValid}
                      className={`
                        px-3 py-1 text-xs font-medium rounded-md transition-colors
                        ${selectedTemplate === template.url
                          ? 'bg-blue-600 text-white'
                          : template.isValid
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }
                      `}
                    >
                      {selectedTemplate === template.url ? 'Ausgewählt' : 'Auswählen'}
                    </button>
                  )}
                </div>
              </div>

              {testing === template.url && (
                <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Teste Vorlage... Bitte warten.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {templates.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Keine Word-Vorlagen gefunden
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Laden Sie eine .docx Vorlage hoch oder überprüfen Sie die verfügbaren Vorlagen.
          </p>
        </div>
      )}
    </div>
  );
};

export default WordTemplateManager;