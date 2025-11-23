
import React, { useState, useRef } from 'react';
import SpeechToTextButton from './SpeechToTextButton';
import { generateReportComment, GenerationContext } from '../services/geminiService';
import { useAutoResizeTextArea } from '../hooks/useAutoResizeTextArea';

interface AICommentGeneratorProps {
  label: string;
  notes: string;
  report: string;
  onNotesChange: (notes: string) => void;
  onReportChange: (report: string) => void;
  generationContext: GenerationContext;
  styleExamples?: string;
}

const AICommentGenerator: React.FC<AICommentGeneratorProps> = ({ label, notes, report, onNotesChange, onReportChange, generationContext, styleExamples }) => {
  const [isLoading, setIsLoading] = useState(false);
  const notesTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const reportTextAreaRef = useRef<HTMLTextAreaElement>(null);

  useAutoResizeTextArea(notesTextAreaRef, notes);
  useAutoResizeTextArea(reportTextAreaRef, report);

  const handleGenerate = async () => {
    // Permetre generar sense notes si és el comentari General (auto-resum)
    const isGeneral = generationContext.type === 'general';

    if (!notes.trim() && !isGeneral) {
      alert('Introdueix primer algunes notes per generar el comentari.');
      return;
    }
    
    setIsLoading(true);
    try {
      const newReport = await generateReportComment(notes, generationContext, styleExamples);
      onReportChange(newReport);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("No s'ha pogut generar l'informe. Intenta-ho de nou.");
    } finally {
      setIsLoading(false);
    }
  };

  const placeholderText = generationContext.type === 'general'
    ? "Deixa en blanc per generar un resum automàtic basat en les assignatures, o afegeix notes específiques..."
    : "Introdueix o dicta les teves notes aquí...";

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">{label}: Notes del Mestre/a</label>
        <div className="relative">
          <textarea
            ref={notesTextAreaRef}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
            className="w-full p-3 pr-12 border rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition resize-none overflow-hidden"
            placeholder={placeholderText}
          />
          <div className="absolute top-2 right-2">
            <SpeechToTextButton onTranscript={(transcript) => onNotesChange(notes ? `${notes} ${transcript}`: transcript)} />
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:bg-indigo-300 w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Generant...
            </>
          ) : (
            <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                {report.trim() ? 'Actualitzar Informe (IA)' : (generationContext.type === 'general' && !notes.trim() ? 'Generar Resum Automàtic (IA)' : 'Generar Informe (IA)')}
            </>
          )}
        </button>
      </div>

      {(isLoading || report) && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Proposta d'informe per a les famílies</label>
          <div className="relative">
            <textarea
              ref={reportTextAreaRef}
              value={report}
              onChange={(e) => onReportChange(e.target.value)}
              rows={5}
              className="w-full p-3 pr-12 border rounded-md bg-slate-50 shadow-sm focus:ring-sky-500 focus:border-sky-500 transition resize-none overflow-hidden"
              placeholder="Aquí apareixerà l'informe generat..."
            />
            <div className="absolute top-2 right-2">
                <SpeechToTextButton onTranscript={(transcript) => onReportChange(report ? `${report} ${transcript}`: transcript)} />
            </div>
          </div>
           <p className="text-xs text-slate-500 mt-1">Pots editar manualment aquest text abans d'exportar-lo.</p>
        </div>
      )}
    </div>
  );
};

export default AICommentGenerator;
