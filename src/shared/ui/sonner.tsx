import { Toaster as SonnerToaster } from "sonner";

function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast: "rounded-lg border text-sm",
        },
      }}
    />
  );
}

export { Toaster };
