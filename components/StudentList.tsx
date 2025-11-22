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
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 flex-1 flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-6 px-2">
        <div>
            <h2 className="text-xl font-bold text-slate-800">Alumnat</h2>
            <p className="text-xs text-slate-400 mt-1">Llistat de classe</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
            {students.length}
        </div>
      </div>
      
      <ul className="space-y-3 overflow-y-auto flex-1 pr-2 no-scrollbar">
        {students.map(student => {
          const isSelected = selectedStudentId === student.id;
          return (
          <li key={student.id}>
            <button
              onClick={() => onSelectStudent(student.id)}
              className={`w-full text-left px-5 py-4 rounded-3xl transition-all duration-200 flex items-center justify-between group ${
                isSelected 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                : 'bg-slate-50 hover:bg-indigo-50 text-slate-700'
              }`}
            >
              <span className={`font-medium ${isSelected ? 'text-white' : 'group-hover:text-indigo-700'}`}>{student.name}</span>
              {isSelected && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          </li>
        )})}
      </ul>
      
      {isAdding ? (
        <div className="mt-4 p-4 bg-slate-50 rounded-3xl border border-indigo-100">
          <div className="flex items-center gap-2 mb-3">
             <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nom..."
              className="w-full p-2 bg-white border-none rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
              autoFocus
            />
            <SpeechToTextButton onTranscript={setNewName} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={handleCancelAdd} className="text-xs font-medium text-slate-500 px-3 py-1 hover:text-slate-700">Cancel</button>
            <button onClick={handleConfirmAdd} className="text-xs font-medium bg-indigo-600 text-white px-4 py-1.5 rounded-full hover:bg-indigo-700">Afegir</button>
          </div>
        </div>
      ) : (
        <button
            onClick={handleAddClick}
            className="w-full mt-4 py-3 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
        >
            <span>+ Afegir Alumne</span>
        </button>
      )}
    </div>
  );
};

export default StudentList;