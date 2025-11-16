import { GoogleGenAI } from "@google/genai";
import type { Grade, Student } from "../types";

// L'API Key de Gemini s'obté de les variables d'entorn.
// Això és més segur i necessari per a desplegaments a serveis com Netlify.
// L'usuari ha de configurar una variable d'entorn anomenada API_KEY.
const apiKey = process.env.API_KEY;

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

if (!ai) {
  console.error("La clau de l'API de Gemini no està configurada a les variables d'entorn (API_KEY). Les funcions d'IA no funcionaran.");
}

interface ResolvedSubject {
  id: string;
  name: string;
}

export type GenerationContext = 
  | { type: 'personal', student: Student, subjects: ResolvedSubject[] }
  | { type: 'general' }
  | { type: 'subject', grade: Grade, subjectName: string, workedContent: string };


export const generateReportComment = async (
  notes: string,
  context: GenerationContext
): Promise<string> => {
  if (!ai) {
    throw new Error("La clau de l'API de Gemini no està configurada. Assegura't de configurar la variable d'entorn API_KEY. No es pot generar l'informe.");
  }

  let prompt = '';

  if (context.type === 'personal') {
    const student = context.student;
    const subjects = context.subjects;
    
    // Mapeja les dades de les assignatures per a una millor contextualització
    const subjectDetails = student.subjects.map(ss => {
        const subjectInfo = subjects.find(s => s.id === ss.subjectId);
        return `- ${subjectInfo?.name || 'Assignatura desconeguda'}: [Qualificació: ${ss.grade}]. Notes del mestre/a: "${ss.comment.notes || 'Sense notes'}"`;
    }).join('\n');

    prompt = `
      Ets un assistent expert per a un mestre/a de primària de Catalunya. 
      La teva tasca és redactar l'apartat "Aspectes Personals i Evolutius" de l'informe d'avaluació d'un alumne/a, dirigit a les seves famílies.

      **Instruccions estrictes:**
      1.  **NO incloguis cap introducció ni comiat.** El text que generis ha de ser directament el comentari de l'informe.
      2.  Utilitza un to professional, positiu i constructiu.
      3.  Escriu en català normatiu i formal.
      4.  Estructura l'informe exactament en els següents **5 paràgrafs**:

          - **Paràgraf 1 (Progrés i Adaptació):** Comença amb una valoració general del progrés de l'alumne/a durant el trimestre i comenta com s'ha sentit i adaptat al grup-classe.
          
          - **Paràgraf 2 (Procés d'Aprenentatge):** Fes una síntesi del seu rendiment acadèmic general, barrejant informació de les diferents assignatures. Comenta aspectes com la presentació de les tasques, la puntualitat en les entregues i el seu enfocament cap a l'aprenentatge.
          
          - **Paràgraf 3 (Desenvolupament Personal):** Descriu el seu creixement personal. Pots parlar de la seva autonomia, responsabilitat, gestió de les emocions, iniciativa o altres aspectes rellevants.
          
          - **Paràgraf 4 (Habilitats Socials):** Explica com es relaciona amb els altres companys/es i amb els mestres. Comenta la seva capacitat de col·laboració, respecte i empatia.
          
          - **Paràgraf 5 (Tancament):** Finalitza amb una frase de tancament positiva, com per exemple, expressant satisfacció per la seva evolució i actitud.

      **Dades per generar l'informe de ${student.name}:**
      - **Notes generals sobre aspectes personals (font principal per als paràgrafs 1, 3, 4 i 5):** "${notes || 'Sense notes específiques'}"
      - **Informació de les assignatures (font principal per al paràgraf 2):**
      ${subjectDetails}
      - **Notes del comentari general final:** "${student.generalComment.notes || 'Sense notes'}"

      Redacta l'informe seguint fidelment l'estructura de 5 paràgrafs.
    `;

  } else {
    let contextPrompt = '';
    if (context.type === 'subject') {
        contextPrompt = `
        - Assignatura: "${context.subjectName}"
        - Nota de l'assignatura: "${context.grade}"
        - Continguts treballats: "${context.workedContent || 'No especificats'}"
        `;
    } else if (context.type === 'general') {
        contextPrompt = '- Tipus de comentari: Valoració general final del trimestre/curs.';
    }

    prompt = `
      Ets un assistent expert per a un mestre/a de primària de Catalunya. 
      La teva tasca és redactar un comentari per a l'informe d'avaluació d'un alumne/a, dirigit a les seves famílies.

      **Instruccions estrictes:**
      1.  **NO incloguis cap introducció ni comiat.** El text que generis ha de ser directament el comentari de l'informe, sense frases com "Aquí tens el comentari:", "Esborrany de comentari:" o similars.
      2.  Utilitza un to professional, positiu i constructiu. Enfoca't en el progrés i en els propers passos.
      3.  El comentari ha de tenir una llargada adequada per a un informe (entre 3 i 7 línies).
      4.  Escriu en català normatiu i formal.
      5.  Basa't principalment en les notes proporcionades pel mestre/a. Són la font d'informació més important.

      **Dades per generar el comentari:**
      ${contextPrompt}
      - Notes del mestre/a (aquesta és la informació clau): "${notes || 'Sense notes específiques'}"

      Redacta el comentari final per a l'informe.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Ha fallat la generació del comentari. Verifica que la clau de l'API de Gemini sigui correcta.");
  }
};

interface ResolvedClassSubject {
    id: string;
    name: string;
    workedContent: string;
}

export const generateMissingReportsForClass = async (students: Student[], classSubjects: ResolvedClassSubject[]): Promise<Student[]> => {
    if (!ai) {
      const errorMessage = "La generació automàtica no està disponible. Configura la clau de l'API de Gemini a les variables d'entorn (API_KEY) del teu projecte.";
      console.warn(errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
    
    const studentsCopy = JSON.parse(JSON.stringify(students)) as Student[];

    const generationPromises: Promise<void>[] = [];

    studentsCopy.forEach(student => {
        if (!student.personalAspects.report && student.personalAspects.notes) {
            const context: GenerationContext = { type: 'personal', student, subjects: classSubjects };
            const promise = generateReportComment(student.personalAspects.notes, context)
                .then(report => { student.personalAspects.report = report; });
            generationPromises.push(promise);
        }

        if (!student.generalComment.report && student.generalComment.notes) {
            const context: GenerationContext = { type: 'general' };
            const promise = generateReportComment(student.generalComment.notes, context)
                .then(report => { student.generalComment.report = report; });
            generationPromises.push(promise);
        }

        student.subjects.forEach(ss => {
            if (!ss.comment.report && ss.comment.notes) {
                const subjectInfo = classSubjects.find(s => s.id === ss.subjectId);
                if (subjectInfo) {
                    const context: GenerationContext = {
                        type: 'subject',
                        grade: ss.grade,
                        subjectName: subjectInfo.name,
                        workedContent: subjectInfo.workedContent,
                    };
                    const promise = generateReportComment(ss.comment.notes, context)
                        .then(report => {
                             const studentSubject = student.subjects.find(s => s.subjectId === ss.subjectId);
                             if(studentSubject) {
                                studentSubject.comment.report = report;
                             }
                        });
                    generationPromises.push(promise);
                }
            }
        });
    });

    await Promise.all(generationPromises);

    return studentsCopy;
};