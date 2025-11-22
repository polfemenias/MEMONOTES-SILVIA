import React from 'react';
import type { ClassGroup, Course } from '../types';

interface ClassTabsProps {
  courses: Course[];
  classGroups: ClassGroup[];
  selectedClassGroupId: string | null;
  onSelectClassGroup: (id: string) => void;
  onReorderClassGroups: (fromIndex: number, toIndex: number) => void;
  onDeleteClassGroup: (id: string) => void;
}

const ClassTabs: React.FC<ClassTabsProps> = ({ 
    courses, 
    classGroups, 
    selectedClassGroupId, 
    onSelectClassGroup,
    onReorderClassGroups,
    onDeleteClassGroup
}) => {
  
  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>, dropIndex: number) => {
    e.preventDefault();
    const dragIndexStr = e.dataTransfer.getData('text/plain');
    if (!dragIndexStr) return;
    
    const dragIndex = parseInt(dragIndexStr, 10);
    if (!isNaN(dragIndex) && dragIndex !== dropIndex) {
        onReorderClassGroups(dragIndex, dropIndex);
    }
  };

  // Helper per obtenir el nom del curs
  const getCourseName = (courseId: string) => {
      const course = courses.find(c => c.id === courseId);
      return course ? course.name : '...';
  };

  return (
    <div className="w-full overflow-x-auto pb-2 no-scrollbar">
      <div className="flex items-center gap-3 min-w-max px-1">
        {classGroups.map((cg, index) => {
          const isSelected = selectedClassGroupId === cg.id;
          const courseName = getCourseName(cg.courseId);
          
          return (
            <div key={cg.id} className="relative group">
              <button
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => onSelectClassGroup(cg.id)}
                  className={`flex flex-col items-start px-6 py-2.5 rounded-2xl transition-all duration-200 border cursor-pointer select-none text-left min-w-[140px] ${
                  isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 pr-10 transform scale-105'
                      : 'bg-white text-slate-600 border-transparent shadow-sm hover:bg-indigo-50 hover:text-indigo-600 group-hover:pr-10'
                  }`}
              >
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider mb-0.5 opacity-80 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {courseName}
                  </span>
                  <span className="text-base font-bold leading-tight truncate w-full">
                    {cg.name}
                  </span>
              </button>
              <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteClassGroup(cg.id); }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-red-100 hover:text-red-500 transition-all z-10 ${isSelected ? 'text-indigo-300 hover:text-white hover:bg-red-500' : 'text-slate-300 hidden group-hover:block'}`}
                  title="Esborrar classe"
              >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
              </button>
            </div>
          );
        })}
        {classGroups.length === 0 && (
            <div className="text-sm text-slate-400 italic p-4 border-2 border-dashed border-slate-200 rounded-2xl">
                Crea una classe a Configuració per començar
            </div>
        )}
      </div>
    </div>
  );
};

export default ClassTabs;