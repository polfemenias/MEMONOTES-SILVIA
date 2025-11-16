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

// FIX: Cast window to `any` to access browser-specific speech recognition APIs without TypeScript errors.
// Rename to `SpeechRecognitionApi` to avoid conflict with the `SpeechRecognition` type.
const SpeechRecognitionApi = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSupported = !!SpeechRecognitionApi;

export const useSpeechRecognition = ({ onTranscript }: SpeechRecognitionOptions): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  // FIX: Use `any` for the ref type as SpeechRecognition types are not available.
  const recognitionRef = useRef<any | null>(null);

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
    };

    recognition.onend = () => {
      setIsListening(false);
      setTranscript(''); // Reset for next use
    };

    // FIX: Use `any` for event type due to missing speech recognition typings.
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    // FIX: Use `any` for event type due to missing speech recognition typings.
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        onTranscript(finalTranscript);
      }
    };
    
    recognitionRef.current = recognition;

    return () => {
        if(recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTranscript]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return { isListening, transcript, startListening, stopListening };
};