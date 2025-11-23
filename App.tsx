
import React, { useState, useMemo, useEffect } from 'react';
import type { Student, Subject, ClassGroup, Course, Trimester, EvaluationData, AppData } from './types';
import { Grade, TRIMESTERS } from './types';
import { DEFAULT_STYLE_EXAMPLES } from './constants';
import StudentList from './components/StudentList';
import StudentDetail from './components/StudentDetail';
import ClassTabs from './components/ClassTabs';
import SettingsPage from './components/SettingsPage';
import AuthComponent from './components/Auth';
import { generateHtmlForExport } from './services/exportService';
import { generateMissingReportsForClass } from './services/geminiService';
import { getInitialData } from './data/initialData';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';

interface ResolvedSubject {
  id: string;
  name: string;
  workedContent: Record<Trimester, string>;
}

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState<AppData>({ courses: [], classGroups: [], subjects: [], styleExamples: DEFAULT_STYLE_EXAMPLES });
  const { courses, classGroups, subjects, styleExamples } = data;

  // --- SUPABASE AUTH & DATA LOADING ---
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadData(session.user.id);
      else setIsLoadingData(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadData(session.user.id);
      else {
          setData({ courses: [], classGroups: [], subjects: [], styleExamples: DEFAULT_STYLE_EXAMPLES });
          setIsLoadingData(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Helper de migració simple per assegurar l'estructura de trimestres
  const migrateData = (loadedData: any): AppData => {
      const migratedGroups = loadedData.classGroups.map((cg: any) => ({
          ...cg,
          students: cg.students.map((s: any) => {
              // Si ja té evaluations, està bé
              if (s.evaluations) return s;
              
              // Si no, convertim l'estructura antiga a la nova (assumim Trimestre 1)
              const emptyEvaluation: EvaluationData = {
                  personalAspects: { notes: '', report: '' },
                  generalComment: { notes: '', report: '' },
                  subjects: s.subjects || []
              };

              const initialEval: Record<Trimester, EvaluationData> = {
                  '1': { 
                      personalAspects: s.personalAspects || { notes: '', report: '' }, 
                      generalComment: s.generalComment || { notes: '', report: '' }, 
                      subjects: s.subjects || [] 
                  },
                  '2': JSON.parse(JSON.stringify(emptyEvaluation)), // Clone deep simple
                  '3': JSON.parse(JSON.stringify(emptyEvaluation)),
                  'final': JSON.parse(JSON.stringify(emptyEvaluation))
              };

              // Resetegem notes/reports als trimestres buits per evitar duplicitats errònies
              ['2', '3', 'final'].forEach((t) => {
                  const key = t as Trimester;
                  initialEval[key].personalAspects = { notes: '', report: '' };
                  initialEval[key].generalComment = { notes: '', report: '' };
                  initialEval[key].subjects.forEach((subj: any) => {
                      subj.comment = { notes: '', report: '' };
                      subj.grade = Grade.Satisfactori;
                      delete subj.customWorkedContent;
                  });
              });

              return {
                  id: s.id,
                  name: s.name,
                  evaluations: initialEval
              };
          })
      }));

      // Migració Cursos (workedContent string -> Record)
      const migratedCourses = loadedData.courses.map((c: any) => ({
          ...c,
          subjects: c.subjects.map((cs: any) => {
              if (typeof cs.workedContent === 'string') {
                  return {
                      subjectId: cs.subjectId,
                      workedContent: {
                          '1': cs.workedContent,
                          '2': '', '3': '', 'final': ''
                      }
                  };
              }
              return cs;
          })
      }));

      return {
          courses: migratedCourses,
          classGroups: migratedGroups,
          subjects: loadedData.subjects,
          styleExamples: loadedData.styleExamples || DEFAULT_STYLE_EXAMPLES
      };
  };

  const loadData = async (userId: string) => {
    setIsLoadingData(true);
    if (!supabase) return;
    try {
        const { data: dbData } = await supabase
            .from('user_data')
            .select('content')
            .eq('user_id', userId)
            .single();

        if (dbData && dbData.content) {
            setData(migrateData(dbData.content));
        } else {
            const initial = getInitialData();
            const newData = { 
                courses: initial.initialCourses, 
                classGroups: initial.initialClassGroups, 
                subjects: initial.initialSubjects,
                styleExamples: DEFAULT_STYLE_EXAMPLES
            };
            setData(newData);
            saveDataToSupabase(userId, newData); 
        }
    } catch (err) {
        console.error("Error carrgant:", err);
        const initial = getInitialData();
        setData({ 
            courses: initial.initialCourses, 
            classGroups: initial.initialClassGroups, 
            subjects: initial.initialSubjects,
            styleExamples: DEFAULT_STYLE_EXAMPLES
        });
    } finally {
        setIsLoadingData(false);
    }
  };

  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveDataToSupabase = async (userId: string, dataToSave: AppData) => {
      if (!supabase) return;
      setIsSaving(true);
      const { error } = await supabase
        .from('user_data')
        .upsert({ user_id: userId, content: dataToSave, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) console.error("Error guardant:", error);
      setIsSaving(false);
  };

  useEffect(() => {
      if (!session || isLoadingData) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
          saveDataToSupabase(session.user.id, data);
      }, 2000);
      return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [data, session, isLoadingData]);

  // --- APP LOGIC ---
  const setCourses = (updater: any) => setData(d => ({ ...d, courses: typeof updater === 'function' ? updater(d.courses) : updater }));
  const setClassGroups = (updater: any) => setData(d => ({ ...d, classGroups: typeof updater === 'function' ? updater(d.classGroups) : updater }));
  const setSubjects = (updater: any) => setData(d => ({ ...d, subjects: typeof updater === 'function' ? updater(d.subjects) : updater }));
  const setStyleExamples = (newStyle: string) => setData(d => ({ ...d, styleExamples: newStyle }));

  const [viewMode, setViewMode] = useState<'main' | 'settings'>('main');
  const [selectedClassGroupId, setSelectedClassGroupId] = useState<string | null>(null);
  
  useEffect(() => {
      if (!isLoadingData && classGroups.length > 0 && !selectedClassGroupId) {
          setSelectedClassGroupId(classGroups[0].id);
      }
  }, [isLoadingData, classGroups, selectedClassGroupId]);

  const selectedClassGroup = useMemo(() => classGroups.find(cg => cg.id === selectedClassGroupId), [classGroups, selectedClassGroupId]);
  const currentStudents = useMemo(() => selectedClassGroup?.students ?? [], [selectedClassGroup]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  useEffect(() => {
      if (selectedClassGroup && !selectedStudentId) setSelectedStudentId(selectedClassGroup.students[0]?.id ?? null);
  }, [selectedClassGroup, selectedStudentId]);
  
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    const currentClass = classGroups.find(cg => cg.id === selectedClassGroupId);
    if (currentClass) {
      const studentExists = currentClass.students.some(s => s.id === selectedStudentId);
      if (!studentExists) setSelectedStudentId(currentClass.students[0]?.id ?? null);
    }
  }, [selectedClassGroupId, classGroups, selectedStudentId]);

  const handleSelectClassGroup = (id: string) => {
    setSelectedClassGroupId(id);
    const newClassGroup = classGroups.find(cg => cg.id === id);
    setSelectedStudentId(newClassGroup?.students[0]?.id ?? null);
  };
  
  const handleLogout = async () => { if (supabase) await supabase.auth.signOut(); setSession(null); };

  const handleReorderClassGroups = (from: number, to: number) => {
    if (from === to) return;
    const updated = [...classGroups];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setClassGroups(updated);
  };

  const handleReorderStudents = (from: number, to: number) => {
    if (!selectedClassGroup) return;
    const newStudents = [...selectedClassGroup.students];
    const [moved] = newStudents.splice(from, 1);
    newStudents.splice(to, 0, moved);
    setClassGroups(prev => prev.map(cg => cg.id === selectedClassGroupId ? { ...cg, students: newStudents } : cg));
  };
  
  // -- CRUD HANDLERS --
  const handleAddCourse = (name: string) => setCourses((prev: Course[]) => [...prev, { id: crypto.randomUUID(), name, subjects: [] }]);
  const handleUpdateCourse = (id: string, name: string) => setCourses((prev: Course[]) => prev.map(c => c.id === id ? { ...c, name } : c));
  const handleDeleteCourse = (id: string) => {
    setCourses((prev: Course[]) => prev.filter(c => c.id !== id));
    const remaining = classGroups.filter(cg => cg.courseId !== id);
    setClassGroups(remaining);
    if (selectedClassGroup?.courseId === id) setSelectedClassGroupId(remaining[0]?.id ?? null);
  };
  
  const handleAddClassGroup = (courseId: string, name: string) => {
    const newClass: ClassGroup = { id: crypto.randomUUID(), name, courseId, students: [] };
    setClassGroups((prev: ClassGroup[]) => [...prev, newClass]);
    setSelectedClassGroupId(newClass.id);
  };
  const handleUpdateClassGroup = (id: string, name: string) => setClassGroups((prev: ClassGroup[]) => prev.map(cg => cg.id === id ? { ...cg, name } : cg));
  const handleDeleteClassGroup = (id: string) => {
    if (window.confirm("Esborrar classe i alumnes?")) {
        const newGroups = classGroups.filter(cg => cg.id !== id);
        setClassGroups(newGroups);
        if (selectedClassGroupId === id) setSelectedClassGroupId(newGroups[0]?.id ?? null);
    }
  };
  
  const createEmptyEvaluations = (courseId: string): Record<Trimester, EvaluationData> => {
      const parentCourse = courses.find(c => c.id === courseId);
      const evals: any = {};
      TRIMESTERS.forEach(t => {
          evals[t.id] = {
              personalAspects: { notes: '', report: '' },
              generalComment: { notes: '', report: '' },
              subjects: parentCourse ? parentCourse.subjects.map(cs => ({
                  subjectId: cs.subjectId, grade: Grade.Satisfactori, comment: { notes: '', report: '' }
              })) : []
          };
      });
      return evals;
  };

  const handleAddStudent = (name: string) => {
    if (!selectedClassGroup) return;
    const newStudent: Student = {
        id: crypto.randomUUID(), name,
        evaluations: createEmptyEvaluations(selectedClassGroup.courseId)
    };
    setClassGroups((prev: ClassGroup[]) => prev.map(cg => cg.id === selectedClassGroupId ? { ...cg, students: [...cg.students, newStudent] } : cg));
    setSelectedStudentId(newStudent.id);
  };

  const handleAddMultipleStudents = (classGroupId: string, names: string[]) => {
      const classGroup = classGroups.find(cg => cg.id === classGroupId);
      if (!classGroup) return;
      const newStudents: Student[] = names.map(name => ({
          id: crypto.randomUUID(), name,
          evaluations: createEmptyEvaluations(classGroup.courseId)
      }));
      setClassGroups((prev: ClassGroup[]) => prev.map(cg => cg.id === classGroupId ? { ...cg, students: [...cg.students, ...newStudents] } : cg));
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
      setClassGroups((prev: ClassGroup[]) => prev.map(cg => ({ ...cg, students: cg.students.map(s => s.id === updatedStudent.id ? updatedStudent : s) })));
  };

  const handleDeleteStudent = (classGroupId: string, studentId: string) => {
    if (!window.confirm("Esborrar alumne?")) return;
    const classGroup = classGroups.find(cg => cg.id === classGroupId);
    const originalIndex = classGroup?.students.findIndex(s => s.id === studentId) ?? -1;
    const newGroups = classGroups.map(cg => (cg.id === classGroupId ? { ...cg, students: cg.students.filter(s => s.id !== studentId) } : cg));
    setClassGroups(newGroups);
    if (selectedStudentId === studentId && originalIndex !== -1) {
      const updatedStudents = newGroups.find(cg => cg.id === classGroupId)?.students || [];
      setSelectedStudentId(updatedStudents.length > 0 ? updatedStudents[Math.min(originalIndex, updatedStudents.length - 1)].id : null);
    }
  };
  
  const handleAddSubject = (name: string) => setSubjects((prev: Subject[]) => [...prev, { id: crypto.randomUUID(), name }]);
  const handleUpdateSubject = (updated: Subject) => setSubjects((prev: Subject[]) => prev.map(s => s.id === updated.id ? updated : s));
  const handleDeleteSubject = (id: string) => {
    setSubjects((prev: Subject[]) => prev.filter(s => s.id !== id));
    setCourses((prev: Course[]) => prev.map(c => ({ ...c, subjects: c.subjects.filter(cs => cs.subjectId !== id) })));
  };
  
  const handleAssignSubjectToCourse = (courseId: string, subjectId: string) => {
    setCourses((prev: Course[]) => prev.map(c => {
      if (c.id === courseId && !c.subjects.some(cs => cs.subjectId === subjectId)) {
        return { ...c, subjects: [...c.subjects, { subjectId, workedContent: { '1': '', '2': '', '3': '', 'final': '' } }] };
      }
      return c;
    }));
    // Update existing students
    setClassGroups((prev: ClassGroup[]) => prev.map(cg => {
      if (cg.courseId === courseId) {
          return {
              ...cg,
              students: cg.students.map(s => {
                  const newEvals = { ...s.evaluations };
                  TRIMESTERS.forEach(t => {
                      if (!newEvals[t.id].subjects.some((ss: any) => ss.subjectId === subjectId)) {
                          newEvals[t.id].subjects.push({ subjectId, grade: Grade.Satisfactori, comment: { notes: '', report: '' } });
                      }
                  });
                  return { ...s, evaluations: newEvals };
              })
          };
      }
      return cg;
    }));
  };

  const handleUnassignSubjectFromCourse = (courseId: string, subjectId: string) => {
    setCourses((prev: Course[]) => prev.map(c => c.id === courseId ? { ...c, subjects: c.subjects.filter(cs => cs.subjectId !== subjectId) } : c));
    setClassGroups((prev: ClassGroup[]) => prev.map(cg => {
      if (cg.courseId === courseId) {
         return {
             ...cg,
             students: cg.students.map(s => {
                 const newEvals = { ...s.evaluations };
                 TRIMESTERS.forEach(t => {
                     newEvals[t.id].subjects = newEvals[t.id].subjects.filter((ss: any) => ss.subjectId !== subjectId);
                 });
                 return { ...s, evaluations: newEvals };
             })
         };
      }
      return cg;
    }));
  };

  const handleUpdateCourseSubjectContent = (courseId: string, subjectId: string, workedContent: string) => {
      // Legacy compatibility
  };

  const handleUpdateCourseSubjectContentTrimester = (courseId: string, subjectId: string, trimester: Trimester, content: string) => {
      setCourses((prev: Course[]) => prev.map(c => {
          if (c.id === courseId) {
              return {
                  ...c,
                  subjects: c.subjects.map(cs => 
                      cs.subjectId === subjectId 
                      ? { ...cs, workedContent: { ...cs.workedContent, [trimester]: content } }
                      : cs
                  )
              };
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
      return { 
          id: cs.subjectId, 
          name: subjectInfo?.name ?? 'Desconegut', 
          workedContent: cs.workedContent 
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedClassGroup, courses, subjects]);

  const handleGenerateAllReports = async () => {
    if (!selectedClassGroup || currentStudents.length === 0) return;
    
    const trimester = window.prompt("Quin trimestre vols generar? (1, 2, 3 o final)", "1")?.toLowerCase();
    if (!['1', '2', '3', 'final'].includes(trimester || '')) {
        if(trimester) alert("Trimestre no vàlid.");
        return;
    }

    setIsGeneratingAll(true);
    try {
        const t = trimester as Trimester;
        const updatedStudents = await generateMissingReportsForClass(currentStudents, resolvedSubjectsForSelectedClass, t, styleExamples);
        const updatedGroups = classGroups.map(cg => cg.id === selectedClassGroupId ? { ...cg, students: updatedStudents } : cg);
        setClassGroups(updatedGroups);
    } catch (error: any) {
        alert(error.message);
    } finally {
        setIsGeneratingAll(false);
    }
  };

  const handleExport = () => {
    if (!selectedClassGroup || currentStudents.length === 0) return;
    const trimester = window.prompt("Quin trimestre vols exportar? (1, 2, 3 o final)", "1")?.toLowerCase();
    if (!['1', '2', '3', 'final'].includes(trimester || '')) return;

    try {
        const content = generateHtmlForExport(selectedClassGroup.name, currentStudents, resolvedSubjectsForSelectedClass, trimester as Trimester);
        navigator.clipboard.writeText(content).then(() => {
            setCopySuccess('Copiat!');
            setTimeout(() => setCopySuccess(''), 3000);
        });
    } catch (error) {
        console.error(error);
    }
  };

  if (!session) return <AuthComponent />;
  if (isLoadingData) return <div className="h-screen flex items-center justify-center">Carregant...</div>;

  if (viewMode === 'settings') {
    return (
      <SettingsPage
        courses={courses}
        classGroups={classGroups}
        subjects={subjects}
        styleExamples={styleExamples}
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
        onUpdateCourseSubjectContentTrimester={handleUpdateCourseSubjectContentTrimester}
        onUpdateStyleExamples={setStyleExamples}
        onBack={() => setViewMode('main')}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F5F9] relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-200/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-3xl"></div>
      </div>

      <aside className="w-20 flex-shrink-0 z-20 flex flex-col items-center py-8 gap-8 glass-effect border-r border-white/20">
         <div className="p-3 bg-slate-900 rounded-2xl text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
         </div>
         <nav className="flex flex-col gap-6 w-full items-center">
            <button onClick={() => setViewMode('main')} className={`p-3 rounded-2xl transition-all ${viewMode === 'main' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:bg-white/50'}`}><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></button>
            <button onClick={() => setViewMode('settings')} className={`p-3 rounded-2xl transition-all ${viewMode === 'settings' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:bg-white/50'}`}><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
         </nav>
         <div className="mt-auto pb-4">
             <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
         </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 z-10 p-6 md:p-8 gap-8 overflow-hidden">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
          <div>
             <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{isSaving ? <span className="animate-pulse text-indigo-600">Guardant canvis...</span> : 'Avaluació'}</h1>
             <p className="text-slate-500 mt-1">{session.user.email}</p>
          </div>
          <div className="flex items-center gap-8">
             <div className="hidden md:block text-right">
                <p className="text-sm text-slate-400">Alumnes</p>
                <p className="text-xl font-bold">{currentStudents.length}</p>
             </div>
             <button onClick={handleGenerateAllReports} disabled={isGeneratingAll} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-full font-medium shadow-lg transition-all disabled:opacity-50">
                 {isGeneratingAll ? 'Generant...' : 'Generar Global'}
             </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col gap-6 min-h-0">
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
                <div className="lg:col-span-4 flex flex-col min-h-0">
                    <StudentList 
                        students={currentStudents}
                        onAddStudent={handleAddStudent}
                        onSelectStudent={setSelectedStudentId}
                        selectedStudentId={selectedStudentId}
                        onReorderStudents={handleReorderStudents}
                        onDeleteStudent={(id) => handleDeleteStudent(selectedClassGroup.id, id)}
                    />
                    <div className="mt-4 flex gap-2">
                        <button onClick={handleExport} className="flex-1 bg-white/50 hover:bg-white text-slate-700 py-3 rounded-2xl font-medium transition-colors border border-white shadow-sm flex items-center justify-center gap-2">
                            Exportar
                        </button>
                    </div>
                     {copySuccess && <div className="mt-2 text-center text-xs font-bold text-green-600 animate-pulse">{copySuccess}</div>}
                </div>
                <div className="lg:col-span-8 flex flex-col min-h-0 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                    {selectedStudent ? (
                        <StudentDetail 
                          student={selectedStudent}
                          classSubjects={resolvedSubjectsForSelectedClass}
                          onUpdateStudent={handleUpdateStudent}
                          styleExamples={styleExamples}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10 text-slate-400">
                            <p>Selecciona un alumne</p>
                        </div>
                    )}
                </div>
             </div>
           ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center">
                   <h2 className="text-2xl font-bold">Benvingut</h2>
                   <p className="text-slate-500">Selecciona o crea una classe.</p>
               </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default App;
