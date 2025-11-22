
import type { Student, Trimester } from '../types';

interface ResolvedClassSubject {
    id: string;
    name: string;
}

export const generateHtmlForExport = (className: string, students: Student[], classSubjects: ResolvedClassSubject[], trimester: Trimester): string => {
  let fullHtml = `<h2>Informes: ${className} (Trimestre ${trimester.toUpperCase()})</h2>`;

  const formatText = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  };

  students.forEach((student, index) => {
    const evalData = student.evaluations[trimester];
    if(!evalData) return;

    const style = index > 0 ? 'style="page-break-before: always;"' : '';
    fullHtml += `<div ${style}>`;
    
    fullHtml += `<h1>${student.name}</h1>`;
    
    const personalAspects = evalData.personalAspects.report || 'Sense comentaris.';
    fullHtml += `<p><strong>Aspectes Personals i Evolutius</strong></p>`;
    fullHtml += `<p>${formatText(personalAspects)}</p>`;

    fullHtml += `<br /><p><strong>Valoració de les Assignatures</strong></p>`;
    classSubjects.forEach(subject => {
      const studentSubjectData = evalData.subjects.find(s => s.subjectId === subject.id);
      if (studentSubjectData) {
        fullHtml += `<br /><p><strong>${subject.name}</strong></p>`;
        fullHtml += `<p><strong>NOTA:</strong> ${studentSubjectData.grade}</p>`;
        const comment = studentSubjectData.comment.report || 'Sense comentaris.';
        fullHtml += `<p><strong>COMENTARI:</strong><br>${formatText(comment)}</p>`;
      }
    });

    const generalComment = evalData.generalComment.report || 'Sense comentaris.';
    fullHtml += `<br /><p><strong>Comentari General</strong></p>`;
    fullHtml += `<p>${formatText(generalComment)}</p>`;
    
    fullHtml += `</div>`;
  });

  return fullHtml;
};
