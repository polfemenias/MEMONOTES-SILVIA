import { GoogleGenAI } from "@google/genai";
import type { Grade, Student } from "../types";

// Funció robusta per obtenir l'API Key independentment de l'entorn (Vite, CRA, Webpack, Netlify)
const getApiKey = (): string | undefined => {
  let key: string | undefined = undefined;

  // 1. Intentar obtenir des de import.meta.env (Estàndard Vite)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        key = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
    }
  } catch (e) {
    // Ignorar error si import.meta no existeix
  }

  // 2. Si no s'ha trobat, intentar obtenir des de process.env (Estàndard Node/Webpack/CRA)
  if (!key) {
    try {
      if (typeof process !== 'undefined' && process.env) {
        key = process.env.API_KEY || process.env.REACT_APP_API_KEY || process.env.VITE_API_KEY;
      }
    } catch (e) {
       // Ignorar error si process no està definit
    }
  }

  return key;
};

const apiKey = getApiKey();

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Log d'advertència només en desenvolupament o consola per depurar
if (!ai) {
  console.warn(
    "⚠️ ATENCIÓ: No s'ha trobat cap API KEY.\n" +
    "Si estàs a Netlify, assegura't d'haver afegit la variable d'entorn 'VITE_API_KEY' (o 'API_KEY') a Site Settings > Environment Variables.\n" +
    "Després d'afegir-la, has de fer un REDEPLOY."
  );
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
    throw new Error(
        "Error de Configuració: No s'ha trobat l'API Key.\n\n" +
        "SOLUCIÓ A NETLIFY:\n" +
        "1. Ves a 'Site settings' > 'Environment variables'.\n" +
        "2. Afegeix una nova variable anomenada 'VITE_API_KEY' amb la teva clau.\n" +
        "3. Ves a 'Deploys' i fes clic a 'Trigger deploy' per aplicar els canvis."
    );
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
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    
    // Gestió d'errors comuns per donar feedback útil a l'usuari
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('429')) {
        throw new Error("Has superat el límit de peticions (Quota Exceeded). Si uses la versió gratuïta, espera uns minuts. Si és per feina, revisa la facturació a Google Cloud.");
    }
    
    if (errorMessage.includes('API key not valid') || errorMessage.includes('403')) {
        throw new Error("La clau API no és vàlida o ha caducat. Revisa la configuració a Google AI Studio.");
    }

    throw new Error(`Error API: ${errorMessage}`);
  }
};

interface ResolvedClassSubject {
    id: string;
    name: string;
    workedContent: string;
}

export const generateMissingReportsForClass = async (students: Student[], classSubjects: ResolvedClassSubject[]): Promise<Student[]> => {
    if (!ai) {
      const errorMessage = "La generació automàtica no està disponible. Revisa la consola per veure les instruccions de configuració de l'API Key a Netlify.";
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