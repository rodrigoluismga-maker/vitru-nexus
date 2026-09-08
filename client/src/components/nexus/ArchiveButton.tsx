import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";
import { useState } from "react";

export function ArchiveButton({
  name,
  onConfirm,
}: {
  name: string;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-content-tertiary hover:text-[var(--status-negative)]"
        >
          <Archive className="mr-2 h-3.5 w-3.5" />
          Arquivar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-white/10 bg-[var(--surface-2)]/96 backdrop-blur-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Arquivar cadastro?</AlertDialogTitle>
          <AlertDialogDescription>
            “{name}” deixará de aparecer nas seleções ativas, mas continuará preservado para
            histórico e integridade dos vínculos existentes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={async event => {
              event.preventDefault();
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
            className="bg-[var(--brand-accent)] font-bold text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
          >
            {busy ? "Arquivando..." : "Confirmar arquivamento"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
