import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Student, StudentSubject, AITextField } from '../types';
import { Grade } from '../types';
import { GRADE_OPTIONS } from '../constants';
import AICommentGenerator from './AICommentGenerator';
import { useAutoResizeTextArea } from '../hooks/useAutoResizeTextArea';

interface ResolvedSubject {
  id: string;
  name: string;
  workedContent: string;
}

interface StudentDetailProps {
  student: Student;
  classSubjects: ResolvedSubject[];
  onUpdateStudent: (student: Student) => void;
}

// Petit component auxiliar per al textarea d'edició de continguts AMB ESTAT LOCAL
// Això evita pèrdua de focus en escriure
const AutoResizingTextArea: React.FC<{ value: string, onChange: (val: string) => void, placeholder?: string }> = ({ value, onChange, placeholder }) => {
    const [localValue, setLocalValue] = useState(value);
    const ref = useRef<HTMLTextAreaElement>(null);
    useAutoResizeTextArea(ref, localValue);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleBlur = () => {
        if (localValue !== value) {
            onChange(localValue);
        }
    };

    return (
        <textarea
            ref={ref}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            className="w-full p-4 rounded-2xl bg-white text-sm text-slate-700 border-2 border-indigo-100 focus:border-indigo-300 focus:ring-0 resize-none overflow-hidden shadow-sm"
            placeholder={placeholder}
        />
    )
}

const StudentDetail: React.FC<StudentDetailProps> = ({ student, classSubjects, onUpdateStudent }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditingContent, setIsEditingContent] = useState(false);
  
  useEffect(() => {
    if (activeTab !== 'personal' && activeTab !== 'general') {
      const subjectExists = classSubjects.some(s => s.id === activeTab);
      if (!subjectExists) {
        setActiveTab('personal');
      }
    }
    // Reset editing state when tab changes
    setIsEditingContent(false);
  }, [classSubjects, activeTab]);

  const handleUpdateStudentField = useCallback((field: 'personalAspects' | 'generalComment', value: AITextField) => {
    onUpdateStudent({ ...student, [field]: value });
  }, [student, onUpdateStudent]);
  
  const handleUpdateStudentSubject = useCallback((subjectId: string, updates: Partial<StudentSubject>) => {
    const updatedSubjects = student.subjects.map(s => 
      s.subjectId === subjectId ? { ...s, ...updates } : s
    );
    onUpdateStudent({ ...student, subjects: updatedSubjects });
  }, [student, onUpdateStudent]);
  
  const renderTabContent = () => {
    if (activeTab === 'personal') {
      return (
        <div className="animate-fadeIn">
            <AICommentGenerator
            label="Aspectes Personals i Evolutius"
            notes={student.personalAspects.notes}
            report={student.personalAspects.report}
            onNotesChange={(newNotes) => handleUpdateStudentField('personalAspects', { ...student.personalAspects, notes: newNotes })}
            onReportChange={(newReport) => handleUpdateStudentField('personalAspects', { ...student.personalAspects, report: newReport })}
            generationContext={{ type: 'personal', student, subjects: classSubjects }}
            />
        </div>
      );
    }
    if (activeTab === 'general') {
      return (
         <div className="animate-fadeIn">
            <AICommentGenerator
            label="Comentari General Final"
            notes={student.generalComment.notes}
            report={student.generalComment.report}
            onNotesChange={(newNotes) => handleUpdateStudentField('generalComment', { ...student.generalComment, notes: newNotes })}
            onReportChange={(newReport) => handleUpdateStudentField('generalComment', { ...student.generalComment, report: newReport })}
            generationContext={{ type: 'general' }}
            />
         </div>
      );
    }

    const studentSubject = student.subjects.find(s => s.subjectId === activeTab);
    const subject = classSubjects.find(s => s.id === activeTab);
    if (!studentSubject || !subject) return null;

    // Determinació del contingut a mostrar: el personalitzat o el del curs
    const displayContent = studentSubject.customWorkedContent !== undefined 
        ? studentSubject.customWorkedContent 
        : subject.workedContent;

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
                        {isEditingContent ? 'Fet' : 'Personalitzar / Editar'}
                    </button>
                </div>
                
                {isEditingContent ? (
                   <AutoResizingTextArea 
                        value={displayContent}
                        onChange={(val) => handleUpdateStudentSubject(subject.id, { customWorkedContent: val })}
                        placeholder="Escriu els continguts adaptats per aquest alumne..."
                   />
                ) : (
                    <div className="w-full p-4 rounded-2xl bg-slate-50 text-sm text-slate-600 leading-relaxed border border-slate-100 whitespace-pre-wrap min-h-[5rem]">
                        {displayContent || <span className="text-slate-400 italic">No s'han definit continguts.</span>}
                    </div>
                )}
            </div>
            <div>
                <label htmlFor={`grade-${subject.id}`} className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nota</label>
                <div className="relative">
                    <select
                        id={`grade-${subject.id}`}
                        value={studentSubject.grade}
                        onChange={(e) => handleUpdateStudentSubject(subject.id, { grade: e.target.value as Grade })}
                        className="w-full p-4 border-none rounded-2xl bg-indigo-50 text-indigo-900 font-semibold appearance-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
                    >
                        {GRADE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
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
                grade: studentSubject.grade,
                subjectName: subject.name,
                workedContent: displayContent, // Passem el contingut (adaptat o no) a la IA
            }}
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
      {/* Header Section */}
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                {student.name.charAt(0)}
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">{student.name}</h2>
                <p className="text-xs text-slate-400">Informe Trimestral</p>
            </div>
        </div>
      </div>

      {/* Tabs Scroll Area */}
      <div className="px-8 py-4 border-b border-slate-50 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
            <TabButton id="personal" label="Personal" isActive={activeTab === 'personal'} onClick={() => setActiveTab('personal')} />
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