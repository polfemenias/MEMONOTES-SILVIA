import type { ClassGroup, Subject, Student, StudentSubject, Course, CourseSubject } from '../types';
import { Grade } from '../types';

export const getInitialData = (): { initialCourses: Course[], initialClassGroups: ClassGroup[]; initialSubjects: Subject[] } => {
  // --- SUBJECTS (MASTER LIST) ---
  const initialSubjects: Subject[] = [
    { id: crypto.randomUUID(), name: 'LLENGUA CATALANA' },
    { id: crypto.randomUUID(), name: 'MATEMÀTIQUES' },
    { id: crypto.randomUUID(), name: 'CONEIXEMENT DEL MEDI' },
    { id: crypto.randomUUID(), name: 'PLÀSTICA' },
    { id: crypto.randomUUID(), name: 'ANGLÈS' },
  ];

  const [catalan, mates, medi, plastica, angles] = initialSubjects;

  // --- COURSES ---
  const initialCourses: Course[] = [
    {
      id: crypto.randomUUID(),
      name: 'TERCER',
      subjects: [
        { subjectId: catalan.id, workedContent: 'Tipologies textuals, ortografia bàsica, sinònims i antònims.' },
        { subjectId: mates.id, workedContent: 'Taules de multiplicar, problemes de dues operacions, cossos geomètrics.' },
        { subjectId: medi.id, workedContent: 'L\'univers, el sistema solar, els paisatges.' },
        { subjectId: plastica.id, workedContent: 'El color, les textures, el collage.' },
      ]
    },
    {
      id: crypto.randomUUID(),
      name: 'SEGON',
      subjects: [
          { subjectId: catalan.id, workedContent: 'Lectoescriptura, comprensió lectora, expressió escrita.' },
          { subjectId: mates.id, workedContent: 'Numeració i càlcul, resolució de problemes, geometria.' },
          { subjectId: medi.id, workedContent: 'El cos humà, els éssers vius, el pas del temps.' },
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
    {
      id: crypto.randomUUID(),
      name: 'TERCER A',
      courseId: initialCourses[0].id,
      students: [],
    },
    {
      id: crypto.randomUUID(),
      name: 'TERCER B',
      courseId: initialCourses[0].id,
      students: [],
    },
    {
      id: crypto.randomUUID(),
      name: 'SEGON A',
      courseId: initialCourses[1].id,
      students: [],
    },
  ];

  // Populate students for each class
  initialClassGroups.forEach((cg) => {
    const parentCourse = initialCourses.find(c => c.id === cg.courseId);
    if (!parentCourse) return;
    
    const classStudents: Student[] = [];
    for (let i = 1; i <= 3; i++) {
        
      const studentSubjects: StudentSubject[] = parentCourse.subjects.map((courseSubject) => {
          let grade = Grade.Satisfactori;
          if(i === 1) grade = Grade.Excelent;
          if(i === 3) grade = Grade.NoAssolit;
          
          let notes = '';
          const subjectInfo = initialSubjects.find(s => s.id === courseSubject.subjectId);
          if(subjectInfo?.name === 'LLENGUA CATALANA' && i === 1) notes = 'Mostra molt interès per la lectura. La seva escriptura és clara i ben estructurada.';
          if(subjectInfo?.name === 'MATEMÀTIQUES' && i === 1) notes = 'Resol problemes amb rapidesa i entén bé els conceptes de càlcul.';

          return {
              subjectId: courseSubject.subjectId,
              grade: grade,
              comment: { notes: notes, report: '' },
          }
      });

      let personalNotes = `Alumne/a ${i} de la classe ${cg.name}.`;
      if(i === 1) personalNotes = 'És un/a alumne/a molt participatiu/va i col·laborador/a. Ajuda sempre els companys i mostra una gran curiositat per aprendre. Té molta autonomia.';
      if(i === 2) personalNotes = 'S\'esforça molt en les tasques, tot i que de vegades li costa una mica mantenir la concentració. Socialment, té un grup d\'amics estable.';
      if(i === 3) personalNotes = 'Necessita suport per organitzar-se i seguir les rutines de l\'aula. A nivell social, de vegades li costa relacionar-se en gran grup.';


      classStudents.push({
        id: crypto.randomUUID(),
        name: `ALUMNE/A ${i} - ${cg.name}`,
        personalAspects: {
          notes: personalNotes,
          report: i === 1 ? 'Durant aquest trimestre, ha demostrat un progrés excel·lent i una adaptació fantàstica al grup-classe, sentint-se molt còmode i participatiu.\n\nEl seu rendiment acadèmic és molt bo, destacant per la qualitat en la presentació de les tasques i el seu entusiasme per l\'aprenentatge. Compleix sempre amb les entregues i mostra una gran responsabilitat.\n\nA nivell personal, ha desenvolupat una notable autonomia i iniciativa, gestionant les seves tasques de manera eficient i mostrant maduresa en la gestió de les seves emocions.\n\nEs relaciona de manera molt positiva amb els companys i mestres, mostrant empatia i una gran capacitat per treballar en equip. Sempre està disposat/da a ajudar.\n\nEstem molt satisfets amb la seva evolució i la seva actitud exemplar a l\'aula.' : '',
        },
        generalComment: {
          notes: i === 1 ? 'Un trimestre excel·lent. Cal continuar fomentant la seva curiositat.' : '',
          report: '',
        },
        subjects: studentSubjects,
      });
    }
    cg.students = classStudents;
  });

  return { initialCourses, initialClassGroups, initialSubjects };
};
