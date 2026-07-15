import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PredictTransaction from "./pages/PredictTransaction.jsx";
import BatchPrediction from "./pages/BatchPrediction.jsx";
import Explainability from "./pages/Explainability.jsx";
import ModelAnalytics from "./pages/ModelAnalytics.jsx";
import PredictionHistory from "./pages/PredictionHistory.jsx";
import Settings from "./pages/Settings.jsx";
import AboutModel from "./pages/AboutModel.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/predict" element={<PredictTransaction />} />
        <Route path="/batch" element={<BatchPrediction />} />
        <Route path="/explainability" element={<Explainability />} />
        <Route path="/analytics" element={<ModelAnalytics />} />
        <Route path="/history" element={<PredictionHistory />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about-model" element={<AboutModel />} />
      </Route>
    </Routes>
  );
}
