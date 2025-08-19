import React, { useState } from 'react';
import { FileText, Download, Eye, CheckCircle } from 'lucide-react';
import { PDFTemplate } from '../../utils/pdfGenerator';

interface TemplateSelectorProps {
  templates: PDFTemplate[];
  selectedTemplate: string | null;
  onTemplateSelect: (templateUrl: string) => void;
  onPreview: (templateUrl: string) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  onPreview
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        PDF-Vorlage auswählen
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <div
            key={template.url}
            className={`
              relative p-4 border rounded-lg cursor-pointer transition-all duration-200
              ${selectedTemplate === template.url
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
              }
            `}
            onClick={() => onTemplateSelect(template.url)}
          >
            {selectedTemplate === template.url && (
              <div className="absolute top-2 right-2">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {template.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {template.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(template.url);
                }}
                className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <Eye className="h-3 w-3" />
                <span>Vorschau</span>
              </button>
              
              <a
                href={template.url}
                download
                onClick={(e) => e.stopPropagation()}
                className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
              >
                <Download className="h-3 w-3" />
                <span>Herunterladen</span>
              </a>
            </div>
          </div>
        ))}
      </div>
      
      {selectedTemplate && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Ausgewählte Vorlage:</strong> {templates.find(t => t.url === selectedTemplate)?.name}
          </p>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
