
import type { ClassGroup, Subject, Student, Course, EvaluationData, Trimester, CourseSubject } from '../types';
import { Grade, TRIMESTERS } from '../types';

// Helper para generar contenido de relleno
const generateDefaultContent = (topic: string, trimester: string) => {
  return `Continguts treballats al ${trimester} sobre ${topic}:\n1. Introducció i conceptes bàsics.\n2. Activitats pràctiques i manipulatives.\n3. Treball cooperatiu i individual.\n4. Ús de recursos digitals.\n5. Avaluació del progrés.`;
};

const STUDENT_NAMES = [
  "MARC GARCIA", "JÚLIA MARTÍNEZ", "JAN LÓPEZ", "MARTINA SÁNCHEZ", "NIL RODRÍGUEZ",
  "LAIA FERNÁNDEZ", "POL PÉREZ", "AINA GÓMEZ", "LEO RUIZ", "ONA HERNÁNDEZ",
  "PAU DIAZ", "MARIA MORENO", "BIEL MUÑOZ", "LUCIA ÁLVAREZ", "ARNAU ROMERO",
  "CLÀUDIA ALONSO", "ÈRIC GUTIÉRREZ", "EMMA NAVARRO", "ALEIX TORRES", "ABRIL DOMÍNGUEZ",
  "HUGO VÁZQUEZ", "PAULA RAMOS", "BRUNA GIL", "ELOI SERRA", "SARA MOLINA"
];

export const getInitialData = (): { initialCourses: Course[], initialClassGroups: ClassGroup[]; initialSubjects: Subject[] } => {
  // --- SUBJECTS ---
  const initialSubjects: Subject[] = [
    { id: crypto.randomUUID(), name: 'LLENGUA CATALANA' },
    { id: crypto.randomUUID(), name: 'MATEMÀTIQUES' },
    { id: crypto.randomUUID(), name: 'CONEIXEMENT DEL MEDI' },
    { id: crypto.randomUUID(), name: 'PLÀSTICA' },
    { id: crypto.randomUUID(), name: 'ANGLÈS' },
    { id: crypto.randomUUID(), name: 'EDUCACIÓ FÍSICA' },
  ];

  const [catalan, mates, medi, plastica, angles, edfisica] = initialSubjects;

  // --- HELPER COURSE SUBJECT ---
  const createCourseSubject = (subjectId: string, topic: string): CourseSubject => {
      return {
          subjectId,
          workedContent: {
              '1': generateDefaultContent(topic, '1r Trimestre'),
              '2': generateDefaultContent(topic, '2n Trimestre'),
              '3': generateDefaultContent(topic, '3r Trimestre'),
              'final': `Resum global de ${topic} durant tot el curs.`,
          }
      };
  };

  // --- COURSES ---
  const initialCourses: Course[] = [
    {
      id: crypto.randomUUID(),
      name: 'TERCER',
      subjects: [
        { 
            subjectId: catalan.id, 
            workedContent: {
                '1': `1. Tipologies textuals: la carta i la descripció.\n2. Ortografia: accentuació.\n3. Lectura en veu alta i comprensiva.`,
                '2': `1. Tipologies textuals: el conte i la notícia.\n2. Gramàtica: el nom i l'adjectiu.\n3. Dictats preparats.`,
                '3': `1. Tipologies textuals: el poema i el teatre.\n2. Els verbs.\n3. Expressió oral i exposicions.`,
                'final': `Consolidació de la lectoescriptura i expressió oral.`
            }
        },
        createCourseSubject(mates.id, 'Numeració i Càlcul'),
        createCourseSubject(medi.id, 'Entorn i Natura'),
        createCourseSubject(plastica.id, 'Art i Color'),
        createCourseSubject(edfisica.id, 'Esport i Salut'),
      ]
    },
    {
      id: crypto.randomUUID(),
      name: 'SEGON',
      subjects: [
          createCourseSubject(catalan.id, 'Lectoescriptura'),
          createCourseSubject(mates.id, 'Nombres'),
          createCourseSubject(medi.id, 'Entorn'),
      ]
    },
     {
      id: crypto.randomUUID(),
      name: 'QUART',
      subjects: []
    }
  ];

  // --- CLASS GROUPS ---
  const initialClassGroups: ClassGroup[] = [
    { id: crypto.randomUUID(), name: 'Grup A', courseId: initialCourses[0].id, students: [] },
    { id: crypto.randomUUID(), name: 'Grup B', courseId: initialCourses[0].id, students: [] },
    { id: crypto.randomUUID(), name: 'Grup A', courseId: initialCourses[1].id, students: [] },
  ];

  // Populate students
  initialClassGroups.forEach((cg) => {
    const parentCourse = initialCourses.find(c => c.id === cg.courseId);
    if (!parentCourse) return;
    
    const classStudents: Student[] = [];
    
    for (let i = 0; i < 25; i++) {
      const studentName = STUDENT_NAMES[i] || `ALUMNE/A ${i + 1}`;
      
      // Creem les dades per a TOTS els trimestres
      const evaluations: Record<Trimester, EvaluationData> = {
          '1': { personalAspects: { notes: '', report: '' }, generalComment: { notes: '', report: '' }, subjects: [] },
          '2': { personalAspects: { notes: '', report: '' }, generalComment: { notes: '', report: '' }, subjects: [] },
          '3': { personalAspects: { notes: '', report: '' }, generalComment: { notes: '', report: '' }, subjects: [] },
          'final': { personalAspects: { notes: '', report: '' }, generalComment: { notes: '', report: '' }, subjects: [] },
      };

      TRIMESTERS.forEach(t => {
          const trimesterId = t.id;
          
          evaluations[trimesterId].subjects = parentCourse.subjects.map(cs => {
              let grade = Grade.Satisfactori;
              // Randomize grades slightly
              if (i < 5) grade = Grade.Excelent;
              
              let notes = '';
              if (i === 0 && trimesterId === '1') {
                  const sName = initialSubjects.find(s => s.id === cs.subjectId)?.name;
                  if (sName === 'LLENGUA CATALANA') notes = 'Molt bon progrés en lectura.';
              }

              return {
                  subjectId: cs.subjectId,
                  grade: grade,
                  comment: { notes, report: '' }
              };
          });

          // Notes d'exemple només al 1r alumne del 1r trimestre
          if (i === 0 && trimesterId === '1') {
              evaluations[trimesterId].personalAspects.notes = 'Alumne molt participatiu i alegre.';
              evaluations[trimesterId].generalComment.notes = 'Bon inici de curs.';
          }
      });

      classStudents.push({
        id: crypto.randomUUID(),
        name: studentName,
        evaluations: evaluations
      });
    }
    cg.students = classStudents;
  });

  return { initialCourses, initialClassGroups, initialSubjects };
};
