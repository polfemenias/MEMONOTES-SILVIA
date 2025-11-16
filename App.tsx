import React, { useState, useMemo, useEffect } from 'react';
import type { Student, Subject, ClassGroup } from './types';
import { Grade } from './types';
import StudentList from './components/StudentList';
import StudentDetail from './components/StudentDetail';
import ClassTabs from './components/ClassTabs';
import SettingsPage from './components/SettingsPage';
import AuthComponent from './components/Auth';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { generateTextForExport, generateHtmlForExport } from './services/exportService';
import { generateMissingReportsForClass } from './services/geminiService';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [viewMode, setViewMode] = useState<'main' | 'settings'>('main');
  
  const [selectedClassGroupId, setSelectedClassGroupId] = useState<string | null>(null);
  
  const selectedClassGroup = useMemo(() => classGroups.find(cg => cg.id === selectedClassGroupId), [classGroups, selectedClassGroupId]);
  const currentStudents = useMemo(() => selectedClassGroup?.students ?? [], [selectedClassGroup]);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Data Fetching from Supabase ---
  useEffect(() => {
    if (session) {
      fetchData();
    } else {
      // Clear data on logout
      setClassGroups([]);
      setSubjects([]);
      setSelectedClassGroupId(null);
      setSelectedStudentId(null);
    }
  }, [session]);

  const fetchData = async () => {
    if (!session) return;
    setLoading(true);
    try {
      // Fetch classes
      const { data: classData, error: classError } = await supabase
        .from('class_groups')
        .select(`*, students(*, student_subjects(*))`)
        .order('created_at', { ascending: true });
      if (classError) throw classError;

      // Fetch subjects
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: true });
      if (subjectError) throw subjectError;

      // Map Supabase data to our application types
      const fetchedSubjects: Subject[] = subjectData.map(s => ({
        id: s.id,
        name: s.name,
        workedContent: s.worked_content || '',
      }));
      setSubjects(fetchedSubjects);

      const fetchedClasses: ClassGroup[] = classData.map(cg => ({
        id: cg.id,
        name: cg.name,
        students: cg.students.map((s: any) => ({
          id: s.id,
          name: s.name,
          personalAspects: s.personal_aspects,
          generalComment: s.general_comment,
          subjects: s.student_subjects.map((ss: any) => ({
            subjectId: ss.subject_id,
            grade: ss.grade,
            comment: ss.comment,
          }))
        }))
      }));
      setClassGroups(fetchedClasses);

      if (fetchedClasses.length > 0 && !selectedClassGroupId) {
        setSelectedClassGroupId(fetchedClasses[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Funcions de navegació i selecció ---
  const handleSelectClassGroup = (id: string) => {
    setSelectedClassGroupId(id);
    const newClassGroup = classGroups.find(cg => cg.id === id);
    setSelectedStudentId(newClassGroup?.students[0]?.id ?? null);
  };

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
  };
  
  // --- Gestió de Classes (des de Settings) ---
  const handleAddClassGroup = async (name: string) => {
    if (!session) return;
    const { data, error } = await supabase
      .from('class_groups')
      .insert({ name: name, user_id: session.user.id })
      .select()
      .single();

    if (error) {
      console.error("Error adding class group:", error);
    } else if (data) {
      const newClassGroup: ClassGroup = { id: data.id, name: data.name, students: [] };
      setClassGroups(prev => [...prev, newClassGroup]);
       if (viewMode === 'main') {
         setSelectedClassGroupId(newClassGroup.id);
         setSelectedStudentId(null);
       }
    }
  };
  
  const handleUpdateClassGroup = async (id: string, name: string) => {
    const { error } = await supabase.from('class_groups').update({ name }).eq('id', id);
    if (error) console.error("Error updating class group:", error);
    else setClassGroups(prev => prev.map(cg => cg.id === id ? { ...cg, name } : cg));
  };

  const handleDeleteClassGroup = async (id: string) => {
    const { error } = await supabase.from('class_groups').delete().eq('id', id);
    if (error) console.error("Error deleting class group:", error);
    else {
      const newClassGroups = classGroups.filter(cg => cg.id !== id);
      setClassGroups(newClassGroups);
      if (selectedClassGroupId === id) {
        setSelectedClassGroupId(newClassGroups.length > 0 ? newClassGroups[0].id : null);
      }
    }
  };

  // --- Gestió d'Alumnes ---
  const handleAddStudent = async (name: string) => {
    if (!selectedClassGroupId) return;
    
    const studentPayload = {
        name,
        class_group_id: selectedClassGroupId,
        personal_aspects: { notes: '', report: '' },
        general_comment: { notes: '', report: '' },
    };

    const { data: newStudentData, error: studentError } = await supabase
        .from('students')
        .insert(studentPayload)
        .select()
        .single();
    
    if (studentError) {
        console.error("Error afegint alumne:", studentError);
        return;
    }

    const newStudent: Student = {
        id: newStudentData.id,
        name: newStudentData.name,
        personalAspects: newStudentData.personal_aspects,
        generalComment: newStudentData.general_comment,
        subjects: [],
    };

    // Add subjects relations
    const studentSubjectsPayload = subjects.map(s => ({
        student_id: newStudent.id,
        subject_id: s.id,
        grade: Grade.Satisfactori,
        comment: { notes: '', report: '' },
    }));

    if(studentSubjectsPayload.length > 0){
        const { error: subjectsError } = await supabase
            .from('student_subjects')
            .insert(studentSubjectsPayload);

        if (subjectsError) {
            console.error("Error afegint relacions d'assignatures:", subjectsError);
            // Optional: delete the student if subject relations fail
            await supabase.from('students').delete().eq('id', newStudent.id);
            return;
        }
        newStudent.subjects = studentSubjectsPayload.map(ss => ({
            subjectId: ss.subject_id,
            grade: ss.grade,
            comment: ss.comment
        }));
    }

    setClassGroups(prev => prev.map(cg => 
      cg.id === selectedClassGroupId 
        ? { ...cg, students: [...cg.students, newStudent] }
        : cg
    ));
    setSelectedStudentId(newStudent.id);
  };

  const handleAddMultipleStudents = async (classGroupId: string, names: string[]) => {
      // This function now needs to be async and interact with Supabase
      // For simplicity, we can call handleAddStudent for each name.
      // A more optimized version would use a bulk insert.
      for (const name of names) {
          await handleAddStudent(name); // Temporarily select the class to add
      }
      // Re-fetch data to ensure consistency
      fetchData();
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
      // 1. Update student's own fields
      const { error: studentError } = await supabase
          .from('students')
          .update({
              name: updatedStudent.name,
              personal_aspects: updatedStudent.personalAspects,
              general_comment: updatedStudent.generalComment,
          })
          .eq('id', updatedStudent.id);
      if (studentError) console.error("Error updating student:", studentError);

      // 2. Update subject relations (upsert)
      const studentSubjectsPayload = updatedStudent.subjects.map(s => ({
          student_id: updatedStudent.id,
          subject_id: s.subjectId,
          grade: s.grade,
          comment: s.comment,
      }));
      
      if(studentSubjectsPayload.length > 0) {
        const { error: subjectsError } = await supabase
          .from('student_subjects')
          .upsert(studentSubjectsPayload);
        if (subjectsError) console.error("Error upserting student subjects:", subjectsError);
      }
      
      // Update local state for immediate UI feedback
      setClassGroups(prev => prev.map(cg => ({
          ...cg,
          students: cg.students.map(s => s.id === updatedStudent.id ? updatedStudent : s)
      })));
  };

  const handleDeleteStudent = async (classGroupId: string, studentId: string) => {
    let originalIndex = -1;
    const classGroup = classGroups.find(cg => cg.id === classGroupId);
    if (classGroup) originalIndex = classGroup.students.findIndex(s => s.id === studentId);

    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if(error) {
        console.error("Error deleting student: ", error);
        return;
    }
    
    const newClassGroups = classGroups.map(cg => {
        if (cg.id === classGroupId) {
            return { ...cg, students: cg.students.filter(s => s.id !== studentId) };
        }
        return cg;
    });
    setClassGroups(newClassGroups);
    
    if (selectedStudentId === studentId && originalIndex !== -1) {
      const updatedStudents = newClassGroups.find(cg => cg.id === classGroupId)?.students || [];
      if (updatedStudents.length > 0) {
        setSelectedStudentId(updatedStudents[Math.min(originalIndex, updatedStudents.length - 1)].id);
      } else {
        setSelectedStudentId(null);
      }
    }
  };

  // --- Gestió d'Assignatures ---
  const handleAddSubject = async (subjectName: string) => {
    if(!session) return;
    const { data, error } = await supabase
        .from('subjects')
        .insert({ name: subjectName, worked_content: '', user_id: session.user.id })
        .select()
        .single();
    if (error) {
        console.error("Error adding subject:", error);
    } else {
        const newSubject: Subject = { id: data.id, name: data.name, workedContent: '' };
        setSubjects(prev => [...prev, newSubject]);
        // Re-fetch all data to add the new subject to all students correctly
        fetchData();
    }
  };
  
  const handleUpdateSubject = async (updatedSubject: Subject) => {
    const { error } = await supabase
        .from('subjects')
        .update({ name: updatedSubject.name, worked_content: updatedSubject.workedContent })
        .eq('id', updatedSubject.id);

    if (error) console.error("Error updating subject:", error);
    else setSubjects(prev => prev.map(s => s.id === updatedSubject.id ? updatedSubject : s));
  };

  const handleDeleteSubject = async (subjectId: string) => {
    const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
    if(error) console.error("Error deleting subject:", error);
    else {
        setSubjects(prev => prev.filter(s => s.id !== subjectId));
        fetchData(); // Re-fetch to update students
    }
  };

  // --- Altres ---
  const handleCopyToClipboard = async () => {
    if (!selectedClassGroup) return;
    setIsExporting(true);

    try {
        const updatedStudents = await generateMissingReportsForClass(selectedClassGroup.students, subjects);
        const updatedClassGroup = { ...selectedClassGroup, students: updatedStudents };
        
        // This mutation should be saved to the database as well
        for (const student of updatedStudents) {
            await handleUpdateStudent(student);
        }
        setClassGroups(prev => prev.map(cg => cg.id === selectedClassGroupId ? updatedClassGroup : cg));

        const plainText = generateTextForExport(updatedClassGroup.name, updatedClassGroup.students, subjects);
        const htmlText = generateHtmlForExport(updatedClassGroup.name, updatedClassGroup.students, subjects);

        navigator.clipboard.write([
            new ClipboardItem({
                "text/plain": new Blob([plainText], { type: "text/plain" }),
                "text/html": new Blob([htmlText], { type: "text/html" }),
            })
        ]).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2500);
        });

    } catch (err) {
        console.error('Error durant el procés d\'exportació: ', err);
        alert("Hi ha hagut un error en generar o copiar els informes.");
    } finally {
        setIsExporting(false);
    }
  };

  const selectedStudent = useMemo(() => currentStudents.find(s => s.id === selectedStudentId), [currentStudents, selectedStudentId]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Carregant...</div>;
  }
  
  if (!session) {
    return <AuthComponent />;
  }

  if (viewMode === 'settings') {
    return (
      <SettingsPage 
        classGroups={classGroups}
        subjects={subjects}
        onAddClassGroup={handleAddClassGroup}
        onUpdateClassGroup={handleUpdateClassGroup}
        onDeleteClassGroup={handleDeleteClassGroup}
        onAddMultipleStudents={handleAddMultipleStudents}
        onDeleteStudent={handleDeleteStudent}
        onUpdateStudent={handleUpdateStudent}
        onAddSubject={handleAddSubject}
        onUpdateSubject={handleUpdateSubject}
        onDeleteSubject={handleDeleteSubject}
        onBack={() => setViewMode('main')}
      />
    );
  }

  return (
    <div className="min-h-screen font-sans text-slate-800">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-sky-700">Assistent de Dictats Esfera</h1>
            <button onClick={() => setViewMode('settings')} className="text-slate-500 hover:text-sky-700" title="Configuració">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
             <button onClick={() => supabase.auth.signOut()} className="text-sm text-slate-600 hover:text-red-600">Tancar sessió</button>
        </div>
        {selectedClassGroup && selectedClassGroup.students.length > 0 && (
           <button
            onClick={handleCopyToClipboard}
            disabled={isExporting}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${ copySuccess ? 'bg-green-600 text-white' : isExporting ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700' }`} >
            {isExporting ? (
                 <><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generant i Copiant...</>
            ) : copySuccess ? (
              <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>Copiat!</>
            ) : (
              <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>Copiar Informes de {selectedClassGroup.name}</>
            )}
          </button>
        )}
      </header>
      
      <main className="p-4 md:p-8">
        <ClassTabs 
          classGroups={classGroups}
          selectedClassGroupId={selectedClassGroupId}
          onSelectClassGroup={handleSelectClassGroup}
          onAddClassGroup={handleAddClassGroup}
        />
        <div className="grid grid-cols-1 lg:grid-cols-4 lg:items-start gap-8 mt-6">
          <div className="lg:col-span-1">
            {selectedClassGroup ? (
              <StudentList 
                students={currentStudents}
                onAddStudent={handleAddStudent}
                onSelectStudent={handleSelectStudent}
                selectedStudentId={selectedStudentId}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-slate-500">Crea una classe a 'Configuració' per començar.</p>
              </div>
            )}
          </div>
          <div className="lg:col-span-3">
            {selectedStudent ? (
              <StudentDetail 
                key={selectedStudent.id}
                student={selectedStudent}
                subjects={subjects}
                onUpdateStudent={handleUpdateStudent}
                onUpdateSubject={handleUpdateSubject}
                onAddSubject={handleAddSubject}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center flex flex-col items-center justify-center h-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  <h2 className="text-xl font-semibold text-slate-600">Benvingut/da!</h2>
                  <p className="text-slate-500 mt-2">
                    {classGroups.length > 0 ? 'Selecciona un alumne o afegeix-ne un de nou per començar.' : 'Crea una classe des de la Configuració per començar a afegir alumnes.'}
                  </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;