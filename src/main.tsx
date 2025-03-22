import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { BrowserRouter, Routes, Route } from "react-router";
import { ToastProvider } from './components/notification-toast/index.tsx';
import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query'


const queryClient = new QueryClient();

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
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AppNav />
        </ToastProvider>
      </QueryClientProvider>
    </Theme>
  </BrowserRouter>,
)

