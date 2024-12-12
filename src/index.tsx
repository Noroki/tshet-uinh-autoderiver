import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./Components/App";

import "./i18n";

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
