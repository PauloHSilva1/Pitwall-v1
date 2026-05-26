import React, { createContext, useContext, useState, ReactNode } from 'react';

// 1. Definimos o que estará disponível na "nuvem"
export interface ProjectContextType { // Exporting interface for easier usage if needed
  projectData: ProjectData | null;
  setProjectData: (data: ProjectData | null) => void;
  filePath: string | null;
  setFilePath: (path: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);

  // Auto-save logic
  React.useEffect(() => {
    if (filePath && projectData) {
      const timer = setTimeout(() => {
        // Create a copy to sanitize
        const dataToSave = { ...projectData };
        // Remove internal fields that shouldn't be in the JSON file
        delete (dataToSave as any).path;
        delete (dataToSave as any).content;

        (window as any).api.saveFile(filePath, JSON.stringify(dataToSave, null, 2));
      }, 1000); // 1-second debounce

      return () => clearTimeout(timer);
    }
  }, [projectData, filePath]);

  return (
    <ProjectContext.Provider value={{ projectData, setProjectData, filePath, setFilePath }}>
      {children}
    </ProjectContext.Provider>
  );
}

// 3. Hook personalizado para facilitar o uso nos outros componentes
export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject deve ser usado dentro de um ProjectProvider");
  return context;
}