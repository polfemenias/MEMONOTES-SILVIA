import React, { useState, useRef } from 'react';
import type { ClassGroup, Subject, Student, Course } from '../types';
import EditableListItem from './EditableListItem';
import StudentDictation from './StudentDictation';
import StudentImporter from './StudentImporter';
import SpeechToTextButton from './SpeechToTextButton';
import { useAutoResizeTextArea } from '../hooks/useAutoResizeTextArea';

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
  const [activeCourseId, setActiveCourseId] = useState<string | null>(props.courses[0]?.id ?? null);
  const [isManagingMasterSubjects, setIsManagingMasterSubjects] = useState(false);
  const [subjectToAssign, setSubjectToAssign] = useState<Record<string, string>>({});
  
  const handleUpdateStudentName = (student: Student, newName: string) => {
    props.onUpdateStudent({ ...student, name: newName });
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
    return props.subjects.filter(s => !assignedIds.has(s.id)).sort((a,b) => a.name.localeCompare(b.name));
  };
  
  const CourseContent: React.FC<{ course: Course }> = ({ course }) => {
    const workedContentTextareaRefs = useRef<{[key: string]: HTMLTextAreaElement | null}>({});
    
    // Trigger auto-resize for all textareas within this component
    course.subjects.forEach(cs => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useAutoResizeTextArea(
          { current: workedContentTextareaRefs.current[cs.subjectId] ?? null },
          cs.workedContent
        );
    });

    return (
      <div className="mt-4 pt-4 border-t-2 border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Class Management */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg text-slate-700">Grups-Classe</h4>
          {props.classGroups.filter(cg => cg.courseId === course.id).map(cg => (
            <div key={cg.id} className="p-4 border rounded-lg bg-white">
              <EditableListItem
                item={{id: cg.id, name: cg.name}}
                onUpdate={props.onUpdateClassGroup}
                onDelete={props.onDeleteClassGroup}
              />
              <div className="mt-4 pt-4 border-t">
                <h5 className="font-semibold text-sm mb-2 text-slate-600">Alumnes de {cg.name}</h5>
                {cg.students.length > 0 ? (
                  <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
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
                ) : <p className="text-slate-500 text-sm mb-4">No hi ha alumnes en aquesta classe.</p>}
                <div className="mt-4 border-t pt-4 flex flex-wrap items-center gap-4">
                  <StudentDictation onAddStudents={(names) => props.onAddMultipleStudents(cg.id, names)} />
                  <StudentImporter onImport={(names) => props.onAddMultipleStudents(cg.id, names)} />
                </div>
              </div>
            </div>
          ))}
          <div className="p-4 border rounded-lg bg-white">
            <EditableListItem isAdding onAdd={(name) => props.onAddClassGroup(course.id, name)} addLabel="Afegir nova classe" />
          </div>
        </div>

        {/* Subject Management */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg text-slate-700">Assignatures del Curs</h4>
          <div className="space-y-3">
            {course.subjects.map(cs => {
              const subject = props.subjects.find(s => s.id === cs.subjectId);
              if (!subject) return null;
              return (
                <div key={cs.subjectId} className="p-3 bg-white rounded-md border">
                  <div className="flex justify-between items-start">
                    <h5 className="font-semibold text-teal-800">{subject.name}</h5>
                    <button onClick={() => props.onUnassignSubjectFromCourse(course.id, cs.subjectId)} className="text-red-500 hover:text-red-700 p-1" title="Desassignar">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                  <div className="relative mt-2">
                    <textarea
                      ref={el => workedContentTextareaRefs.current[cs.subjectId] = el}
                      value={cs.workedContent}
                      onChange={(e) => props.onUpdateCourseSubjectContent(course.id, cs.subjectId, e.target.value)}
                      rows={2}
                      className="w-full p-2 pr-10 border rounded-md text-sm resize-none overflow-hidden"
                      placeholder="Continguts treballats per a aquest curs..."
                    />
                    <div className="absolute top-1 right-1">
                        <SpeechToTextButton onTranscript={(t) => props.onUpdateCourseSubjectContent(course.id, cs.subjectId, `${cs.workedContent} ${t}`.trim())} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <select
                value={subjectToAssign[course.id] || ''}
                onChange={(e) => setSubjectToAssign(prev => ({...prev, [course.id]: e.target.value}))}
                className="w-full p-2 border rounded-md bg-white"
              >
                <option value="">-- Assignar una assignatura --</option>
                {getUnassignedSubjects(course).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={() => handleAssignSubject(course.id)} className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 whitespace-nowrap">Assignar</button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const MasterSubjectsManager: React.FC = () => (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Llista General d'Assignatures</h2>
                   <button onClick={() => setIsManagingMasterSubjects(false)} className="p-2 rounded-full hover:bg-slate-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                   </button>
              </div>
              <p className="text-sm text-slate-600 mb-4">Aquesta és la llista mestra de totes les assignatures disponibles. Després, has d'anar a cada curs per assignar les que corresponguin.</p>
              <div className="overflow-y-auto flex-grow pr-2">
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
              </div>
              <div className="mt-4 pt-4 border-t">
                  <EditableListItem isAdding onAdd={props.onAddSubject} addLabel="Afegir nova assignatura" />
              </div>
          </div>
      </div>
  );


  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-40">
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
      
      <main className="p-4 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Gestió de Cursos i Classes</h2>
            <button onClick={() => setIsManagingMasterSubjects(true)} className="text-sm font-medium text-sky-600 hover:text-sky-800 underline">
                Gestionar Llista General d'Assignatures
            </button>
        </div>
        <div className="space-y-4">
            {props.courses.sort((a,b) => a.name.localeCompare(b.name)).map(course => (
              <div key={course.id} className="border p-4 rounded-lg bg-slate-100 shadow-sm">
                <div className="flex items-center justify-between">
                   <EditableListItem
                      item={{id: course.id, name: course.name}}
                      onUpdate={props.onUpdateCourse}
                      onDelete={props.onDeleteCourse}
                    />
                   <button onClick={() => setActiveCourseId(prev => prev === course.id ? null : course.id)} className="p-2 rounded-full hover:bg-slate-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform ${activeCourseId === course.id ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 15.25a1 1 0 01-.71-.29l-4-4a1 1 0 111.42-1.42L12 12.84l3.29-3.3a1 1 0 111.42 1.42l-4 4a1 1 0 01-.71.29z"/>
                      </svg>
                   </button>
                </div>
                {activeCourseId === course.id && <CourseContent course={course} />}
              </div>
            ))}
        </div>
         <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
              <EditableListItem isAdding onAdd={props.onAddCourse} addLabel="Crear un nou curs" />
        </div>
      </main>
      
      {isManagingMasterSubjects && <MasterSubjectsManager />}
    </div>
  );
};

export default SettingsPage;