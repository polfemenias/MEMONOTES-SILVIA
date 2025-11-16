
import type { ClassGroup, Subject, Student, StudentSubject } from '../types';
import { Grade } from '../types';

export const getInitialData = (): { initialClassGroups: ClassGroup[]; initialSubjects: Subject[] } => {
  // --- SUBJECTS ---
  const initialSubjects: Subject[] = [
    {
      id: crypto.randomUUID(),
      name: 'LLENGUA CATALANA',
      workedContent: 'Lectoescriptura, comprensió lectora, expressió escrita.',
    },
    {
      id: crypto.randomUUID(),
      name: 'MATEMÀTIQUES',
      workedContent: 'Numeració i càlcul, resolució de problemes, geometria.',
    },
    {
      id: crypto.randomUUID(),
      name: 'CONEIXEMENT DEL MEDI',
      workedContent: 'El cos humà, els éssers vius, el pas del temps.',
    },
  ];

  // --- CLASS GROUPS AND STUDENTS ---
  const initialClassGroups: ClassGroup[] = [
    {
      id: crypto.randomUUID(),
      name: 'CLASSE DELS DOFINS',
      students: [],
    },
    {
      id: crypto.randomUUID(),
      name: 'CLASSE DELS LLEONS',
      students: [],
    },
    {
      id: crypto.randomUUID(),
      name: 'CLASSE DE LES ÀLIGUES',
      students: [],
    },
  ];
  
  // Populate students for each class
  initialClassGroups.forEach((cg, classIndex) => {
    const classStudents: Student[] = [];
    for (let i = 1; i <= 3; i++) {
        
      const studentSubjects: StudentSubject[] = initialSubjects.map((subject, subjectIndex) => {
          let grade = Grade.Satisfactori;
          if(i === 1) grade = Grade.Excelent;
          if(i === 3) grade = Grade.NoAssolit;
          
          let notes = '';
          if(subject.name === 'LLENGUA CATALANA' && i === 1) notes = 'Mostra molt interès per la lectura. La seva escriptura és clara i ben estructurada.';
          if(subject.name === 'MATEMÀTIQUES' && i === 1) notes = 'Resol problemes amb rapidesa i entén bé els conceptes de càlcul.';

          return {
              subjectId: subject.id,
              grade: grade,
              comment: { notes: notes, report: '' },
          }
      });

      let personalNotes = `Alumne/a ${i} de la classe ${cg.name.split(' ')[2]}.`;
      if(i === 1) personalNotes = 'És un/a alumne/a molt participatiu/va i col·laborador/a. Ajuda sempre els companys i mostra una gran curiositat per aprendre. Té molta autonomia.';
      if(i === 2) personalNotes = 'S\'esforça molt en les tasques, tot i que de vegades li costa una mica mantenir la concentració. Socialment, té un grup d\'amics estable.';
      if(i === 3) personalNotes = 'Necessita suport per organitzar-se i seguir les rutines de l\'aula. A nivell social, de vegades li costa relacionar-se en gran grup.';


      classStudents.push({
        id: crypto.randomUUID(),
        name: `ALUMNE/A ${i} - ${cg.name.split(' ')[2]}`,
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

  return { initialClassGroups, initialSubjects };
};
