import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./i18n";
import { WishlistProvider } from "./contexts/WishlistContext";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <WishlistProvider>
      <App />
    </WishlistProvider>
  </BrowserRouter>
);