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

export interface StudentSubject {
  subjectId: string;
  grade: Grade;
  comment: AITextField;
}

export interface Student {
  id: string;
  name: string;
  personalAspects: AITextField;
  generalComment: AITextField;
  subjects: StudentSubject[];
}

export interface Subject {
  id: string;
  name: string;
  workedContent: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  students: Student[];
}