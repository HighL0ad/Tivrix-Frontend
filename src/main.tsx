import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { BrowserRouter } from "react-router";

import { App } from "@/app/App";
import { queryClient } from "@/shared/api/query-client";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NuqsAdapter>
          <App />
        </NuqsAdapter>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
