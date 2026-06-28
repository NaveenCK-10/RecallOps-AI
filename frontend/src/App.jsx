import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import AnalyzeIncident from './pages/AnalyzeIncident';
import MemoryTimeline from './pages/MemoryTimeline';
import RuntimeDashboard from './pages/RuntimeDashboard';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="/analyze" element={<AnalyzeIncident />} />
            <Route path="/memory" element={<MemoryTimeline />} />
            <Route path="/runtime" element={<RuntimeDashboard />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
