import React, { useState, useMemo, useEffect } from 'react';
import type { Student, Subject, ClassGroup, Course, CourseSubject } from './types';
import { Grade } from './types';
import StudentList from './components/StudentList';
import StudentDetail from './components/StudentDetail';
import ClassTabs from './components/ClassTabs';
import SettingsPage from './components/SettingsPage';
import { generateTextForExport, generateHtmlForExport } from './services/exportService';
import { generateMissingReportsForClass } from './services/geminiService';
import { getInitialData } from './data/initialData';
import { supabase } from './supabaseClient';
import AuthComponent from './components/Auth';
import type { Session } from '@supabase/supabase-js';

const LOCAL_STORAGE_KEY = 'assistentDictatsData';

// Interface per a les dades que es passen als components fills
interface ResolvedSubject {
  id: string;
  name: string;
  workedContent: string;
}

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Carrega les dades des de localStorage o utilitza les dades inicials
  const loadDataFromLocalStorage = (): { courses: Course[], classGroups: ClassGroup[], subjects: Subject[] } => {
    try {
      const item = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed.courses) && Array.isArray(parsed.classGroups) && Array.isArray(parsed.subjects)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error llegint des de localStorage, utilitzant dades inicials.', error);
    }
    const { initialCourses, initialClassGroups, initialSubjects } = getInitialData();
    return { courses: initialCourses, classGroups: initialClassGroups, subjects: initialSubjects };
  };
  
  const [data, setData] = useState(loadDataFromLocalStorage);
  const { courses, classGroups, subjects } = data;

  // Desa les dades a localStorage cada cop que canviïn
  useEffect(() => {
    try {
      const dataToStore = JSON.stringify(data);
      window.localStorage.setItem(LOCAL_STORAGE_KEY, dataToStore);
    } catch (error) {
      console.error('Error desant a localStorage', error);
    }
  }, [data]);

  // Gestió de la sessió d'usuari amb Supabase
  useEffect(() => {
    if (!supabase) {
        setLoadingSession(false);
        return;
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Funcions per actualitzar l'estat de manera segura
  const setCourses = (updater: React.SetStateAction<Course[]>) => {
    setData(currentData => ({ ...currentData, courses: typeof updater === 'function' ? updater(currentData.courses) : updater }));
  };
  const setClassGroups = (updater: React.SetStateAction<ClassGroup[]>) => {
    setData(currentData => ({ ...currentData, classGroups: typeof updater === 'function' ? updater(currentData.classGroups) : updater }));
  };
  const setSubjects = (updater: React.SetStateAction<Subject[]>) => {
    setData(currentData => ({ ...currentData, subjects: typeof updater === 'function' ? updater(currentData.subjects) : updater }));
  };

  const [viewMode, setViewMode] = useState<'main' | 'settings'>('main');
  const [selectedClassGroupId, setSelectedClassGroupId] = useState<string | null>(() => classGroups[0]?.id ?? null);
  
  const selectedClassGroup = useMemo(() => classGroups.find(cg => cg.id === selectedClassGroupId), [classGroups, selectedClassGroupId]);
  const currentStudents = useMemo(() => selectedClassGroup?.students ?? [], [selectedClassGroup]);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    const firstClass = classGroups.find(cg => cg.id === (classGroups[0]?.id ?? null));
    return firstClass?.students[0]?.id ?? null;
  });
  
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  // Efecte per gestionar la selecció d'alumne en canviar de classe
  useEffect(() => {
    const currentClass = classGroups.find(cg => cg.id === selectedClassGroupId);
    if (currentClass) {
      const studentExistsInClass = currentClass.students.some(s => s.id === selectedStudentId);
      if (!studentExistsInClass) {
        setSelectedStudentId(currentClass.students[0]?.id ?? null);
      }
    } else if (classGroups.length > 0 && !selectedClassGroupId) {
      const firstClassId = classGroups[0].id;
      setSelectedClassGroupId(firstClassId);
      setSelectedStudentId(classGroups[0].students[0]?.id ?? null);
    }
  }, [selectedClassGroupId, classGroups, selectedStudentId]);

  const handleSelectClassGroup = (id: string) => {
    setSelectedClassGroupId(id);
    const newClassGroup = classGroups.find(cg => cg.id === id);
    setSelectedStudentId(newClassGroup?.students[0]?.id ?? null);
  };
  
  // Handlers per a Cursos
  const handleAddCourse = (name: string) => {
    const newCourse: Course = { id: crypto.randomUUID(), name, subjects: [] };
    setCourses(prev => [...prev, newCourse]);
  };
  const handleUpdateCourse = (id: string, name: string) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };
  const handleDeleteCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    const remainingClassGroups = classGroups.filter(cg => cg.courseId !== id);
    setClassGroups(remainingClassGroups);
    if (selectedClassGroup?.courseId === id) {
      setSelectedClassGroupId(remainingClassGroups[0]?.id ?? null);
    }
  };
  
  // Handlers per a Classes
  const handleAddClassGroup = (courseId: string, name: string) => {
    const parentCourse = courses.find(c => c.id === courseId);
    if (!parentCourse) return;
    const newClassGroup: ClassGroup = { id: crypto.randomUUID(), name, courseId, students: [] };
    setClassGroups(prev => [...prev, newClassGroup]);
    setSelectedClassGroupId(newClassGroup.id);
  };
  const handleUpdateClassGroup = (id: string, name: string) => {
    setClassGroups(prev => prev.map(cg => cg.id === id ? { ...cg, name } : cg));
  };
  const handleDeleteClassGroup = (id: string) => {
    const newClassGroups = classGroups.filter(cg => cg.id !== id);
    setClassGroups(newClassGroups);
    if (selectedClassGroupId === id) {
      setSelectedClassGroupId(newClassGroups[0]?.id ?? null);
    }
  };
  
  // Handlers per a Alumnes
  const handleAddStudent = (name: string) => {
    if (!selectedClassGroup) return;
    const parentCourse = courses.find(c => c.id === selectedClassGroup.courseId);
    if (!parentCourse) return;
    const newStudent: Student = {
        id: crypto.randomUUID(), name,
        personalAspects: { notes: '', report: '' }, generalComment: { notes: '', report: '' },
        subjects: parentCourse.subjects.map(cs => ({
            subjectId: cs.subjectId, grade: Grade.Satisfactori, comment: { notes: '', report: '' },
        })),
    };
    setClassGroups(prev => prev.map(cg => cg.id === selectedClassGroupId ? { ...cg, students: [...cg.students, newStudent] } : cg));
    setSelectedStudentId(newStudent.id);
  };
  const handleAddMultipleStudents = (classGroupId: string, names: string[]) => {
      const classGroup = classGroups.find(cg => cg.id === classGroupId);
      if (!classGroup) return;
      const parentCourse = courses.find(c => c.id === classGroup.courseId);
      if (!parentCourse) return;
      const newStudents: Student[] = names.map(name => ({
          id: crypto.randomUUID(), name,
          personalAspects: { notes: '', report: '' }, generalComment: { notes: '', report: '' },
          subjects: parentCourse.subjects.map(cs => ({
              subjectId: cs.subjectId, grade: Grade.Satisfactori, comment: { notes: '', report: '' },
          })),
      }));
      setClassGroups(prev => prev.map(cg => cg.id === classGroupId ? { ...cg, students: [...cg.students, ...newStudents] } : cg));
  };
  const handleUpdateStudent = (updatedStudent: Student) => {
      setClassGroups(prev => prev.map(cg => ({ ...cg, students: cg.students.map(s => s.id === updatedStudent.id ? updatedStudent : s) })));
  };
  const handleDeleteStudent = (classGroupId: string, studentId: string) => {
    let originalIndex = -1;
    const classGroup = classGroups.find(cg => cg.id === classGroupId);
    if (classGroup) originalIndex = classGroup.students.findIndex(s => s.id === studentId);
    const newClassGroups = classGroups.map(cg => (cg.id === classGroupId ? { ...cg, students: cg.students.filter(s => s.id !== studentId) } : cg));
    setClassGroups(newClassGroups);
    if (selectedStudentId === studentId && originalIndex !== -1) {
      const updatedStudents = newClassGroups.find(cg => cg.id === classGroupId)?.students || [];
      setSelectedStudentId(updatedStudents.length > 0 ? updatedStudents[Math.min(originalIndex, updatedStudents.length - 1)].id : null);
    }
  };
  
  // Handlers per a la llista mestra d'Assignatures
  const handleAddSubject = (subjectName: string) => {
    const newSubject: Subject = { id: crypto.randomUUID(), name: subjectName };
    setSubjects(prev => [...prev, newSubject]);
  };
  const handleUpdateSubject = (updatedSubject: Subject) => {
    setSubjects(prev => prev.map(s => s.id === updatedSubject.id ? updatedSubject : s));
  };
  const handleDeleteSubject = (subjectId: string) => {
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
    setCourses(prevCourses => prevCourses.map(c => ({
      ...c,
      subjects: c.subjects.filter(cs => cs.subjectId !== subjectId),
    })));
  };
  
  // Handlers per a les assignatures d'un Curs
  const handleAssignSubjectToCourse = (courseId: string, subjectId: string) => {
    setCourses(prev => prev.map(c => {
      if (c.id === courseId && !c.subjects.some(cs => cs.subjectId === subjectId)) {
        return { ...c, subjects: [...c.subjects, { subjectId, workedContent: '' }] };
      }
      return c;
    }));
    setClassGroups(prev => prev.map(cg => {
      if (cg.courseId === courseId) {
        return { ...cg, students: cg.students.map(s => ({ ...s, subjects: [...s.subjects, { subjectId, grade: Grade.Satisfactori, comment: { notes: '', report: '' } }] })) };
      }
      return cg;
    }));
  };
  const handleUnassignSubjectFromCourse = (courseId: string, subjectId: string) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, subjects: c.subjects.filter(cs => cs.subjectId !== subjectId) } : c));
    setClassGroups(prev => prev.map(cg => {
      if (cg.courseId === courseId) {
        return { ...cg, students: cg.students.map(s => ({ ...s, subjects: s.subjects.filter(ss => ss.subjectId !== subjectId) })) };
      }
      return cg;
    }));
  };
  const handleUpdateCourseSubjectContent = (courseId: string, subjectId: string, workedContent: string) => {
    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        return { ...c, subjects: c.subjects.map(cs => cs.subjectId === subjectId ? { ...cs, workedContent } : cs) };
      }
      return c;
    }));
  };

  const selectedStudent = useMemo(() => currentStudents.find(s => s.id === selectedStudentId), [currentStudents, selectedStudentId]);

  const resolvedSubjectsForSelectedClass = useMemo((): ResolvedSubject[] => {
    if (!selectedClassGroup) return [];
    const parentCourse = courses.find(c => c.id === selectedClassGroup.courseId);
    if (!parentCourse) return [];
    return parentCourse.subjects.map(cs => {
      const subjectInfo = subjects.find(s => s.id === cs.subjectId);
      return { id: cs.subjectId, name: subjectInfo?.name ?? 'Desconegut', workedContent: cs.workedContent };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedClassGroup, courses, subjects]);

  const handleGenerateAllReports = async () => {
    if (!selectedClassGroup || currentStudents.length === 0) return;
    setIsGeneratingAll(true);
    try {
        const updatedStudents = await generateMissingReportsForClass(currentStudents, resolvedSubjectsForSelectedClass);
        const updatedClassGroups = classGroups.map(cg => 
            cg.id === selectedClassGroupId ? { ...cg, students: updatedStudents } : cg
        );
        setClassGroups(updatedClassGroups);
    } catch (error) {
        console.error("Error en la generació massiva:", error);
        alert((error as Error).message);
    } finally {
        setIsGeneratingAll(false);
    }
  };

  const handleExport = (format: 'txt' | 'html') => {
    if (!selectedClassGroup || currentStudents.length === 0) return;
    try {
        const content = format === 'txt'
            ? generateTextForExport(selectedClassGroup.name, currentStudents, resolvedSubjectsForSelectedClass)
            : generateHtmlForExport(selectedClassGroup.name, currentStudents, resolvedSubjectsForSelectedClass);
        
        navigator.clipboard.writeText(content).then(() => {
            const message = format === 'txt' ? 'Text per a Esfera copiat!' : 'HTML per a Google Docs copiat!';
            setCopySuccess(message);
            setTimeout(() => setCopySuccess(''), 2000);
        });
    } catch (error) {
        alert('Hi ha hagut un error en generar l\'exportació.');
        console.error(error);
    }
  };

  if (loadingSession) {
    return <div className="flex justify-center items-center h-screen text-lg">Carregant sessió...</div>;
  }
  if (!supabase || !session) {
    return <AuthComponent />;
  }

  if (viewMode === 'settings') {
    return (
      <SettingsPage
        courses={courses}
        classGroups={classGroups}
        subjects={subjects}
        onAddCourse={handleAddCourse}
        onUpdateCourse={handleUpdateCourse}
        onDeleteCourse={handleDeleteCourse}
        onAddClassGroup={handleAddClassGroup}
        onUpdateClassGroup={handleUpdateClassGroup}
        onDeleteClassGroup={handleDeleteClassGroup}
        onAddMultipleStudents={handleAddMultipleStudents}
        onUpdateStudent={handleUpdateStudent}
        onDeleteStudent={handleDeleteStudent}
        onAddSubject={handleAddSubject}
        onUpdateSubject={handleUpdateSubject}
        onDeleteSubject={handleDeleteSubject}
        onAssignSubjectToCourse={handleAssignSubjectToCourse}
        onUnassignSubjectFromCourse={handleUnassignSubjectFromCourse}
        onUpdateCourseSubjectContent={handleUpdateCourseSubjectContent}
        onBack={() => setViewMode('main')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto p-4 flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-sky-700">Assistent de Dictats Esfera</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('settings')} className="p-2 rounded-full hover:bg-slate-200 transition-colors" title="Configuració">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
             {supabase && (
              <button onClick={() => supabase.auth.signOut()} className="text-sm text-slate-600 hover:text-sky-700" title="Tancar sessió">
                Sortir
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-6 space-y-6">
        <ClassTabs 
          courses={courses}
          classGroups={classGroups}
          selectedClassGroupId={selectedClassGroupId}
          onSelectClassGroup={handleSelectClassGroup}
        />
        
        {selectedClassGroup ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6">
              <StudentList 
                students={currentStudents}
                onAddStudent={handleAddStudent}
                onSelectStudent={setSelectedStudentId}
                selectedStudentId={selectedStudentId}
              />
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                  <h2 className="text-lg font-bold border-b pb-2">Eines i Exportació</h2>
                  <button onClick={handleGenerateAllReports} disabled={isGeneratingAll} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300">
                    {isGeneratingAll ? 'Generant...' : 'Generar Tots els Informes Pendents'}
                  </button>
                  <button onClick={() => handleExport('txt')} className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors">Copiar Text per a Esfera</button>
                  <button onClick={() => handleExport('html')} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Copiar per a Google Docs</button>
                  {copySuccess && <div className="text-center text-sm font-semibold text-green-600 bg-green-100 p-2 rounded-md">{copySuccess}</div>}
              </div>
            </div>
            <div className="lg:col-span-2">
              {selectedStudent ? (
                <StudentDetail 
                  student={selectedStudent}
                  classSubjects={resolvedSubjectsForSelectedClass}
                  onUpdateStudent={handleUpdateStudent}
                />
              ) : (
                <div className="bg-white rounded-lg shadow p-10 text-center">
                  <h2 className="text-xl font-semibold">No hi ha cap alumne/a seleccionat/da</h2>
                  <p className="text-slate-500 mt-2">Selecciona un alumne de la llista o afegeix-ne un de nou.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
           <div className="bg-white rounded-lg shadow p-10 text-center">
              <h2 className="text-xl font-semibold">Benvingut/da!</h2>
              <p className="text-slate-500 mt-2">No hi ha cap classe seleccionada. Selecciona una classe de les pestanyes de dalt o crea'n una de nova a la pàgina de configuració.</p>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;
