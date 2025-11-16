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
                className="text-sm text-sky-600 hover:text-sky-800 flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                    <path fillRule="evenodd" d="M5.5 8.5A.5.5 0 016 8v1a4 4 0 004 4 .5.5 0 010 1 5 5 0 01-5-5V8.5A.5.5 0 015.5 8.5zM14 9a.5.5 0 01.5-.5V8a5 5 0 00-5-5 .5.5 0 010-1 6 6 0 016 6v.5a.5.5 0 01-.5.5z" clipRule="evenodd" />
                </svg>
                Dictar i Afegir Alumnes
            </button>
        );
    }

    return (
        <div className="p-4 border rounded-lg bg-white shadow-sm">
            <p className="text-sm text-slate-600 mb-2">
                Prem el micròfon i digues els noms dels alumnes. Fes una petita pausa entre cada nom. Podràs corregir-los abans de desar.
            </p>
            <div className="relative">
                <textarea
                    ref={textAreaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={5}
                    className="w-full p-3 pr-12 border rounded-md shadow-sm resize-none overflow-hidden"
                    placeholder="Ex:&#10;LAURA PÉREZ&#10;MARC SOLER&#10;SOFIA GARCIA"
                />
                <div className="absolute top-2 right-2">
                     <button
                        type="button"
                        onClick={isListening ? stopListening : startListening}
                        className={`p-2 rounded-full transition-colors ${
                            isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-sky-500 text-white hover:bg-sky-600'
                        }`}
                        title={isListening ? 'Aturar enregistrament' : 'Començar a dictar'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                            <path fillRule="evenodd" d="M5.5 8.5A.5.5 0 016 8v1a4 4 0 004 4 .5.5 0 010 1 5 5 0 01-5-5V8.5A.5.5 0 015.5 8.5zM14 9a.5.5 0 01.5-.5V8a5 5 0 00-5-5 .5.5 0 010-1 6 6 0 016 6v.5a.5.5 0 01-.5.5z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setIsPanelOpen(false)} className="text-sm text-slate-600 hover:text-slate-900">Cancel·lar</button>
                <button onClick={handleSave} className="text-sm bg-sky-600 text-white px-3 py-1 rounded-md hover:bg-sky-700">Desar Alumnes</button>
            </div>
        </div>
    );
};

export default StudentDictation;