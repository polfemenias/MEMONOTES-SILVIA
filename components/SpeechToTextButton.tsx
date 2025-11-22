import React from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface SpeechToTextButtonProps {
  onTranscript: (transcript: string) => void;
}

const SpeechToTextButton: React.FC<SpeechToTextButtonProps> = ({ onTranscript }) => {
  const { isListening, startListening, stopListening } = useSpeechRecognition({ onTranscript });

  const handleToggleListening = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent clicks
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (isListening) {
      return (
          <div className="flex items-center gap-2 bg-white border border-rose-200 shadow-lg shadow-rose-100 rounded-full px-3 py-1.5 animate-fadeIn">
              {/* Acoustic Waves Animation */}
              <div className="flex items-end justify-center gap-[2px] h-4 w-8">
                  <div className="w-1 bg-rose-500 rounded-full animate-[bounce_1s_infinite_100ms] h-2"></div>
                  <div className="w-1 bg-rose-500 rounded-full animate-[bounce_1s_infinite_200ms] h-4"></div>
                  <div className="w-1 bg-rose-500 rounded-full animate-[bounce_1s_infinite_150ms] h-3"></div>
                  <div className="w-1 bg-rose-500 rounded-full animate-[bounce_1s_infinite_300ms] h-2"></div>
              </div>
              
              {/* Stop Button */}
              <button
                type="button"
                onClick={handleToggleListening}
                className="bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-md transition-colors ml-1"
                title="Aturar gravació"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                  </svg>
              </button>
          </div>
      )
  }

  return (
    <button
      type="button"
      onClick={handleToggleListening}
      className="p-2 rounded-full bg-white text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-indigo-100 transition-all duration-300"
      title="Començar a dictar"
    >
       {/* Icona moderna de micròfon (outline style) */}
       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
       </svg>
    </button>
  );
};

export default SpeechToTextButton;