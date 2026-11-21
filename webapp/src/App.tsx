import { AppShell, HomePage } from "@/components/AppShell";
import { MarketAnalysisPage } from "@/pages/MarketAnalysisPage";
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { NavigationBar } from "@/components/NavigationBar";
import { BrowserViewport } from "@/components/BrowserViewport";
import { ChatPanel } from "@/components/ChatPanel";
import { ActionConsole } from "@/components/ActionConsole";
import { SettingsModal } from "@/components/SettingsModal";
import { PipelinePage } from "@/pages/PipelinePage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { SupplierAnalysisPage } from "@/pages/SupplierAnalysisPage";
import { SupplierDetailPage } from "@/pages/SupplierDetailPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { CategoryDashboardPage } from "@/pages/CategoryDashboardPage";
import ImportCalculatorPage from "@/pages/ImportCalculatorPage";

function MainView() {
  return (
    <div className="browser-studio">
      <div className="studio-heading"><div><h1>Assistente de navegação</h1><p>Explore páginas e transforme contexto em respostas.</p></div><span>WORKSPACE / BROWSER</span></div>
      <NavigationBar />
      {/* Main content */}
      <div className="browser-workspace flex-1 flex overflow-hidden">
        {/* Left: Browser viewport + action console */}
        <div className="browser-preview min-w-0 flex-1 flex flex-col">
          <BrowserViewport />
          <ActionConsole />
        </div>

        {/* Right: Chat panel */}
        <ChatPanel />
      </div>


    </div>
  );
}

export default function App() {
  const { checkStatus } = useStore();

  // Poll server status
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/browser" element={<MainView />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/pipeline/:id" element={<ProductDetailPage />} />
        <Route path="/pipeline/:id/supplier/:supplierIndex" element={<SupplierDetailPage />} />
        <Route path="/supplier-analysis" element={<SupplierAnalysisPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/categories/:id" element={<CategoryDashboardPage />} />
        <Route path="/market-analysis" element={<MarketAnalysisPage />} />
        <Route path="/calculator" element={<ImportCalculatorPage />} />
      </Routes>

      <SettingsModal />
    </AppShell>
  );
}
