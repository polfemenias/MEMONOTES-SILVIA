import React, { useEffect } from 'react';

// Aquest hook ajusta l'alçada d'un textarea automàticament per adaptar-se al seu contingut.
export const useAutoResizeTextArea = (
  textAreaRef: React.RefObject<HTMLTextAreaElement>,
  value: string
) => {
  useEffect(() => {
    if (textAreaRef.current) {
      const el = textAreaRef.current;
      // Restableix l'alçada per obtenir la nova scrollHeight correcta
      el.style.height = 'auto';
      // Estableix la nova alçada, afegint 2px per compensar les vores i evitar talls
      el.style.height = `${el.scrollHeight + 2}px`;
    }
  }, [textAreaRef, value]);
};
