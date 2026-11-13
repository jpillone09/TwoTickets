import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { AuthPromptProvider } from "./components/AuthPrompt";
import { ThemeProvider, applyInitialTheme } from "./lib/theme";

applyInitialTheme(); // before the first paint, so there's no flash of the wrong theme

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AuthPromptProvider>
            <App />
          </AuthPromptProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
