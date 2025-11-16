import React, { useState } from 'react';
import type { Student } from '../types';
import SpeechToTextButton from './SpeechToTextButton';

interface StudentListProps {
  students: Student[];
  onAddStudent: (name: string) => void;
  onSelectStudent: (id: string) => void;
  selectedStudentId: string | null;
}

const StudentList: React.FC<StudentListProps> = ({ students, onAddStudent, onSelectStudent, selectedStudentId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAddClick = () => {
    setIsAdding(true);
  };

  const handleConfirmAdd = () => {
    if (newName.trim()) {
      onAddStudent(newName.trim().toUpperCase());
      setNewName('');
      setIsAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setNewName('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmAdd();
    } else if (e.key === 'Escape') {
      handleCancelAdd();
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-lg font-bold">Alumnat</h2>
      </div>
      <ul className="space-y-2">
        {students.map(student => (
          <li key={student.id}>
            <button
              onClick={() => onSelectStudent(student.id)}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                selectedStudentId === student.id 
                ? 'bg-sky-600 text-white font-semibold' 
                : 'bg-slate-100 hover:bg-sky-100'
              }`}
            >
              {student.name}
            </button>
          </li>
        ))}
      </ul>
      {isAdding && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
             <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nom de l'alumne/a..."
              className="w-full p-2 border rounded-md"
              autoFocus
            />
            <SpeechToTextButton onTranscript={setNewName} />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={handleCancelAdd} className="text-sm text-slate-600 hover:text-slate-900">Cancel·lar</button>
            <button onClick={handleConfirmAdd} className="text-sm bg-sky-600 text-white px-3 py-1 rounded-md hover:bg-sky-700">Afegir</button>
          </div>
        </div>
      )}
      <button
        onClick={handleAddClick}
        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Afegir Alumne/a
      </button>

    </div>
  );
};

export default StudentList;