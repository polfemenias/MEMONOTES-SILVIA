
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
      className={`p-2 rounded-full transition-colors ${
        isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-sky-500 text-white hover:bg-sky-600'
      }`}
      title={isListening ? 'Aturar enregistrament' : 'Començar a dictar'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
        <path fillRule="evenodd" d="M5.5 8.5A.5.5 0 016 8v1a4 4 0 004 4 .5.5 0 010 1 5 5 0 01-5-5V8.5A.5.5 0 015.5 8.5zM14 9a.5.5 0 01.5-.5V8a5 5 0 00-5-5 .5.5 0 010-1 6 6 0 016 6v.5a.5.5 0 01-.5.5z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M10 18a1 1 0 001-1v-4.059a4.975 4.975 0 01-2 0V17a1 1 0 001 1z" clipRule="evenodd" />
      </svg>
    </button>
  );
};

export default SpeechToTextButton;
