import React, { useState, useRef } from 'react';
import type { ClassGroup, Subject, Student } from '../types';
import EditableListItem from './EditableListItem';
import StudentDictation from './StudentDictation';
import { useAutoResizeTextArea } from '../hooks/useAutoResizeTextArea';


interface SettingsPageProps {
  classGroups: ClassGroup[];
  subjects: Subject[];
  onAddClassGroup: (name: string) => void;
  onUpdateClassGroup: (id: string, name: string) => void;
  onDeleteClassGroup: (id: string) => void;
  onAddMultipleStudents: (classGroupId: string, names: string[]) => void;
  onDeleteStudent: (classGroupId: string, studentId: string) => void;
  onUpdateStudent: (student: Student) => void; // Pass this down
  onAddSubject: (name: string) => void;
  onUpdateSubject: (subject: Subject) => void;
  onDeleteSubject: (id: string) => void;
  onBack: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>('classes');
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [pastedNames, setPastedNames] = useState('');
  const [importTargetClassId, setImportTargetClassId] = useState<string | null>(null);
  const importTextAreaRef = useRef<HTMLTextAreaElement>(null);

  useAutoResizeTextArea(importTextAreaRef, pastedNames);


  const handleToggleExpand = (classId: string) => {
    setExpandedClassId(prevId => (prevId === classId ? null : classId));
  };
  
  const handleUpdateStudentName = (student: Student, newName: string) => {
    props.onUpdateStudent({ ...student, name: newName });
  };
  
  const handleConfirmImport = () => {
    if (!importTargetClassId) return;

    const names = pastedNames
        .split('\n')
        .map(name => name.trim().toUpperCase())
        .filter(name => name !== '');

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
              onClick={() => setActiveTab('classes')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'classes'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Classes i Alumnes
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subjects'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Assignatures
            </button>
          </nav>
        </div>

        {activeTab === 'classes' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Gestió de Classes</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <ul className="space-y-4">
                {props.classGroups.map(cg => (
                  <li key={cg.id} className="border p-4 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between">
                       <EditableListItem
                          item={{id: cg.id, name: cg.name}}
                          onUpdate={props.onUpdateClassGroup}
                          onDelete={props.onDeleteClassGroup}
                        />
                       <button onClick={() => handleToggleExpand(cg.id)} className="p-2 rounded-full hover:bg-slate-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform ${expandedClassId === cg.id ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 15.25a1 1 0 01-.71-.29l-4-4a1 1 0 111.42-1.42L12 12.84l3.29-3.3a1 1 0 111.42 1.42l-4 4a1 1 0 01-.71.29z"/>
                          </svg>
                       </button>
                    </div>
                    {expandedClassId === cg.id && (
                        <div className="mt-4 pt-4 pl-6 border-l-2 border-sky-200">
                            <h4 className="font-semibold mb-3">Alumnes de {cg.name}</h4>
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
                            <div className="mt-4 border-t pt-4 flex items-center gap-6">
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
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                  <EditableListItem isAdding onAdd={props.onAddClassGroup} addLabel="Afegir nova classe" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Gestió d'Assignatures</h2>
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
                  <EditableListItem isAdding onAdd={props.onAddSubject} addLabel="Afegir nova assignatura" />
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
                <textarea
                    ref={importTextAreaRef}
                    value={pastedNames}
                    onChange={(e) => setPastedNames(e.target.value)}
                    rows={8}
                    className="w-full p-2 border rounded-md resize-none overflow-hidden"
                    placeholder={`LAURA PÉREZ\nMARC SOLER\n...`}
                    autoFocus
                />
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