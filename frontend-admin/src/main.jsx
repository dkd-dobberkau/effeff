import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import FormsList from "./pages/FormsList";
import FormEditor from "./pages/FormEditor";
import Submissions from "./pages/Submissions";
import NotFound from "./pages/NotFound";
import FormRenderer from "./form-renderer/FormRenderer";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          {/* Public form renderer — no admin layout */}
          <Route path="/f/:slug" element={<FormRenderer />} />

          {/* Login page — public */}
          <Route path="/login" element={<Login />} />

          {/* Admin routes — protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<FormsList />} />
              <Route path="forms/:id" element={<FormEditor />} />
              <Route path="forms/:id/submissions" element={<Submissions />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
