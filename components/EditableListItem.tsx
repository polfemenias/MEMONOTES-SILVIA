import React, { useState, useRef, useEffect } from 'react';

interface EditableListItemProps {
  item?: { id: string; name: string };
  isAdding?: boolean;
  addLabel?: string;
  onUpdate?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
  onAdd?: (name: string) => void;
}

const EditableListItem: React.FC<EditableListItemProps> = ({ item, isAdding = false, addLabel = 'Afegir', onUpdate, onDelete, onAdd }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item?.name || '');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  // FIX: Use `number` for the return type of `setTimeout` in a browser environment instead of `NodeJS.Timeout`.
  const confirmTimeoutRef = useRef<number | null>(null);

  // Neteja el temporitzador si el component es desmunta
  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    };
  }, []);

  const handleUpdate = () => {
    if (item && name.trim() && onUpdate) {
      onUpdate(item.id, name.trim().toUpperCase());
    }
    setIsEditing(false);
  };

  const handleAdd = () => {
    if (name.trim() && onAdd) {
      onAdd(name.trim().toUpperCase());
      setName('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        isAdding ? handleAdd() : handleUpdate();
    } else if (e.key === 'Escape') {
        setIsEditing(false);
        setName(item?.name || '');
    }
  };

  const handleInitiateDelete = () => {
    setIsConfirmingDelete(true);
    // Cancel·la automàticament després de 3 segons
    confirmTimeoutRef.current = window.setTimeout(() => {
      setIsConfirmingDelete(false);
    }, 3000);
  };

  const handleConfirmDelete = () => {
    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
    }
    if (item && onDelete) {
      onDelete(item.id);
    }
    setIsConfirmingDelete(false);
  };
  
  const handleCancelDelete = () => {
     if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
    }
    setIsConfirmingDelete(false);
  }

  if (isAdding) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`${addLabel}...`}
          className="w-full p-2 border rounded-md"
          autoFocus
        />
        <button onClick={handleAdd} className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700">Afegir</button>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="flex items-center gap-2 w-full">
      {isEditing ? (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleUpdate}
          className="w-full p-2 border rounded-md"
          autoFocus
        />
      ) : (
        <span className="flex-grow font-medium">{item.name}</span>
      )}

      <div className="flex items-center gap-1">
        {isConfirmingDelete ? (
           <div className="flex items-center gap-2 bg-red-100 p-1 rounded-md">
                <span className="text-sm font-semibold text-red-800">Segur?</span>
                <button onClick={handleConfirmDelete} className="p-2 rounded-full hover:bg-green-200 text-green-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </button>
                 <button onClick={handleCancelDelete} className="p-2 rounded-full hover:bg-slate-200 text-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
           </div>
        ) : (
          <>
            {isEditing ? (
                <button onClick={handleUpdate} className="p-2 rounded-full hover:bg-green-100 text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </button>
            ) : (
                <button onClick={() => setIsEditing(true)} className="p-2 rounded-full hover:bg-slate-200 text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                </button>
            )}
            {onDelete && (
               <button onClick={handleInitiateDelete} className="p-2 rounded-full hover:bg-red-100 text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EditableListItem;