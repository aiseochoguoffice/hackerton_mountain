import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { MountainsPage } from './pages/MountainsPage';
import { MountainDetailPage } from './pages/MountainDetailPage';
import { ChecklistPage } from './pages/ChecklistPage';
import { ChecklistResultPage } from './pages/ChecklistResultPage';
import { RiskMapPage } from './pages/RiskMapPage';
import { AccidentTypesPage } from './pages/AccidentTypesPage';
import { StatsPage } from './pages/StatsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/mountains" element={<MountainsPage />} />
          <Route path="/mountains/:code" element={<MountainDetailPage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/checklist/result" element={<ChecklistResultPage />} />
          <Route path="/risk-map" element={<RiskMapPage />} />
          <Route path="/accident-types" element={<AccidentTypesPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
