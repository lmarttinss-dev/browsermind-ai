import { MODELS } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { ChevronDown } from "lucide-react";

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useAppStore();

  return (
    <div className="relative">
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
        className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
      >
        {MODELS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
