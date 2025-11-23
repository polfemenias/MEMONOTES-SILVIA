
import { useState, useRef, useEffect, useCallback } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
}

interface SpeechRecognitionOptions {
  onTranscript: (transcript: string) => void;
}

const SpeechRecognitionApi = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSupported = !!SpeechRecognitionApi;

const capitalizeFirstLetter = (string: string) => {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
};

export const useSpeechRecognition = ({ onTranscript }: SpeechRecognitionOptions): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // Refs to persist across renders without triggering effects
  const recognitionRef = useRef<any | null>(null);
  const userStoppedRef = useRef(false); 

  useEffect(() => {
    if (!isSupported) {
      console.warn('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ca-ES';

    recognition.onresult = (event: any) => {
      let finalTranscriptChunk = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptChunk += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscriptChunk) {
        const cleanText = finalTranscriptChunk.trim();
        if (cleanText) {
            const capitalizedText = capitalizeFirstLetter(cleanText);
            setTranscript(prev => prev + capitalizedText);
            onTranscript(capitalizedText);
        }
      }
    };

    // Robust handling of the 'end' event to simulate true continuous listening
    recognition.onend = () => {
        // Only switch state to "not listening" if the user EXPLICITLY stopped it.
        if (userStoppedRef.current) {
            setIsListening(false);
        } else {
            // If it stopped due to silence or network, restart immediately.
            // We keep isListening = true so the UI doesn't flicker.
            try {
                recognition.start();
            } catch (e) {
                // If immediate restart fails (race condition), wait slightly and retry
                setTimeout(() => {
                    if (!userStoppedRef.current) {
                        try {
                            recognition.start();
                        } catch (e2) {
                            console.error("Failed to restart speech recognition", e2);
                            setIsListening(false);
                            userStoppedRef.current = true;
                        }
                    }
                }, 100);
            }
        }
    };

    recognition.onerror = (event: any) => {
        // 'no-speech' happens when silence is detected. We ignore it because onend will restart.
        if (event.error === 'no-speech') {
            return;
        }
        
        console.warn('Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setIsListening(false);
            userStoppedRef.current = true;
        }
    };
    
    recognitionRef.current = recognition;

    return () => {
        if(recognitionRef.current) {
            userStoppedRef.current = true; 
            recognitionRef.current.abort(); // abort is faster than stop for unmounting
        }
    };
  }, [onTranscript]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      userStoppedRef.current = false;
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting speech recognition:", e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      userStoppedRef.current = true;
      setIsListening(false);
      recognitionRef.current.stop();
    }
  }, []);

  return { isListening, transcript, startListening, stopListening };
};
