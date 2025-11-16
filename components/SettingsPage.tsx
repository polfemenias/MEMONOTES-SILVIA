import React, { useState, useRef } from 'react';
import type { ClassGroup, Subject, Student, Course, CourseSubject } from '../types';
import EditableListItem from './EditableListItem';
import StudentDictation from './StudentDictation';
import { useAutoResizeTextArea } from '../hooks/useAutoResizeTextArea';
import SpeechToTextButton from './SpeechToTextButton';

interface SettingsPageProps {
  courses: Course[];
  classGroups: ClassGroup[];
  subjects: Subject[];
  onAddCourse: (name: string) => void;
  onUpdateCourse: (id: string, name: string) => void;
  onDeleteCourse: (id: string) => void;
  onAddClassGroup: (courseId: string, name: string) => void;
  onUpdateClassGroup: (id: string, name: string) => void;
  onDeleteClassGroup: (id: string) => void;
  onAddMultipleStudents: (classGroupId: string, names: string[]) => void;
  onDeleteStudent: (classGroupId: string, studentId: string) => void;
  onUpdateStudent: (student: Student) => void;
  onAddSubject: (name: string) => void;
  onUpdateSubject: (subject: Subject) => void;
  onDeleteSubject: (id: string) => void;
  onAssignSubjectToCourse: (courseId: string, subjectId: string) => void;
  onUnassignSubjectFromCourse: (courseId: string, subjectId: string) => void;
  onUpdateCourseSubjectContent: (courseId: string, subjectId: string, workedContent: string) => void;
  onBack: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'subjects'>('courses');
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [pastedNames, setPastedNames] = useState('');
  const [importTargetClassId, setImportTargetClassId] = useState<string | null>(null);
  const importTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const [subjectToAssign, setSubjectToAssign] = useState<Record<string, string>>({});

  useAutoResizeTextArea(importTextAreaRef, pastedNames);

  const handleToggleExpand = (courseId: string) => {
    setExpandedCourseId(prevId => (prevId === courseId ? null : courseId));
  };
  
  const handleUpdateStudentName = (student: Student, newName: string) => {
    props.onUpdateStudent({ ...student, name: newName });
  };
  
  const handleConfirmImport = () => {
    if (!importTargetClassId) return;
    const names = pastedNames.split('\n').map(name => name.trim().toUpperCase()).filter(name => name !== '');
    if (names.length > 0) {
        props.onAddMultipleStudents(importTargetClassId, names);
    }
    handleCancelImport();
  };

  const handleCancelImport = () => {
    setPastedNames('');
    setIsImporting(false);
    setImportTargetClassId(null);
  };
  
  const handleAssignSubject = (courseId: string) => {
    const subjectId = subjectToAssign[courseId];
    if (subjectId) {
      props.onAssignSubjectToCourse(courseId, subjectId);
      setSubjectToAssign(prev => ({...prev, [courseId]: ''}));
    }
  };
  
  const getUnassignedSubjects = (course: Course) => {
    const assignedIds = new Set(course.subjects.map(cs => cs.subjectId));
    return props.subjects.filter(s => !assignedIds.has(s.id));
  };


  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-sky-700">Configuració</h1>
        <button
          onClick={props.onBack}
          className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Tornar a l'Assistent
        </button>
      </header>
      
      <main className="p-4 md:p-8">
        <div className="border-b border-slate-200 mb-6">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'courses'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Cursos i Classes
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subjects'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Llista General d'Assignatures
            </button>
          </nav>
        </div>

        {activeTab === 'courses' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Gestió de Cursos</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <ul className="space-y-4">
                {props.courses.map(course => (
                  <li key={course.id} className="border p-4 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between">
                       <EditableListItem
                          item={{id: course.id, name: course.name}}
                          onUpdate={props.onUpdateCourse}
                          onDelete={props.onDeleteCourse}
                        />
                       <button onClick={() => handleToggleExpand(course.id)} className="p-2 rounded-full hover:bg-slate-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform ${expandedCourseId === course.id ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 15.25a1 1 0 01-.71-.29l-4-4a1 1 0 111.42-1.42L12 12.84l3.29-3.3a1 1 0 111.42 1.42l-4 4a1 1 0 01-.71.29z"/>
                          </svg>
                       </button>
                    </div>
                    {expandedCourseId === course.id && (
                        <div className="mt-4 pt-4 border-t-2 border-slate-200 space-y-6">
                          {/* Class Management */}
                          <div className="pl-4 border-l-2 border-sky-200">
                            <h4 className="font-semibold mb-3 text-slate-700">Classes de {course.name}</h4>
                            <ul className="space-y-2 mb-4">
                               {props.classGroups.filter(cg => cg.courseId === course.id).map(cg => (
                                   <li key={cg.id}>
                                       <EditableListItem
                                            item={{id: cg.id, name: cg.name}}
                                            onUpdate={props.onUpdateClassGroup}
                                            onDelete={props.onDeleteClassGroup}
                                        />
                                   </li>
                               ))}
                            </ul>
                            <EditableListItem isAdding onAdd={(name) => props.onAddClassGroup(course.id, name)} addLabel="Afegir classe" />
                          </div>

                          {/* Subject Management */}
                           <div className="pl-4 border-l-2 border-teal-200">
                               <h4 className="font-semibold mb-3 text-slate-700">Assignatures de {course.name}</h4>
                                <div className="space-y-4">
                                  {course.subjects.map(cs => {
                                      const subject = props.subjects.find(s => s.id === cs.subjectId);
                                      if (!subject) return null;
                                      return (
                                        <div key={cs.subjectId} className="p-3 bg-white rounded-md border">
                                          <div className="flex justify-between items-start">
                                            <h5 className="font-semibold text-teal-800">{subject.name}</h5>
                                            <button onClick={() => props.onUnassignSubjectFromCourse(course.id, cs.subjectId)} className="text-red-500 hover:text-red-700" title="Desassignar">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            </button>
                                          </div>
                                          <textarea
                                            value={cs.workedContent}
                                            onChange={(e) => props.onUpdateCourseSubjectContent(course.id, cs.subjectId, e.target.value)}
                                            rows={2}
                                            className="w-full mt-2 p-2 border rounded-md text-sm"
                                            placeholder="Continguts treballats per a aquest curs..."
                                          />
                                        </div>
                                      );
                                  })}
                                </div>
                                <div className="mt-4 pt-4 border-t">
                                   <div className="flex items-center gap-2">
                                       <select
                                         value={subjectToAssign[course.id] || ''}
                                         onChange={(e) => setSubjectToAssign(prev => ({...prev, [course.id]: e.target.value}))}
                                         className="w-full p-2 border rounded-md"
                                       >
                                         <option value="">-- Assignar una assignatura --</option>
                                         {getUnassignedSubjects(course).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                       </select>
                                       <button onClick={() => handleAssignSubject(course.id)} className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 whitespace-nowrap">Assignar</button>
                                   </div>
                                </div>
                           </div>

                            {/* Student Management per class*/}
                            {props.classGroups.filter(cg => cg.courseId === course.id).map(cg => (
                                <div key={cg.id} className="pl-4 border-l-2 border-amber-200">
                                    <h4 className="font-semibold mb-3 text-slate-700">Alumnes de {cg.name}</h4>
                                    {cg.students.length > 0 ? (
                                    <ul className="space-y-2">
                                        {cg.students.map(student => (
                                            <li key={student.id}>
                                                <EditableListItem
                                                        item={{id: student.id, name: student.name}}
                                                        onUpdate={(id, name) => handleUpdateStudentName(student, name)}
                                                        onDelete={(id) => props.onDeleteStudent(cg.id, id)}
                                                    />
                                            </li>
                                        ))}
                                    </ul>
                                    ) : <p className="text-slate-500 text-sm mb-4">Aquesta classe no té alumnes.</p>}
                                    <div className="mt-4 border-t pt-4 flex flex-wrap items-center gap-6">
                                    <StudentDictation onAddStudents={(names) => props.onAddMultipleStudents(cg.id, names)} />
                                        <button
                                            onClick={() => { setImportTargetClassId(cg.id); setIsImporting(true); }}
                                            className="text-sm text-sky-600 hover:text-sky-800 flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                                            Importar Llista (Copiar/Enganxar)
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                  <EditableListItem isAdding onAdd={props.onAddCourse} addLabel="Afegir nou curs" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Gestió de la Llista General d'Assignatures</h2>
            <p className="text-sm text-slate-600">Aquesta és la llista mestra de totes les assignatures que es poden impartir. Després, has d'anar a cada curs per assignar-les.</p>
            <div className="bg-white rounded-lg shadow p-6">
              <ul className="space-y-2">
                {props.subjects.map(sub => (
                   <li key={sub.id}>
                      <EditableListItem
                        item={sub}
                        onUpdate={(id, name) => props.onUpdateSubject({ ...sub, name})}
                        onDelete={props.onDeleteSubject}
                      />
                   </li>
                ))}
              </ul>
              <div className="mt-6">
                  <EditableListItem isAdding onAdd={props.onAddSubject} addLabel="Afegir nova assignatura a la llista" />
              </div>
            </div>
          </div>
        )}
      </main>

      {isImporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Importar Llista d'Alumnes</h3>
                <p className="text-sm text-slate-600 mb-3">Enganxa aquí la llista d'alumnes, un nom per línia.</p>
                <div className="relative">
                    <textarea
                        ref={importTextAreaRef}
                        value={pastedNames}
                        onChange={(e) => setPastedNames(e.target.value)}
                        rows={8}
                        className="w-full p-2 pr-12 border rounded-md resize-none overflow-hidden"
                        placeholder={`LAURA PÉREZ\nMARC SOLER\n...`}
                        autoFocus
                    />
                    <div className="absolute top-2 right-2">
                        <SpeechToTextButton onTranscript={(t) => setPastedNames(p => `${p}${t}\n`)} />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={handleCancelImport} className="px-4 py-2 rounded-md bg-slate-200 hover:bg-slate-300">Cancel·lar</button>
                    <button onClick={handleConfirmImport} className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700">Afegir Alumnes</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
