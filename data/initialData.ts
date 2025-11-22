import type { ClassGroup, Subject, Student, StudentSubject, Course } from '../types';
import { Grade } from '../types';

// Helper para generar contenido de relleno de unas 8 líneas (més robust)
const generateDefaultContent = (topic: string) => {
  return `1. Introducció pràctica als conceptes bàsics de: ${topic}.
2. Desenvolupament progressiu de les competències clau associades.
3. Realització d'activitats de treball individual i cooperatiu a l'aula.
4. Utilització de diferents eines, recursos manipulatius i digitals d'aprenentatge.
5. Avaluació continuada i formativa del progrés individual de l'alumne.
6. Aplicació pràctica dels coneixements adquirits en situacions quotidianes.
7. Reflexió sobre el propi procés d'aprenentatge i autoavaluació.
8. Consolidació dels hàbits de treball, ordre i estudi autònom.`;
};

export const getInitialData = (): { initialCourses: Course[], initialClassGroups: ClassGroup[]; initialSubjects: Subject[] } => {
  // --- SUBJECTS (MASTER LIST) ---
  const initialSubjects: Subject[] = [
    { id: crypto.randomUUID(), name: 'LLENGUA CATALANA' },
    { id: crypto.randomUUID(), name: 'MATEMÀTIQUES' },
    { id: crypto.randomUUID(), name: 'CONEIXEMENT DEL MEDI' },
    { id: crypto.randomUUID(), name: 'PLÀSTICA' },
    { id: crypto.randomUUID(), name: 'ANGLÈS' },
    { id: crypto.randomUUID(), name: 'EDUCACIÓ FÍSICA' },
  ];

  const [catalan, mates, medi, plastica, angles, edfisica] = initialSubjects;

  // --- COURSES ---
  const initialCourses: Course[] = [
    {
      id: crypto.randomUUID(),
      name: 'TERCER',
      subjects: [
        { subjectId: catalan.id, workedContent: `1. Tipologies textuals treballades: la carta formal, el conte i la descripció.\n2. Ortografia bàsica: accentuació (agudes, planes, esdrúixoles) i puntuació.\n3. Sinònims, antònims i famílies de paraules: ampliació de vocabulari.\n4. Comprensió lectora de textos narratius i informatius amb preguntes.\n5. Expressió oral: exposicions breus a l'aula sobre temes d'interès.\n6. Lectura en veu alta amb entonació, ritme i velocitat adequats.\n7. Realització de dictats preparats i no preparats setmanals.\n8. Ús del diccionari (paper i digital) com a eina de consulta habitual.` },
        { subjectId: mates.id, workedContent: `1. Consolidació de les taules de multiplicar de l'1 al 9.\n2. Resolució de problemes de dues operacions (suma i resta) amb enunciats.\n3. Cossos geomètrics: identificació de prismes, piràmides i cossos rodons.\n4. Càlcul mental diari: estratègies de descomposició de suma i resta.\n5. Mesura: unitats de longitud, capacitat i massa, i els seus instruments.\n6. Tractament de la informació: interpretació de gràfics de barres.\n7. Introducció a les fraccions senzilles: meitat, terç i quart.\n8. Iniciació a la divisió exacta i entera amb una xifra.` },
        { subjectId: medi.id, workedContent: `1. L'univers i el sistema solar: característiques dels planetes i estrelles.\n2. Els paisatges de l'entorn: muntanya, plana i costa. Elements naturals.\n3. El cicle de l'aigua i la seva importància per a la vida.\n4. Els éssers vius: classificació d'animals i plantes de l'entorn proper.\n5. El cos humà: aparells i sistemes bàsics (respiratori, digestiu).\n6. Hàbits saludables: alimentació equilibrada, higiene i descans.\n7. L'orientació espacial: interpretació senzilla de mapes i plànols.\n8. Accions per al respecte i la cura del medi ambient (reciclatge).` },
        { subjectId: plastica.id, workedContent: generateDefaultContent('Arts Plàstiques i el color') },
        { subjectId: edfisica.id, workedContent: generateDefaultContent('Educació Física i salut') },
      ]
    },
    {
      id: crypto.randomUUID(),
      name: 'SEGON',
      subjects: [
          { subjectId: catalan.id, workedContent: generateDefaultContent('Lectoescriptura i comprensió') },
          { subjectId: mates.id, workedContent: generateDefaultContent('Numeració i càlcul bàsic') },
          { subjectId: medi.id, workedContent: generateDefaultContent('Entorn proper i natura') },
          { subjectId: edfisica.id, workedContent: generateDefaultContent('Psicomotricitat') },
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
      name: 'Grup A',
      courseId: initialCourses[0].id,
      students: [],
    },
    {
      id: crypto.randomUUID(),
      name: 'Grup B',
      courseId: initialCourses[0].id,
      students: [],
    },
    {
      id: crypto.randomUUID(),
      name: 'Grup A',
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