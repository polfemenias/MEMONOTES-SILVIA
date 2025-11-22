import React, { useState, useMemo, useEffect } from 'react';
import type { Student, Subject, ClassGroup, Course } from './types';
import { Grade } from './types';
import StudentList from './components/StudentList';
import StudentDetail from './components/StudentDetail';
import ClassTabs from './components/ClassTabs';
import SettingsPage from './components/SettingsPage';
import { generateHtmlForExport } from './services/exportService';
import { generateMissingReportsForClass } from './services/geminiService';
import { getInitialData } from './data/initialData';

const LOCAL_STORAGE_KEY = 'assistentDictatsData';

// Interface per a les dades que es passen als components fills
interface ResolvedSubject {
  id: string;
  name: string;
  workedContent: string;
}

const App: React.FC = () => {
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

  // Reordenar Classes (Drag and Drop) - GLOBAL
  const handleReorderClassGroups = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const updatedClassGroups = [...classGroups];
    const [movedGroup] = updatedClassGroups.splice(fromIndex, 1);
    updatedClassGroups.splice(toIndex, 0, movedGroup);
    
    setClassGroups(updatedClassGroups);
  };

  // Reordenar Alumnes (Drag and Drop)
  const handleReorderStudents = (fromIndex: number, toIndex: number) => {
    if (!selectedClassGroup) return;
    
    // Copiem els alumnes actuals
    const newStudents = [...selectedClassGroup.students];
    // Movem l'element
    const [movedStudent] = newStudents.splice(fromIndex, 1);
    newStudents.splice(toIndex, 0, movedStudent);

    // Actualitzem l'estat global
    setClassGroups(prev => prev.map(cg => 
      cg.id === selectedClassGroupId 
        ? { ...cg, students: newStudents }
        : cg
    ));
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
    if (window.confirm("Estàs segur que vols esborrar aquesta classe i tots els seus alumnes?")) {
        const newClassGroups = classGroups.filter(cg => cg.id !== id);
        setClassGroups(newClassGroups);
        if (selectedClassGroupId === id) {
        setSelectedClassGroupId(newClassGroups[0]?.id ?? null);
        }
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
    if (!window.confirm("Segur que vols esborrar aquest alumne?")) return;

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

  const handleExport = () => {
    if (!selectedClassGroup || currentStudents.length === 0) return;
    try {
        const content = generateHtmlForExport(selectedClassGroup.name, currentStudents, resolvedSubjectsForSelectedClass);
        
        navigator.clipboard.writeText(content).then(() => {
            const message = 'Contingut copiat! Enganxa-ho a un Google Docs.';
            setCopySuccess(message);
            setTimeout(() => setCopySuccess(''), 3000);
        });
    } catch (error) {
        alert('Hi ha hagut un error en generar l\'exportació.');
        console.error(error);
    }
  };

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
    <div className="flex h-screen overflow-hidden bg-[#F3F5F9] relative">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-200/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-3xl"></div>
      </div>

      {/* Sidebar */}
      <aside className="w-20 flex-shrink-0 z-20 flex flex-col items-center py-8 gap-8 glass-effect border-r border-white/20">
         <div className="p-3 bg-slate-900 rounded-2xl text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
         </div>
         
         <nav className="flex flex-col gap-6 w-full items-center">
            <button 
              onClick={() => setViewMode('main')}
              className={`p-3 rounded-2xl transition-all ${viewMode === 'main' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`}
              title="Escriptori"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </button>
            <button 
              onClick={() => setViewMode('settings')}
              className={`p-3 rounded-2xl transition-all ${viewMode === 'settings' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`}
              title="Configuració"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
         </nav>
         
         <div className="mt-auto">
             {/* Placeholder for logout if auth returns later */}
         </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 z-10 p-6 md:p-8 gap-8 overflow-hidden">
        
        {/* Header Area */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
          <div>
             <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Bon dia, Mestre!</h1>
             <p className="text-slate-500 mt-1">Fem que avui sigui un dia productiu.</p>
          </div>
          
          <div className="flex items-center gap-8">
             <div className="hidden md:block">
                <p className="text-sm text-slate-400 mb-1">Alumnes</p>
                <p className="text-2xl font-semibold text-slate-800 flex items-start gap-1">
                  {currentStudents.length} <span className="text-xs text-slate-400 mt-1">↗</span>
                </p>
             </div>
             <div className="hidden md:block">
                <p className="text-sm text-slate-400 mb-1">Progrés Classe</p>
                <p className="text-2xl font-semibold text-slate-800 flex items-start gap-1">
                  {Math.round((currentStudents.filter(s => s.generalComment.report).length / (currentStudents.length || 1)) * 100)}% <span className="text-xs text-slate-400 mt-1">↗</span>
                </p>
             </div>
             <button onClick={handleGenerateAllReports} disabled={isGeneratingAll} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-full font-medium shadow-lg shadow-slate-300/50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                 {isGeneratingAll ? 'Generant...' : '+ Generar Tot'}
             </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 flex flex-col gap-6 min-h-0">
           
           {/* Class Selector (Horizontal Scroll) */}
           <div className="flex-shrink-0">
              <ClassTabs 
                courses={courses}
                classGroups={classGroups}
                selectedClassGroupId={selectedClassGroupId}
                onSelectClassGroup={handleSelectClassGroup}
                onReorderClassGroups={handleReorderClassGroups}
                onDeleteClassGroup={handleDeleteClassGroup}
              />
           </div>
           
           {selectedClassGroup ? (
             <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* Left Column: Student List (To-do style) */}
                <div className="lg:col-span-4 flex flex-col min-h-0">
                    <StudentList 
                        students={currentStudents}
                        onAddStudent={handleAddStudent}
                        onSelectStudent={setSelectedStudentId}
                        selectedStudentId={selectedStudentId}
                        onReorderStudents={handleReorderStudents}
                        onDeleteStudent={(id) => handleDeleteStudent(selectedClassGroup.id, id)}
                    />
                    
                    {/* Mini footer actions */}
                    <div className="mt-4 flex gap-2">
                        <button onClick={handleExport} className="flex-1 bg-white/50 hover:bg-white text-slate-700 py-3 rounded-2xl font-medium transition-colors border border-white shadow-sm flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                            Exportar
                        </button>
                    </div>
                     {copySuccess && <div className="mt-2 text-center text-xs font-bold text-green-600 bg-green-100/80 py-1 px-3 rounded-full self-center animate-pulse">{copySuccess}</div>}
                </div>

                {/* Right Column: Workspace / Details */}
                <div className="lg:col-span-8 flex flex-col min-h-0 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                    {selectedStudent ? (
                        <StudentDetail 
                          student={selectedStudent}
                          classSubjects={resolvedSubjectsForSelectedClass}
                          onUpdateStudent={handleUpdateStudent}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10 text-slate-400">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <p className="text-lg font-medium text-slate-500">Selecciona un alumne</p>
                            <p className="text-sm mt-2">Tria un alumne de la llista de l'esquerra per començar a editar el seu informe.</p>
                        </div>
                    )}
                </div>

             </div>
           ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center">
                   <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                   </div>
                   <h2 className="text-2xl font-bold text-slate-800">Benvingut a l'Assistent</h2>
                   <p className="text-slate-500 max-w-md mt-2">Selecciona una classe a la part superior o crea'n una de nova a la configuració per començar.</p>
               </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default App;