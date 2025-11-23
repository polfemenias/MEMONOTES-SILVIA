
import { GoogleGenAI } from "@google/genai";
import type { Grade, Student, StudentSubject, Trimester, AITextField } from "../types";
import { GENERAL_REPORT_CLOSURES } from "../constants";

const getApiKey = (): string | undefined => {
  let key: string | undefined = undefined;
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        key = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
    }
  } catch (e) {}
  if (!key) {
    try {
      if (typeof process !== 'undefined' && process.env) {
        key = process.env.API_KEY || process.env.REACT_APP_API_KEY || process.env.VITE_API_KEY;
      }
    } catch (e) {}
  }
  return key;
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

if (!ai) console.warn("⚠️ API KEY MISSING");

interface ResolvedSubject {
  id: string;
  name: string;
}

export type GenerationContext = 
  | { type: 'personal', studentName: string, subjects: StudentSubject[], resolvedSubjects: ResolvedSubject[] }
  | { type: 'general', studentName: string, personalAspects: AITextField, subjects: StudentSubject[], resolvedSubjects: ResolvedSubject[] }
  | { type: 'subject', grade: Grade, subjectName: string, workedContent: string };


export const generateReportComment = async (
  notes: string,
  context: GenerationContext,
  styleExamples?: string
): Promise<string> => {
  if (!ai) throw new Error("API Key missing");

  // Construct the "Few-Shot" part of the prompt
  const styleInstruction = styleExamples 
    ? `
    IMPORTANT: Hauràs de redactar l'informe imitant L'ESTIL, EL TO i EL VOCABULARI dels següents exemples proporcionats per l'usuari. Fixa't en com estructura les frases, com fa els elogis i com descriu les millores.

    --- EXEMPLES D'ESTIL A IMITAR ---
    ${styleExamples}
    ---------------------------------
    ` 
    : '';

  let prompt = '';

  if (context.type === 'personal') {
    const subjects = context.resolvedSubjects;
    
    const subjectDetails = context.subjects.map(ss => {
        const subjectInfo = subjects.find(s => s.id === ss.subjectId);
        return `- ${subjectInfo?.name || 'Assignatura'}: [Nota: ${ss.grade}]. Notes: "${ss.comment.notes || ''}"`;
    }).join('\n');

    prompt = `
      ${styleInstruction}

      TASCA:
      Ets un assistent expert per a un mestre de primària. Redacta l'apartat "Aspectes Personals i Evolutius" de l'informe de l'alumne: ${context.studentName}.
      
      Utilitza les següents dades (notes brutes del mestre) per construir l'informe, mantenint l'estil dels exemples superiors:
      - Notes personals: "${notes}"
      - Assignatures (context global):
      ${subjectDetails}
    `;

  } else if (context.type === 'general') {
    const subjects = context.resolvedSubjects;
    
    const subjectDetails = context.subjects.map(ss => {
        const subjectInfo = subjects.find(s => s.id === ss.subjectId);
        return `- ${subjectInfo?.name || 'Assignatura'}: [Nota: ${ss.grade}]. Notes: "${ss.comment.notes || ''}"`;
    }).join('\n');

    const specificNotes = notes.trim() ? `"${notes}"` : "Cap nota específica. Genera el comentari basant-te únicament en les dades acadèmiques i personals disponibles.";

    prompt = `
      ${styleInstruction}

      TASCA:
      Ets un assistent expert per a un mestre de primària. Redacta l'apartat "Comentari General / Valoració Global" del trimestre per a l'alumne: ${context.studentName}.

      OBJECTIU:
      El comentari ha de ser una síntesi clara i professional de l'evolució de l'alumne.
      Has d'utilitzar les següents dades per decidir si el trimestre ha estat positiu o si necessita reforç.

      DADES DE L'ALUMNE:
      1. Aspectes Personals:
         "${context.personalAspects.notes} ${context.personalAspects.report}"
      
      2. Rendiment Acadèmic (Assignatures):
      ${subjectDetails}

      3. Notes específiques del mestre (Opcional):
         ${specificNotes}

      INSTRUCCIONS DE REDACCIÓ:
      - Si NO hi ha notes específiques, genera un paràgraf de tancament sintètic utilitzant les plantilles de sota com a inspiració.
      - Si hi ha notes, integra-les en el discurs.
      - El to ha de ser proper i motivador.

      PLANTILLES DE TANCAMENT (Utilitza aquestes frases com a base):
      
      CAS A (Evolució Positiva / Bona actitud / Notes satisfactòries o superiors):
      Utilitza o adapta frases com:
      ${JSON.stringify(GENERAL_REPORT_CLOSURES.POSITIVE)}
      
      CAS B (Necessita Reforç / Dificultats / Actitud millorable):
      Utilitza o adapta frases com:
      ${JSON.stringify(GENERAL_REPORT_CLOSURES.NEEDS_REINFORCEMENT)}

      IMPORTANT: El text ha de ser en Català, proper i professional. No inventis fets que no estiguin a les dades.
    `;

  } else if (context.type === 'subject') {
    prompt = `
      ${styleInstruction}

      TASCA:
      Redacta un comentari d'informe escolar en català, basant-te en les següents dades i imitant l'estil dels exemples superiors (si n'hi ha).

      Context específic:
      - Assignatura: "${context.subjectName}"
      - Nota: "${context.grade}"
      - Continguts treballats: "${context.workedContent || 'No especificats'}"
      
      - NOTES BRUTES DEL MESTRE: "${notes}"
      
      El text final ha de ser polit, professional però proper, i sense introduccions tipus "Aquí tens el text...". Directament el redactat.
    `;
  }

  try {
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text.trim();
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(error.message);
  }
};

interface ResolvedClassSubject {
    id: string;
    name: string;
    workedContent: Record<Trimester, string>;
}

export const generateMissingReportsForClass = async (students: Student[], classSubjects: ResolvedClassSubject[], trimester: Trimester, styleExamples?: string): Promise<Student[]> => {
    if (!ai) return Promise.reject(new Error("API Key missing"));
    
    const studentsCopy = JSON.parse(JSON.stringify(students)) as Student[];
    const generationPromises: Promise<void>[] = [];

    studentsCopy.forEach(student => {
        const evalData = student.evaluations[trimester];

        // 1. Generate Personal Aspects first if missing (context for general)
        if (!evalData.personalAspects.report && evalData.personalAspects.notes) {
            const context: GenerationContext = { type: 'personal', studentName: student.name, subjects: evalData.subjects, resolvedSubjects: classSubjects };
            const promise = generateReportComment(evalData.personalAspects.notes, context, styleExamples)
                .then(report => { evalData.personalAspects.report = report; });
            generationPromises.push(promise);
        }

        // 2. Generate Subjects
        evalData.subjects.forEach(ss => {
            if (!ss.comment.report && ss.comment.notes) {
                const subjectInfo = classSubjects.find(s => s.id === ss.subjectId);
                if (subjectInfo) {
                    const workedContent = ss.customWorkedContent !== undefined 
                        ? ss.customWorkedContent 
                        : subjectInfo.workedContent[trimester];

                    const context: GenerationContext = {
                        type: 'subject',
                        grade: ss.grade,
                        subjectName: subjectInfo.name,
                        workedContent: workedContent,
                    };
                    const promise = generateReportComment(ss.comment.notes, context, styleExamples)
                        .then(report => {
                             const targetSub = evalData.subjects.find(s => s.subjectId === ss.subjectId);
                             if(targetSub) targetSub.comment.report = report;
                        });
                    generationPromises.push(promise);
                }
            }
        });
    });

    // Wait for subjects and personal aspects to be ready before generating General Comment
    // This is a simple approximation. For perfect dependency, we'd need sequential chaining, 
    // but Promise.all is faster. We assume notes exist.
    await Promise.all(generationPromises);
    
    // 3. Generate General Comment (now that we hopefully have more reports generated or at least the notes)
    const generalPromises: Promise<void>[] = [];
    studentsCopy.forEach(student => {
        const evalData = student.evaluations[trimester];
        // Allow generating General comment even if notes are empty, because it aggregates other data
        if (!evalData.generalComment.report) {
             // We can generate if there are at least notes OR if there is other data to summarize (Personal aspects or subjects)
             // Even if notes are empty, we allow generation for General Comment now.
             const hasData = evalData.generalComment.notes || evalData.personalAspects.notes || evalData.subjects.some(s => s.comment.notes || s.grade);
             
             if (hasData) {
                const context: GenerationContext = { 
                    type: 'general', 
                    studentName: student.name, 
                    personalAspects: evalData.personalAspects,
                    subjects: evalData.subjects,
                    resolvedSubjects: classSubjects
                };
                const promise = generateReportComment(evalData.generalComment.notes, context, styleExamples)
                    .then(report => { evalData.generalComment.report = report; });
                generalPromises.push(promise);
             }
        }
    });

    await Promise.all(generalPromises);
    return studentsCopy;
};
