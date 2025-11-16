
import React, { useState, useMemo, useEffect } from 'react';
import type { Student, Subject, ClassGroup, StudentSubject } from './types';
import { Grade } from './types';
import StudentList from './components/StudentList';
import StudentDetail from './components/StudentDetail';
import ClassTabs from './components/ClassTabs';
import SettingsPage from './components/SettingsPage';
import { generateTextForExport, generateHtmlForExport } from './services/exportService';
import { generateMissingReportsForClass } from './services/geminiService';
import { getInitialData } from './data/initialData';

const App: React.FC = () => {
  const { initialClassGroups, initialSubjects } = useMemo(() => getInitialData(), []);

  const [classGroups, setClassGroups] = useState<ClassGroup[]>(initialClassGroups);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [viewMode, setViewMode] = useState<'main' | 'settings'>('main');
  
  const [selectedClassGroupId, setSelectedClassGroupId] = useState<string | null>(initialClassGroups[0]?.id ?? null);
  
  const selectedClassGroup = useMemo(() => classGroups.find(cg => cg.id === selectedClassGroupId), [classGroups, selectedClassGroupId]);
  const currentStudents = useMemo(() => selectedClassGroup?.students ?? [], [selectedClassGroup]);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialClassGroups[0]?.students[0]?.id ?? null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSelectClassGroup = (id: string) => {
    setSelectedClassGroupId(id);
    const newClassGroup = classGroups.find(cg => cg.id === id);
    setSelectedStudentId(newClassGroup?.students[0]?.id ?? null);
  };

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
  };
  
  const handleAddClassGroup = async (name: string) => {
    const newClassGroup: ClassGroup = { 
      id: crypto.randomUUID(), 
      name: name, 
      students: [] 
    };
    const updatedClassGroups = [...classGroups, newClassGroup];
    setClassGroups(updatedClassGroups);
    setSelectedClassGroupId(newClassGroup.id);
    setSelectedStudentId(null);
  };
  
  const handleUpdateClassGroup = async (id: string, name: string) => {
    setClassGroups(prev => prev.map(cg => cg.id === id ? { ...cg, name } : cg));
  };

  const handleDeleteClassGroup = async (id: string) => {
    const newClassGroups = classGroups.filter(cg => cg.id !== id);
    setClassGroups(newClassGroups);
    if (selectedClassGroupId === id) {
      const newSelectedId = newClassGroups.length > 0 ? newClassGroups[0].id : null;
      setSelectedClassGroupId(newSelectedId);
      const newClass = newClassGroups.find(cg => cg.id === newSelectedId);
      setSelectedStudentId(newClass?.students[0]?.id ?? null);
    }
  };

  const handleAddStudent = async (name: string) => {
    if (!selectedClassGroupId) return;
    
    const newStudent: Student = {
        id: crypto.randomUUID(),
        name,
        personalAspects: { notes: '', report: '' },
        generalComment: { notes: '', report: '' },
        subjects: subjects.map(s => ({
            subjectId: s.id,
            grade: Grade.Satisfactori,
            comment: { notes: '', report: '' },
        })),
    };

    setClassGroups(prev => prev.map(cg => 
      cg.id === selectedClassGroupId 
        ? { ...cg, students: [...cg.students, newStudent] }
        : cg
    ));
    setSelectedStudentId(newStudent.id);
  };

  const handleAddMultipleStudents = async (classGroupId: string, names: string[]) => {
      let updatedGroups = [...classGroups];
      
      const classIndex = updatedGroups.findIndex(cg => cg.id === classGroupId);
      if (classIndex === -1) return;

      const newStudents: Student[] = names.map(name => ({
          id: crypto.randomUUID(),
          name,
          personalAspects: { notes: '', report: '' },
          generalComment: { notes: '', report: '' },
          subjects: subjects.map(s => ({
              subjectId: s.id,
              grade: Grade.Satisfactori,
              comment: { notes: '', report: '' },
          })),
      }));

      updatedGroups[classIndex].students.push(...newStudents);
      setClassGroups(updatedGroups);
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
      setClassGroups(prev => prev.map(cg => ({
          ...cg,
          students: cg.students.map(s => s.id === updatedStudent.id ? updatedStudent : s)
      })));
  };

  const handleDeleteStudent = async (classGroupId: string, studentId: string) => {
    let originalIndex = -1;
    const classGroup = classGroups.find(cg => cg.id === classGroupId);
    if (classGroup) originalIndex = classGroup.students.findIndex(s => s.id === studentId);

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

  const handleAddSubject = async (subjectName: string) => {
    const newSubject: Subject = {
      id: crypto.randomUUID(),
      name: subjectName,
      workedContent: '',
    };
    setSubjects(prev => [...prev, newSubject]);

    // Add the new subject to every existing student
    setClassGroups(prevGroups => prevGroups.map(cg => ({
      ...cg,
      students: cg.students.map(student => ({
        ...student,
        subjects: [
          ...student.subjects,
          {
            subjectId: newSubject.id,
            grade: Grade.Satisfactori,
            comment: { notes: '', report: '' },
          },
        ],
      })),
    })));
  };
  
  const handleUpdateSubject = async (updatedSubject: Subject) => {
    setSubjects(prev => prev.map(s => s.id === updatedSubject.id ? updatedSubject : s));
  };

  const handleDeleteSubject = async (subjectId: string) => {
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
    // Remove the subject from all students
    setClassGroups(prevGroups => prevGroups.map(cg => ({
      ...cg,
      students: cg.students.map(student => ({
        ...student,
        subjects: student.subjects.filter(ss => ss.subjectId !== subjectId),
      })),
    })));
  };

  const handleCopyToClipboard = async () => {
    if (!selectedClassGroup) return;
    setIsExporting(true);

    try {
        const updatedStudents = await generateMissingReportsForClass(selectedClassGroup.students, subjects);
        
        const updatedClassGroup = { ...selectedClassGroup, students: updatedStudents };
        
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
        alert("Hi ha hagut un error en generar o copiar els informes. Revisa la configuració de la clau de Gemini.");
    } finally {
        setIsExporting(false);
    }
  };

  const selectedStudent = useMemo(() => currentStudents.find(s => s.id === selectedStudentId), [currentStudents, selectedStudentId]);

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
        </div>
        {selectedClassGroup && selectedClassGroup.students.length > 0 && (
           <button
            onClick={handleCopyToClipboard}
            disabled={isExporting}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${ copySuccess ? 'bg-green-600 text-white' : isExporting ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700' }`} >
            {isExporting ? (
                 <><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generant informes pendents...</>
            ) : copySuccess ? 'Copiat al porta-retalls!' : 'Copiar Informes per a Esfera'}
          </button>
        )}
      </header>
      <main className="p-4 md:p-8">
        {!selectedClassGroupId && classGroups.length > 0 && (
          <div className="text-center p-10 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold">Selecciona una classe per començar.</h2>
          </div>
        )}
        {classGroups.length === 0 && (
            <div className="text-center p-10 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Benvingut/da!</h2>
                <p className="text-slate-600 mb-6">Sembla que encara no tens cap classe. Comença afegint-ne una.</p>
                <ClassTabs 
                    classGroups={classGroups}
                    selectedClassGroupId={selectedClassGroupId}
                    onSelectClassGroup={handleSelectClassGroup}
                    onAddClassGroup={handleAddClassGroup}
                />
            </div>
        )}
        {selectedClassGroupId && (
          <>
            <div className="mb-6">
                <ClassTabs 
                    classGroups={classGroups}
                    selectedClassGroupId={selectedClassGroupId}
                    onSelectClassGroup={handleSelectClassGroup}
                    onAddClassGroup={handleAddClassGroup}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
              <div className="md:col-span-1 lg:col-span-1">
                <StudentList 
                    students={currentStudents} 
                    onAddStudent={handleAddStudent} 
                    onSelectStudent={handleSelectStudent}
                    selectedStudentId={selectedStudentId}
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                {selectedStudent ? (
                  <StudentDetail 
                    student={selectedStudent} 
                    subjects={subjects} 
                    onUpdateStudent={handleUpdateStudent}
                    onUpdateSubject={handleUpdateSubject}
                    onAddSubject={handleAddSubject}
                  />
                ) : (
                    <div className="h-full flex items-center justify-center bg-white rounded-lg shadow p-10">
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-slate-700">
                                {currentStudents.length > 0 ? 'Selecciona un/a alumne/a' : 'Afegeix un/a alumne/a per començar'}
                            </h3>
                            <p className="text-slate-500 mt-2">
                                {currentStudents.length > 0 
                                    ? 'Fes clic en un nom de la llista per veure i editar els seus informes.' 
                                    : 'Utilitza el botó "Afegir Alumne/a" a l\'esquerra per poblar la teva classe.'
                                }
                            </p>
                        </div>
                    </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
