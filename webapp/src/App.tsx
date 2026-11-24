import { comparisonDestination } from "@/lib/listing-comparison";
import { ListingComparisonEntryPage } from "@/pages/ListingComparisonEntryPage";
import { AppShell, HomePage } from "@/components/AppShell";
import { useEffect } from "react";
import { Link, Navigate, Routes, Route, useSearchParams } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { NavigationBar } from "@/components/NavigationBar";
import { BrowserViewport } from "@/components/BrowserViewport";
import { ChatPanel } from "@/components/ChatPanel";
import { ActionConsole } from "@/components/ActionConsole";
import { SettingsModal } from "@/components/SettingsModal";
import { PipelinePage } from "@/pages/PipelinePage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { SuppliersPage, SupplierFormPage, SupplierRecordPage } from "@/pages/SuppliersPage";
import { SupplierAnalysisPage } from "@/pages/SupplierAnalysisPage";
import { SupplierDetailPage } from "@/pages/SupplierDetailPage";
import { CategoriesPage, CategoryFormPage } from "@/pages/CategoriesPage";
import { CategoryDashboardPage } from "@/pages/CategoryDashboardPage";
import ImportCalculatorPage from "@/pages/ImportCalculatorPage";

function MainView() {
  const [searchParams] = useSearchParams();
  const comparisonProductId = searchParams.get("comparisonProductId") || undefined;
  return (
    <div className="browser-studio">
      <div className="studio-heading"><div><h1>Assistente de navegação</h1><p>Explore páginas e transforme contexto em respostas.</p></div><span>WORKSPACE / BROWSER</span></div>
      <NavigationBar />
      {comparisonProductId && <div className="px-4 py-3 border-b border-gray-700">
        <Link className="text-sm text-indigo-300 underline" to={comparisonDestination(comparisonProductId)}>Voltar à comparação</Link>
      </div>}
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
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/suppliers/new" element={<SupplierFormPage />} />
        <Route path="/suppliers/:id" element={<SupplierRecordPage />} />
        <Route path="/suppliers/:id/edit" element={<SupplierFormPage />} />
        <Route path="/suppliers/:id/delete" element={<SupplierRecordPage deleting />} />
        <Route path="/supplier-analysis" element={<SupplierAnalysisPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/categories/new" element={<CategoryFormPage />} />
        <Route path="/categories/:id/edit" element={<CategoryFormPage />} />
        <Route path="/categories/:id" element={<CategoryDashboardPage />} />
        <Route path="/market-analysis" element={<Navigate to="/listing-comparison" replace />} />
        <Route path="/listing-comparison" element={<ListingComparisonEntryPage />} />
        <Route path="/calculator" element={<ImportCalculatorPage />} />
      </Routes>

      <SettingsModal />
    </AppShell>
  );
}
