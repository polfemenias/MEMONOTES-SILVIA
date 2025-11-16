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
    <div className="bg-white rounded-lg shadow p-4">
      <nav className="space-y-4">
        {sortedCourses.map(course => {
          const classesInCourse = classGroups
            .filter(cg => cg.courseId === course.id)
            .sort((a, b) => a.name.localeCompare(b.name));
            
          if (classesInCourse.length === 0) return null;

          return (
            <div key={course.id}>
              <h3 className="text-xs font-bold uppercase text-slate-500 mb-2 px-1">{course.name}</h3>
              <div className="flex flex-wrap items-center gap-2">
                {classesInCourse.map(cg => (
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
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default ClassTabs;
