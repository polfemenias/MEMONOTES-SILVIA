import React, { useState } from 'react';
import type { ClassGroup } from '../types';

interface ClassTabsProps {
  classGroups: ClassGroup[];
  selectedClassGroupId: string | null;
  onSelectClassGroup: (id: string) => void;
  onAddClassGroup: (name: string) => void;
}

const ClassTabs: React.FC<ClassTabsProps> = ({ classGroups, selectedClassGroupId, onSelectClassGroup, onAddClassGroup }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const handleConfirmAdd = () => {
    if (newClassName.trim()) {
      onAddClassGroup(newClassName.trim().toUpperCase());
      setNewClassName('');
      setIsAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setNewClassName('');
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
    <div className="bg-white rounded-lg shadow p-2">
      <nav className="flex flex-wrap items-center gap-2">
        {classGroups.map(cg => (
          <button
            key={cg.id}
            onClick={() => onSelectClassGroup(cg.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedClassGroupId === cg.id
                ? 'bg-sky-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-sky-100'
            }`}
          >
            {cg.name}
          </button>
        ))}
         {isAdding ? (
          <div className="p-1 flex items-center gap-2 bg-slate-100 rounded-md">
            <input 
              type="text" 
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="p-1 border rounded-md text-sm"
              placeholder="Nom de la classe"
              autoFocus
            />
            <button onClick={handleConfirmAdd} className="text-green-600 hover:text-green-800 text-xl font-bold">&#x2713;</button>
            <button onClick={handleCancelAdd} className="text-red-600 hover:text-red-800 text-xl font-bold">&times;</button>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)} 
            className="px-3 py-2 text-sky-600 hover:bg-sky-50 rounded-md text-sm flex items-center gap-1"
            title="Afegir una nova classe"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
             </svg>
            Afegir Classe
          </button>
        )}
      </nav>
    </div>
  );
};

export default ClassTabs;