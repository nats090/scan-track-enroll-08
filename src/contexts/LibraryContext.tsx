import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type LibraryType = 'notre-dame' | 'ibed';

interface LibraryContextType {
  currentLibrary: LibraryType;
  setCurrentLibrary: (library: LibraryType) => void;
  libraries: { id: LibraryType; name: string; fullName: string }[];
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};

interface LibraryProviderProps {
  children: ReactNode;
}

export const LibraryProvider: React.FC<LibraryProviderProps> = ({ children }) => {
  const [currentLibrary, setCurrentLibrary] = useState<LibraryType>('notre-dame');

  const libraries = [
    { id: 'notre-dame' as LibraryType, name: 'Notre Dame', fullName: 'Notre Dame of Kidapawan College Library' },
    { id: 'ibed' as LibraryType, name: 'IBED', fullName: 'IBED Library' }
  ];

  // Load saved library preference
  useEffect(() => {
    const savedLibrary = localStorage.getItem('selectedLibrary') as LibraryType;
    if (savedLibrary && libraries.some(lib => lib.id === savedLibrary)) {
      setCurrentLibrary(savedLibrary);
    }
  }, []);

  // Save library preference
  const handleSetCurrentLibrary = (library: LibraryType) => {
    setCurrentLibrary(library);
    localStorage.setItem('selectedLibrary', library);
  };

  return (
    <LibraryContext.Provider value={{
      currentLibrary,
      setCurrentLibrary: handleSetCurrentLibrary,
      libraries
    }}>
      {children}
    </LibraryContext.Provider>
  );
};