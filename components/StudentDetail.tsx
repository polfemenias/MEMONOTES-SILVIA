import React, { useState, useCallback, useEffect } from 'react';
import type { Student, StudentSubject, AITextField } from '../types';
import { Grade } from '../types';
import { GRADE_OPTIONS } from '../constants';
import AICommentGenerator from './AICommentGenerator';

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

const StudentDetail: React.FC<StudentDetailProps> = ({ student, classSubjects, onUpdateStudent }) => {
  const [activeTab, setActiveTab] = useState('personal');
  
  useEffect(() => {
    // Si l'assignatura activa ja no pertany a la classe, torna a la pestanya personal
    if (activeTab !== 'personal' && activeTab !== 'general') {
      const subjectExists = classSubjects.some(s => s.id === activeTab);
      if (!subjectExists) {
        setActiveTab('personal');
      }
    }
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
        <AICommentGenerator
          label="Aspectes Personals i Evolutius"
          notes={student.personalAspects.notes}
          report={student.personalAspects.report}
          onNotesChange={(newNotes) => handleUpdateStudentField('personalAspects', { ...student.personalAspects, notes: newNotes })}
          onReportChange={(newReport) => handleUpdateStudentField('personalAspects', { ...student.personalAspects, report: newReport })}
          generationContext={{ type: 'personal', student, subjects: classSubjects }}
        />
      );
    }
    if (activeTab === 'general') {
      return (
        <AICommentGenerator
          label="Comentari General Final"
          notes={student.generalComment.notes}
          report={student.generalComment.report}
          onNotesChange={(newNotes) => handleUpdateStudentField('generalComment', { ...student.generalComment, notes: newNotes })}
          onReportChange={(newReport) => handleUpdateStudentField('generalComment', { ...student.generalComment, report: newReport })}
          generationContext={{ type: 'general' }}
        />
      );
    }

    const studentSubject = student.subjects.find(s => s.subjectId === activeTab);
    const subject = classSubjects.find(s => s.id === activeTab);
    if (!studentSubject || !subject) return null;

    return (
      <div className="space-y-6">
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Continguts Treballats (compartits per al curs)</label>
            <div className="w-full p-3 border rounded-md bg-slate-50 min-h-[4rem] text-sm text-slate-800">
               {subject.workedContent || <span className="text-slate-400">No s'han definit continguts per a aquesta assignatura. Pots afegir-los a la pàgina de Configuració.</span>}
            </div>
             <p className="text-xs text-slate-500 mt-1">Aquests continguts s'editen a la pàgina de Configuració i són els mateixos per a totes les classes del mateix curs.</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg">
           <h3 className="font-semibold mb-2">Valoració de l'assignatura per a {student.name}</h3>
           <div className="mb-4">
              <label htmlFor={`grade-${subject.id}`} className="block text-sm font-medium text-slate-700 mb-1">Nota</label>
              <select
                id={`grade-${subject.id}`}
                value={studentSubject.grade}
                onChange={(e) => handleUpdateStudentSubject(subject.id, { grade: e.target.value as Grade })}
                className="w-full p-2 border rounded-md"
              >
                {GRADE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
          </div>
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
                workedContent: subject.workedContent,
            }}
          />
        </div>
      </div>
    );
  };

  const TabButton: React.FC<{ id: string; label: string }> = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
        activeTab === id
          ? 'border-sky-600 text-sky-700 bg-white'
          : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-2xl font-bold">{student.name}</h2>
      </div>
      <div className="border-b border-slate-200 flex flex-wrap items-center">
        <TabButton id="personal" label="Aspectes Personals" />
        {classSubjects.map(s => <TabButton key={s.id} id={s.id} label={s.name} />)}
        <div className="flex-grow"></div>
        <TabButton id="general" label="Comentari General" />
      </div>
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default StudentDetail;
