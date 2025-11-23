
import { GoogleGenAI } from "@google/genai";
import type { Grade, Student, StudentSubject, Trimester } from "../types";

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
  | { type: 'general' }
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

  } else {
    let contextPrompt = '';
    if (context.type === 'subject') {
        contextPrompt = `
        - Assignatura: "${context.subjectName}"
        - Nota: "${context.grade}"
        - Continguts treballats: "${context.workedContent || 'No especificats'}"
        `;
    } else if (context.type === 'general') {
        contextPrompt = '- Tipus: Valoració general del trimestre.';
    }

    prompt = `
      ${styleInstruction}

      TASCA:
      Redacta un comentari d'informe escolar en català, basant-te en les següents dades i imitant l'estil dels exemples superiors (si n'hi ha).

      Context específic:
      ${contextPrompt}
      
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

        if (!evalData.personalAspects.report && evalData.personalAspects.notes) {
            const context: GenerationContext = { type: 'personal', studentName: student.name, subjects: evalData.subjects, resolvedSubjects: classSubjects };
            const promise = generateReportComment(evalData.personalAspects.notes, context, styleExamples)
                .then(report => { evalData.personalAspects.report = report; });
            generationPromises.push(promise);
        }

        if (!evalData.generalComment.report && evalData.generalComment.notes) {
            const context: GenerationContext = { type: 'general' };
            const promise = generateReportComment(evalData.generalComment.notes, context, styleExamples)
                .then(report => { evalData.generalComment.report = report; });
            generationPromises.push(promise);
        }

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

    await Promise.all(generationPromises);
    return studentsCopy;
};
