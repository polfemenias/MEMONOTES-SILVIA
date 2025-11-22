import { useState, useRef, useEffect } from 'react';

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
  const recognitionRef = useRef<any | null>(null);
  // Ref to track if the user *intentionally* stopped the recording
  const userStoppedRef = useRef(false);

  useEffect(() => {
    if (!isSupported) {
      console.warn('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ca-ES'; // Catalan

    recognition.onstart = () => {
      setIsListening(true);
      userStoppedRef.current = false;
    };

    recognition.onend = () => {
      // If the user didn't click stop, but the browser stopped it (silence), restart it.
      if (!userStoppedRef.current) {
         try {
            recognition.start();
         } catch (e) {
            // Sometimes it might fail to restart immediately
            setIsListening(false);
         }
      } else {
         setIsListening(false);
         setTranscript('');
      }
    };

    recognition.onerror = (event: any) => {
      // If not-allowed or service-not-allowed, we should probably stop trying
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          userStoppedRef.current = true;
          setIsListening(false);
      }
      console.error('Speech recognition error:', event.error);
    };

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
    
    recognitionRef.current = recognition;

    return () => {
        if(recognitionRef.current) {
            userStoppedRef.current = true; // Ensure we don't auto-restart on unmount
            recognitionRef.current.stop();
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTranscript]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      userStoppedRef.current = false;
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting speech recognition:", e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      userStoppedRef.current = true; // Mark as intentional stop
      recognitionRef.current.stop();
    }
  };

  return { isListening, transcript, startListening, stopListening };
};