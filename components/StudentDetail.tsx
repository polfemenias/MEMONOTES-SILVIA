import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Student, StudentSubject, AITextField, Trimester, EvaluationData } from '../types';
import { Grade, TRIMESTERS } from '../types';
import { GRADE_OPTIONS } from '../constants';
import AICommentGenerator from './AICommentGenerator';
import { useAutoResizeTextArea } from '../hooks/useAutoResizeTextArea';
import SpeechToTextButton from './SpeechToTextButton';

interface ResolvedSubject {
  id: string;
  name: string;
  workedContent: Record<Trimester, string>;
}

interface StudentDetailProps {
  student: Student;
  classSubjects: ResolvedSubject[];
  onUpdateStudent: (student: Student) => void;
  styleExamples?: string;
}

const AutoResizingTextArea: React.FC<{ value: string, onChange: (val: string) => void, placeholder?: string }> = ({ value, onChange, placeholder }) => {
    const [localValue, setLocalValue] = useState(value);
    const ref = useRef<HTMLTextAreaElement>(null);
    useAutoResizeTextArea(ref, localValue);

    useEffect(() => { setLocalValue(value); }, [value]);

    const handleBlur = () => { if (localValue !== value) onChange(localValue); };
    const handleTranscript = (text: string) => {
        const newValue = localValue ? `${localValue} ${text}` : text;
        setLocalValue(newValue);
        onChange(newValue);
    };

    return (
        <div className="relative">
            <textarea
                ref={ref}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                className="w-full p-4 pr-12 rounded-2xl bg-white text-sm text-slate-700 border-2 border-indigo-100 focus:border-indigo-300 focus:ring-0 resize-none overflow-hidden shadow-sm"
                placeholder={placeholder}
            />
            <div className="absolute top-2 right-2">
                <SpeechToTextButton onTranscript={handleTranscript} />
            </div>
        </div>
    )
}

const StudentDetail: React.FC<StudentDetailProps> = ({ student, classSubjects, onUpdateStudent, styleExamples }) => {
  const [activeTrimester, setActiveTrimester] = useState<Trimester>('1');
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditingContent, setIsEditingContent] = useState(false);
  
  // Dades del trimestre actual
  const currentEvaluation: EvaluationData = student.evaluations[activeTrimester];

  useEffect(() => {
    if (activeTab !== 'personal' && activeTab !== 'general') {
      const subjectExists = classSubjects.some(s => s.id === activeTab);
      if (!subjectExists) setActiveTab('personal');
    }
    setIsEditingContent(false);
  }, [classSubjects, activeTab]);

  // Update Helpers
  const updateEvaluation = (updates: Partial<EvaluationData>) => {
      const newEvaluations = { ...student.evaluations };
      newEvaluations[activeTrimester] = { ...newEvaluations[activeTrimester], ...updates };
      onUpdateStudent({ ...student, evaluations: newEvaluations });
  };

  const handleUpdateStudentField = useCallback((field: 'personalAspects' | 'generalComment', value: AITextField) => {
    updateEvaluation({ [field]: value });
  }, [student, activeTrimester, onUpdateStudent]);
  
  const handleUpdateStudentSubject = useCallback((subjectId: string, updates: Partial<StudentSubject>) => {
    const updatedSubjects = currentEvaluation.subjects.map(s => 
      s.subjectId === subjectId ? { ...s, ...updates } : s
    );
    updateEvaluation({ subjects: updatedSubjects });
  }, [student, activeTrimester, onUpdateStudent, currentEvaluation]);
  
  const renderTabContent = () => {
    if (activeTab === 'personal') {
      return (
        <div className="animate-fadeIn">
            <AICommentGenerator
            label={`Aspectes Personals (${TRIMESTERS.find(t=>t.id===activeTrimester)?.label})`}
            notes={currentEvaluation.personalAspects.notes}
            report={currentEvaluation.personalAspects.report}
            onNotesChange={(newNotes) => handleUpdateStudentField('personalAspects', { ...currentEvaluation.personalAspects, notes: newNotes })}
            onReportChange={(newReport) => handleUpdateStudentField('personalAspects', { ...currentEvaluation.personalAspects, report: newReport })}
            generationContext={{ type: 'personal', studentName: student.name, subjects: currentEvaluation.subjects, resolvedSubjects: classSubjects }}
            styleExamples={styleExamples}
            />
        </div>
      );
    }
    if (activeTab === 'general') {
      return (
         <div className="animate-fadeIn">
            <AICommentGenerator
            label={`Comentari General (${TRIMESTERS.find(t=>t.id===activeTrimester)?.label})`}
            notes={currentEvaluation.generalComment.notes}
            report={currentEvaluation.generalComment.report}
            onNotesChange={(newNotes) => handleUpdateStudentField('generalComment', { ...currentEvaluation.generalComment, notes: newNotes })}
            onReportChange={(newReport) => handleUpdateStudentField('generalComment', { ...currentEvaluation.generalComment, report: newReport })}
            generationContext={{ 
                type: 'general',
                studentName: student.name,
                personalAspects: currentEvaluation.personalAspects,
                subjects: currentEvaluation.subjects,
                resolvedSubjects: classSubjects
            }}
            styleExamples={styleExamples}
            />
         </div>
      );
    }

    const studentSubject = currentEvaluation.subjects.find(s => s.subjectId === activeTab);
    const subject = classSubjects.find(s => s.id === activeTab);
    if (!studentSubject || !subject) return null;

    // Contingut treballat: Custom (alumne) > Curs (per trimestre) > String buit
    const displayContent = studentSubject.customWorkedContent !== undefined 
        ? studentSubject.customWorkedContent 
        : (subject.workedContent[activeTrimester] || '');

    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Continguts Treballats {studentSubject.customWorkedContent !== undefined && <span className="text-indigo-600">(Adaptat)</span>}
                    </label>
                    <button 
                        onClick={() => setIsEditingContent(!isEditingContent)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md"
                    >
                        {isEditingContent ? 'Fet' : 'Personalitzar'}
                    </button>
                </div>
                
                {isEditingContent ? (
                   <AutoResizingTextArea 
                        value={displayContent}
                        onChange={(val) => handleUpdateStudentSubject(subject.id, { customWorkedContent: val })}
                        placeholder={`Continguts adaptats per ${student.name}...`}
                   />
                ) : (
                    <div className="w-full p-4 rounded-2xl bg-slate-50 text-sm text-slate-600 leading-relaxed border border-slate-100 whitespace-pre-wrap min-h-[5rem]">
                        {displayContent || <span className="text-slate-400 italic">No s'han definit continguts per aquest trimestre.</span>}
                    </div>
                )}
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nota</label>
                <div className="relative">
                    <select
                        value={studentSubject.grade}
                        onChange={(e) => handleUpdateStudentSubject(subject.id, { grade: e.target.value as Grade })}
                        className="w-full p-4 border-none rounded-2xl bg-indigo-50 text-indigo-900 font-semibold appearance-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
                    >
                        {GRADE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            </div>
        </div>

        <div className="bg-white border-t border-slate-100 pt-6">
          <AICommentGenerator
            label="Comentari Específic"
            notes={studentSubject.comment.notes}
            report={studentSubject.comment.report}
            onNotesChange={(newNotes) => handleUpdateStudentSubject(subject.id, { comment: { ...studentSubject.comment, notes: newNotes } })}
            onReportChange={(newReport) => handleUpdateStudentSubject(subject.id, { comment: { ...studentSubject.comment, report: newReport } })}
            generationContext={{
                type: 'subject',
                studentName: student.name,
                grade: studentSubject.grade,
                subjectName: subject.name,
                workedContent: displayContent,
            }}
            styleExamples={styleExamples}
          />
        </div>
      </div>
    );
  };

  const TabButton: React.FC<{ id: string; label: string; isActive: boolean; onClick: () => void }> = ({ id, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-5 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
        isActive
          ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
          : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header with Name and Trimester Tabs */}
      <div className="px-8 py-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-4 self-start">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                    {student.name.charAt(0)}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{student.name}</h2>
                    <p className="text-xs text-slate-400">Informe d'Avaluació</p>
                </div>
            </div>
            
            {/* Trimester Pills */}
            <div className="bg-slate-100 p-1 rounded-full flex self-start md:self-auto">
                {TRIMESTERS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTrimester(t.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                            activeTrimester === t.id 
                            ? 'bg-white text-indigo-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
         </div>
      </div>

      {/* Section Tabs */}
      <div className="px-8 py-4 border-b border-slate-50 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
            <TabButton id="personal" label="Aspectes Personals" isActive={activeTab === 'personal'} onClick={() => setActiveTab('personal')} />
            {classSubjects.map(s => (
                <TabButton key={s.id} id={s.id} label={s.name} isActive={activeTab === s.id} onClick={() => setActiveTab(s.id)} />
            ))}
            <TabButton id="general" label="General" isActive={activeTab === 'general'} onClick={() => setActiveTab('general')} />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8 flex-1 overflow-y-auto bg-white relative">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default StudentDetail;