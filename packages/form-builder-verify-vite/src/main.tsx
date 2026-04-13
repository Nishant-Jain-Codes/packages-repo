import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { FormBuilderPlugIn } from "@aditya-sharma-salescode/form-builder";
import "@aditya-sharma-salescode/shared-ui/index.css";
import "./index.css";

/**
 * Mirrors consumer wiring: mount workspace under /form-workspace/* with matching routePrefix.
 * Dev proxy in vite.config.ts forwards /api/convai → local stub (optional).
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/form-workspace/*"
          element={<FormBuilderPlugIn routePrefix="/form-workspace" />}
        />
        <Route path="/" element={<Navigate to="/form-workspace/manage-forms" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
