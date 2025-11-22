
import React from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface SpeechToTextButtonProps {
  onTranscript: (transcript: string) => void;
}

const SpeechToTextButton: React.FC<SpeechToTextButtonProps> = ({ onTranscript }) => {
  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition({ onTranscript });

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleListening}
      className={`p-2 rounded-full transition-all duration-300 ${
        isListening 
        ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 scale-110' 
        : 'bg-white text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-indigo-100'
      }`}
      title={isListening ? 'Aturar enregistrament' : 'Començar a dictar'}
    >
      {isListening ? (
        /* Icona d'ona de so / aturar per quan està gravant */
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 animate-pulse">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
        </svg>
      ) : (
        /* Icona moderna de micròfon (outline style) */
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
        </svg>
      )}
    </button>
  );
};

export default SpeechToTextButton;
