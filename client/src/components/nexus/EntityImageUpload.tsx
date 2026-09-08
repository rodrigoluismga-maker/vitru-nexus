import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function EntityImageUpload({
  targetType,
  targetId,
  currentUrl,
  label,
  onDone,
}: {
  targetType: "company_logo" | "project_cover";
  targetId?: number;
  currentUrl?: string | null;
  label: string;
  onDone: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const upload = trpc.media.uploadEntityImage.useMutation();
  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  const select = async (file?: File) => {
    if (!file || !targetId) return;
    if (file.size > 8 * 1024 * 1024) return toast.error("A imagem deve ter no máximo 8 MB.");
    try {
      setPreview(URL.createObjectURL(file));
      await upload.mutateAsync({
        targetType,
        targetId,
        fileName: file.name,
        mimeType: file.type,
        dataBase64: await toBase64(file),
      });
      onDone();
      toast.success(`${label} atualizada.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    }
  };
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={event => select(event.target.files?.[0])}
      />
      <div className="flex items-center gap-4">
        {preview ? (
          <img
            src={preview}
            alt="Prévia"
            className="h-16 w-24 rounded-xl border border-white/10 object-cover"
          />
        ) : (
          <span className="flex h-16 w-24 items-center justify-center rounded-xl border border-dashed border-white/12">
            <ImagePlus className="h-5 w-5 text-content-tertiary" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-content-secondary">{label}</p>
          <p className="mt-1 text-[11px] text-content-tertiary">PNG, JPG, WEBP ou SVG · até 8 MB</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={!targetId || upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {upload.isPending
              ? "Enviando..."
              : targetId
                ? "Selecionar imagem"
                : "Salve o cadastro primeiro"}
          </Button>
        </div>
      </div>
    </div>
  );
}
