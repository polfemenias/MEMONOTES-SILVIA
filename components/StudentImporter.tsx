import React, { useState, useRef } from 'react';

interface StudentImporterProps {
  onImport: (names: string[]) => void;
}

const StudentImporter: React.FC<StudentImporterProps> = ({ onImport }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFileContent(text);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = () => {
    if (fileContent) {
      const names = fileContent
        .split('\n')
        .map(name => name.trim().toUpperCase())
        .filter(name => name !== '');
      onImport(names);
      closeModal();
    }
  };

  const openModal = () => setIsModalOpen(true);
  
  const closeModal = () => {
    setIsModalOpen(false);
    setFileName('');
    setFileContent('');
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="text-sm text-sky-600 hover:text-sky-800 flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
        </svg>
        Importar Llista (Fitxer)
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Importar des de Fitxer</h3>
            <p className="text-sm text-slate-600 mb-3">
              Selecciona un fitxer <code>.txt</code> o <code>.csv</code> amb un nom d'alumne per línia.
            </p>
            
            <input
              type="file"
              ref={fileInputRef}
              accept=".txt,.csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-sky-50 file:text-sky-700
                hover:file:bg-sky-100"
            />
            
            {fileName && (
                <div className="mt-4 text-sm bg-slate-100 p-2 rounded-md">
                    Fitxer seleccionat: <span className="font-semibold">{fileName}</span>
                </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeModal} className="px-4 py-2 rounded-md bg-slate-200 hover:bg-slate-300">
                Cancel·lar
              </button>
              <button
                onClick={handleImport}
                disabled={!fileContent}
                className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 disabled:bg-sky-300"
              >
                Importar Alumnes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentImporter;
