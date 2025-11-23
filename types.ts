
export enum Grade {
  Excelent = 'Assoliment Excel·lent',
  Notable = 'Assoliment Notable',
  Satisfactori = 'Assoliment Satisfactori',
  NoAssolit = 'No Assolit',
}

export interface AITextField {
  notes: string;
  report: string;
}

export type Trimester = '1' | '2' | '3' | 'final';

export const TRIMESTERS: { id: Trimester; label: string }[] = [
    { id: '1', label: '1r Trimestre' },
    { id: '2', label: '2n Trimestre' },
    { id: '3', label: '3r Trimestre' },
    { id: 'final', label: 'Final de Curs' },
];

export interface CourseSubject {
  subjectId: string;
  // Ara el contingut treballat depèn del trimestre
  workedContent: Record<Trimester, string>;
}

export interface StudentSubject {
  subjectId: string;
  grade: Grade;
  comment: AITextField;
  customWorkedContent?: string; // Adaptació específica (PI) per a aquest trimestre
}

export interface EvaluationData {
    personalAspects: AITextField;
    generalComment: AITextField;
    subjects: StudentSubject[];
}

export interface Student {
  id: string;
  name: string;
  // Estructura niada per trimestre
  evaluations: Record<Trimester, EvaluationData>;
}

export interface Subject {
  id: string;
  name: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  courseId: string;
  students: Student[];
}

export interface Course {
    id: string;
    name: string;
    subjects: CourseSubject[];
}

export interface AppData {
    courses: Course[];
    classGroups: ClassGroup[];
    subjects: Subject[];
    styleExamples?: string; // Added style preference
}
