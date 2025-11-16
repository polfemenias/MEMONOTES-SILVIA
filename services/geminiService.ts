
import { GoogleGenAI } from "@google/genai";
import type { Grade, Student, Subject, StudentSubject } from "../types";

// --- CONFIGURACIÓ OBLIGATÒRIA ---
// Reemplaça aquest valor amb la teva clau d'API de Google AI Studio.
// Pots aconseguir-ne una gratuïtament a https://aistudio.google.com/app/apikey
const geminiApiKey = 'REPLACE_WITH_YOUR_GEMINI_API_KEY';
// ---------------------------------

const isConfigured = !geminiApiKey.startsWith('REPLACE_');

const ai = isConfigured ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

if (!isConfigured) {
  console.error("La clau de l'API de Gemini no està configurada al fitxer services/geminiService.ts. Les funcions d'IA no funcionaran.");
}

export type GenerationContext = 
  | { type: 'personal', student: Student, subjects: Subject[] }
  | { type: 'general' }
  | { type: 'subject', grade: Grade, subjectName: string, workedContent: string };


export const generateReportComment = async (
  notes: string,
  context: GenerationContext
): Promise<string> => {
  if (!ai) {
    throw new Error("La clau de l'API de Gemini no està configurada. No es pot generar l'informe.");
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
    throw new Error("Failed to generate comment from AI.");
  }
};

// Nova funció per generar informes que falten per a tota una classe
export const generateMissingReportsForClass = async (students: Student[], subjects: Subject[]): Promise<Student[]> => {
    if (!ai) {
      console.warn("La generació massiva d'informes s'ha omès perquè la clau de l'API de Gemini no està configurada.");
      return Promise.reject(new Error("La generació automàtica no està disponible. Configura la clau de l'API de Gemini a 'services/geminiService.ts'."));
    }
    
    // Clona profundament els estudiants per evitar mutacions directes de l'estat
    const studentsCopy = JSON.parse(JSON.stringify(students)) as Student[];

    const generationPromises: Promise<void>[] = [];

    studentsCopy.forEach(student => {
        // 1. Comprova Aspectes Personals
        if (!student.personalAspects.report && student.personalAspects.notes) {
            const context: GenerationContext = { type: 'personal', student, subjects };
            const promise = generateReportComment(student.personalAspects.notes, context)
                .then(report => { student.personalAspects.report = report; });
            generationPromises.push(promise);
        }

        // 2. Comprova Comentari General
        if (!student.generalComment.report && student.generalComment.notes) {
            const context: GenerationContext = { type: 'general' };
            const promise = generateReportComment(student.generalComment.notes, context)
                .then(report => { student.generalComment.report = report; });
            generationPromises.push(promise);
        }

        // 3. Comprova cada Assignatura
        student.subjects.forEach(ss => {
            if (!ss.comment.report && ss.comment.notes) {
                const subjectInfo = subjects.find(s => s.id === ss.subjectId);
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

    // Espera que totes les generacions d'informes s'acabin
    await Promise.all(generationPromises);

    return studentsCopy;
};
