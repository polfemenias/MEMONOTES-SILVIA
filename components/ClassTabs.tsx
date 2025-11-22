import React from 'react';
import type { ClassGroup, Course } from '../types';

interface ClassTabsProps {
  courses: Course[];
  classGroups: ClassGroup[];
  selectedClassGroupId: string | null;
  onSelectClassGroup: (id: string) => void;
}

const ClassTabs: React.FC<ClassTabsProps> = ({ courses, classGroups, selectedClassGroupId, onSelectClassGroup }) => {
  
  // Ordena els cursos alfabèticament
  const sortedCourses = [...courses].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="w-full overflow-x-auto pb-2 no-scrollbar">
      <div className="flex items-center gap-6 min-w-max">
        {sortedCourses.map(course => {
          const classesInCourse = classGroups
            .filter(cg => cg.courseId === course.id)
            .sort((a, b) => a.name.localeCompare(b.name));
            
          if (classesInCourse.length === 0) return null;

          return (
            <div key={course.id} className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider mr-1">{course.name}</span>
              {classesInCourse.map(cg => {
                  const isSelected = selectedClassGroupId === cg.id;
                  return (
                  <button
                    key={cg.id}
                    onClick={() => onSelectClassGroup(cg.id)}
                    className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                        : 'bg-white text-slate-600 border-transparent shadow-sm hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    {cg.name}
                  </button>
                )})}
              <div className="w-px h-6 bg-slate-200 mx-2"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClassTabs;