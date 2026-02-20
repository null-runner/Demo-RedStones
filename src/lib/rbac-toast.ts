import { toast } from "sonner";

export function showPermissionDeniedToast(): void {
  toast.error("Azione non consentita per il tuo ruolo", {
    duration: 3000,
    position: "bottom-right",
  });
}
