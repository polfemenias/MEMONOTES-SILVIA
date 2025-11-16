import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Student, Subject, StudentSubject, AITextField } from '../types';
import { Grade } from '../types';
import { GRADE_OPTIONS } from '../constants';
import AICommentGenerator from './AICommentGenerator';
import { useAutoResizeTextArea } from '../hooks/useAutoResizeTextArea';

interface StudentDetailProps {
  student: Student;
  subjects: Subject[];
  onUpdateStudent: (student: Student) => void;
  onUpdateSubject: (subject: Subject) => void;
  onAddSubject: (subjectName: string) => void;
}

const StudentDetail: React.FC<StudentDetailProps> = ({ student, subjects, onUpdateStudent, onUpdateSubject, onAddSubject }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  
  const workedContentRef = useRef<HTMLTextAreaElement>(null);
  const currentSubject = subjects.find(s => s.id === activeTab);
  useAutoResizeTextArea(workedContentRef, currentSubject?.workedContent ?? '');


  useEffect(() => {
    if (activeTab !== 'personal' && activeTab !== 'general') {
      const subjectExists = subjects.some(s => s.id === activeTab);
      if (!subjectExists) {
        setActiveTab('personal');
      }
    }
  }, [subjects, activeTab]);

  const handleUpdateStudentField = useCallback((field: 'personalAspects' | 'generalComment', value: AITextField) => {
    onUpdateStudent({ ...student, [field]: value });
  }, [student, onUpdateStudent]);
  
  const handleUpdateStudentSubject = useCallback((subjectId: string, updates: Partial<StudentSubject>) => {
    const updatedSubjects = student.subjects.map(s => 
      s.subjectId === subjectId ? { ...s, ...updates } : s
    );
    onUpdateStudent({ ...student, subjects: updatedSubjects });
  }, [student, onUpdateStudent]);

  const handleConfirmAddSubject = () => {
    if (newSubjectName.trim()) {
      onAddSubject(newSubjectName.trim());
      setNewSubjectName('');
      setIsAddingSubject(false);
    }
  };

  const handleAddSubjectKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmAddSubject();
    } else if (e.key === 'Escape') {
      setIsAddingSubject(false);
      setNewSubjectName('');
    }
  };
  
  const renderTabContent = () => {
    if (activeTab === 'personal') {
      return (
        <AICommentGenerator
          label="Aspectes Personals i Evolutius"
          notes={student.personalAspects.notes}
          report={student.personalAspects.report}
          onNotesChange={(newNotes) => handleUpdateStudentField('personalAspects', { ...student.personalAspects, notes: newNotes })}
          onReportChange={(newReport) => handleUpdateStudentField('personalAspects', { ...student.personalAspects, report: newReport })}
          generationContext={{ type: 'personal', student, subjects }}
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
    const subject = subjects.find(s => s.id === activeTab);
    if (!studentSubject || !subject) return null;

    return (
      <div className="space-y-6">
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Continguts Treballats (per a tots els alumnes)</label>
            <textarea
                ref={workedContentRef}
                value={subject.workedContent}
                onChange={(e) => onUpdateSubject({ ...subject, workedContent: e.target.value })}
                rows={3}
                className="w-full p-3 border rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition resize-none overflow-hidden"
                placeholder="Introdueix els continguts treballats en aquesta assignatura..."
            />
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
        {subjects.map(s => <TabButton key={s.id} id={s.id} label={s.name} />)}
        {isAddingSubject ? (
          <div className="p-2 flex items-center gap-2">
            <input 
              type="text" 
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              onKeyDown={handleAddSubjectKeyDown}
              className="p-1 border rounded-md text-sm"
              placeholder="Nova assignatura"
              autoFocus
            />
            <button onClick={handleConfirmAddSubject} className="text-green-600 hover:text-green-800 text-xl font-bold">&#x2713;</button>
            <button onClick={() => { setIsAddingSubject(false); setNewSubjectName(''); }} className="text-red-600 hover:text-red-800 text-xl font-bold">&times;</button>
          </div>
        ) : (
          <button onClick={() => setIsAddingSubject(true)} className="px-3 py-2 text-sky-600 hover:bg-sky-50 rounded-md text-sm">+</button>
        )}
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