import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import LoadingState from "../feedback/LoadingState.jsx";
import ErrorBoundary from "../feedback/ErrorBoundary.jsx";

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-subtle dark:bg-surface-dark">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            <Suspense fallback={<LoadingState label="Loading page…" />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}