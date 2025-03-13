import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { BrowserRouter, Routes, Route } from "react-router";

export function AppNav() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
    </Routes>
  );
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Theme>
      <AppNav />
    </Theme>
  </BrowserRouter>,
)

