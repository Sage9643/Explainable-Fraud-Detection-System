import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";

// Lazy-loaded so each page becomes its own bundle chunk - loaded only when
// the user navigates to it, rather than all pages (and their chart/table
// dependencies) shipping in one monolithic bundle. AppLayout provides the
// single Suspense boundary these resolve against.
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const PredictTransaction = lazy(() => import("./pages/PredictTransaction.jsx"));
const BatchPrediction = lazy(() => import("./pages/BatchPrediction.jsx"));
const Explainability = lazy(() => import("./pages/Explainability.jsx"));
const ModelAnalytics = lazy(() => import("./pages/ModelAnalytics.jsx"));
const PredictionHistory = lazy(() => import("./pages/PredictionHistory.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const AboutModel = lazy(() => import("./pages/AboutModel.jsx"));

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