
import React, { useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAutoResizeTextArea } from '../hooks/useAutoResizeTextArea';

interface StudentDictationProps {
    onAddStudents: (names: string[]) => void;
}

const StudentDictation: React.FC<StudentDictationProps> = ({ onAddStudents }) => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [text, setText] = useState('');
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    
    useAutoResizeTextArea(textAreaRef, text);


    const handleTranscript = (transcript: string) => {
        setText(prev => {
            const trimmedTranscript = transcript.trim();
            if (trimmedTranscript) {
                // Append the new transcript followed by a newline.
                // This treats each final transcript from the hook as a single student name.
                const existingText = prev.trim();
                const newText = existingText ? `${existingText}\n${trimmedTranscript}` : trimmedTranscript;
                return `${newText}\n`;
            }
            return prev;
        });
    };
    
    const { isListening, startListening, stopListening } = useSpeechRecognition({ onTranscript: handleTranscript });

    useEffect(() => {
        // Automatically stop listening if the panel is closed.
        if (!isPanelOpen && isListening) {
            stopListening();
        }
    }, [isPanelOpen, isListening, stopListening]);

    const handleSave = () => {
        const names = text.split('\n')
            .map(name => name.trim().toUpperCase())
            .filter(name => name !== '');
        if (names.length > 0) {
            onAddStudents(names);
        }
        setText('');
        setIsPanelOpen(false);
    };
    
    if (!isPanelOpen) {
        return (
            <button
                onClick={() => setIsPanelOpen(true)}
                className="text-sm text-sky-600 hover:text-sky-800 flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-sky-50 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                </svg>
                Dictar i Afegir Alumnes
            </button>
        );
    }

    return (
        <div className="p-4 border rounded-lg bg-white shadow-sm border-sky-100">
            <p className="text-sm text-slate-600 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></span>
                Prem el micròfon i digues els noms dels alumnes. Fes una petita pausa entre cada nom.
            </p>
            <div className="relative">
                <textarea
                    ref={textAreaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={5}
                    className="w-full p-3 pr-12 border rounded-md shadow-sm resize-none overflow-hidden focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none transition-all"
                    placeholder="Ex:&#10;LAURA PÉREZ&#10;MARC SOLER&#10;SOFIA GARCIA"
                />
                <div className="absolute top-2 right-2">
                     <button
                        type="button"
                        onClick={isListening ? stopListening : startListening}
                        className={`p-2 rounded-full transition-all duration-300 ${
                            isListening 
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 scale-110' 
                            : 'bg-slate-100 text-slate-400 hover:bg-sky-100 hover:text-sky-600'
                        }`}
                        title={isListening ? 'Aturar enregistrament' : 'Començar a dictar'}
                    >
                        {isListening ? (
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 animate-pulse">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setIsPanelOpen(false)} className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">Cancel·lar</button>
                <button onClick={handleSave} className="px-4 py-1.5 text-sm font-medium bg-sky-600 text-white rounded-md hover:bg-sky-700 shadow-sm shadow-sky-200 transition-colors">Desar Alumnes</button>
            </div>
        </div>
    );
};

export default StudentDictation;
