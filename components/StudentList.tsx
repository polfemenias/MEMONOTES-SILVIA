import React, { useState } from 'react';
import type { Student } from '../types';
import SpeechToTextButton from './SpeechToTextButton';

interface StudentListProps {
  students: Student[];
  onAddStudent: (name: string) => void;
  onSelectStudent: (id: string) => void;
  selectedStudentId: string | null;
  onReorderStudents: (fromIndex: number, toIndex: number) => void;
  onDeleteStudent: (id: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ 
    students, 
    onAddStudent, 
    onSelectStudent, 
    selectedStudentId,
    onReorderStudents,
    onDeleteStudent
}) => {
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

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault(); 
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const dragIndexStr = e.dataTransfer.getData('text/plain');
    if (!dragIndexStr) return;
    
    const dragIndex = parseInt(dragIndexStr, 10);
    if (!isNaN(dragIndex) && dragIndex !== dropIndex) {
        onReorderStudents(dragIndex, dropIndex);
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
        {students.map((student, index) => {
          const isSelected = selectedStudentId === student.id;
          return (
          <li 
            key={student.id} 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <button
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onClick={() => onSelectStudent(student.id)}
              className={`w-full text-left px-5 py-4 rounded-3xl transition-all duration-200 flex items-center justify-between group relative ${
                isSelected 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                : 'bg-slate-50 hover:bg-indigo-50 text-slate-700'
              }`}
            >
               <div className="flex items-center gap-2 overflow-hidden pointer-events-none">
                 <span className="p-1 opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" /></svg>
                 </span>
                 <span className={`font-medium truncate ${isSelected ? 'text-white' : 'group-hover:text-indigo-700'}`}>{student.name}</span>
               </div>
              
              <div className="flex items-center gap-2">
                {isSelected && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
                 <div 
                    onClick={(e) => { e.stopPropagation(); onDeleteStudent(student.id); }}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer pointer-events-auto ${isSelected ? 'text-indigo-300 hover:text-white hover:bg-indigo-500' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                 </div>
              </div>
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