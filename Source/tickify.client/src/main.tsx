import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { BookingProvider } from "./contexts/BookingContext";
import App from "./App";
import "./index.css";
import "./i18n";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <BookingProvider>
      <App />
    </BookingProvider>
  </BrowserRouter>
);
