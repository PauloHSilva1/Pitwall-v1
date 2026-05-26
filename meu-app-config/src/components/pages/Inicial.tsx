import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. Importe o hook
import { useProject } from "@/context/ProjectContext"; // Importe o hook

const DEFAULT_PROJECT_DATA = {
  "name": "Novo Projeto",
  "description": "Este é um novo projeto criado.",
  "config": {
    "display": {
      "1": {
        "name": "default",
        "dados": {
          "dado1": "null",
          "dado2": "null",
          "dado3": "null",
          "dado4": "null",
          "dado5": "null",
          "dado6": "null"
        },
        "lights": {
          "shift": {
            "light1": 1000,
            "light2": 2000,
            "light3": 3000,
            "light4": 4000,
            "light5": 5000,
            "light6": 7500,
            "max": 8000
          },
          "warning": {
            "case1": {
              "color": "null",
              "data": "null",
              "value": 0
            }
          }
        }
      }
    },
    "sensores": {
      "default": {
        "nome": "default",
        "a0": 0,
        "a1": 0,
        "a2": 0,
        "a3": 0
      }
    },
    "PDM": {
      "output": {}
    },
    "MAQ": {
      "1": {
        "id": "1",
        "nome": "default",
        "veiculo": "Standard",
        "dataLogger": "MAQV1",
        "velocidade": "km/h",
        "temperatura": "C",
        "lapTimer": "GPS",
        "frequenciaTotal": 1000,
        "canais": []
      }
    }
  }
};

export default function Page() {
  const { projectData, setProjectData, setFilePath } = useProject();
  const navigate = useNavigate();
  // 1. Transformamos a função em async para usar await
  const openProject = async () => {
    try {
      // 2. Chamamos a função da ponte (bridge) definida no window
      const result = await window.api.openFile();

      if (result) {
        // O parse transforma a string em um objeto. 
        // Usamos 'as ProjectData' para o TS saber o formato.
        // Dentro de openProject na Page
        const parsedData = JSON.parse(result.content) as ProjectData;
        // Adicionando o caminho do arquivo ao objeto, pois o JSON as vezes só contém os dados
        parsedData.path = result.filePath;
        parsedData.content = result.content;

        setProjectData(parsedData);
        setFilePath(result.filePath); // Sets the file path for auto-saving
        navigate('/principal'); // 3. Navegamos para a página principal

      } else {
        // Caso o usuário feche a janela de seleção sem escolher nada
        console.log("Seleção de arquivo cancelada.");
      }
    } catch (error) {
      console.error("Erro ao tentar abrir o projeto:", error);
    }
  };

  const newProject = async () => {
    try {
      const content = JSON.stringify(DEFAULT_PROJECT_DATA, null, 2);
      const result = await window.api.saveFileDialog(content);

      if (result && result.success && result.filePath) {
        const parsedData = JSON.parse(content) as ProjectData;
        parsedData.path = result.filePath;
        parsedData.content = content;

        setProjectData(parsedData);
        setFilePath(result.filePath);
        navigate('/principal');
      }
    } catch (error) {
      console.error("Erro ao criar novo projeto:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#000000] text-white p-6">
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-5xl font-black tracking-tight uppercase">Cefast Pitwall</h1>
        <p className="text-gray-400">Abra um projeto existente ou inicie um novo</p>
      </div>

      <div className="flex gap-4">
        {/* Botão Open */}
        <Button
          variant="outline"
          className="bg-red-600 hover:bg-red-700 text-white border-none hover:text-black"
          onClick={openProject} // Já está corretamente referenciado
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          Open Project
        </Button>

        {/* Botão New */}
        <Button
          className="bg-red-600 hover:bg-red-700 text-white border-none hover:text-black"
          onClick={newProject}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>
  );
}