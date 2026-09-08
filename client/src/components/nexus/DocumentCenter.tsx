import { EmptyState } from "@/components/nexus/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Archive,
  ExternalLink,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Link2,
  Plus,
  Search,
  UploadCloud,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DocumentCenterDialog } from "./DocumentCenterDialog";
import { initialDocumentForm } from "./DocumentCenterTypes";
export function DocumentCenter({
  fixedProjectId,
  fixedActionId,
  fixedDecisionId,
  categoryOptions,
}: {
  fixedProjectId?: number;
  fixedActionId?: number;
  fixedDecisionId?: number;
  categoryOptions?: string[];
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    ...initialDocumentForm,
    projectId: fixedProjectId ? String(fixedProjectId) : "",
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const documents = trpc.documents.list.useQuery({
    projectId: fixedProjectId,
    actionId: fixedActionId,
    decisionId: fixedDecisionId,
  });
  const projects = trpc.projects.list.useQuery();
  const upload = trpc.documents.upload.useMutation();
  const createLink = trpc.documents.addLink.useMutation();
  const openDocument = trpc.documents.open.useMutation();
  const archiveDocument = trpc.documents.archive.useMutation();
  const selectedProjectId = fixedProjectId ?? Number(form.projectId);
  const filtered = useMemo(
    () =>
      (documents.data ?? []).filter(document =>
        `${document.title} ${document.fileName ?? ""} ${document.category ?? ""} ${(document.tags ?? []).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [documents.data, search]
  );
  const projectName = (projectId: number | null) =>
    projects.data?.find(project => project.id === projectId)?.name ?? "Sem projeto";
  const reset = () => {
    setFile(null);
    setForm({ ...initialDocumentForm, projectId: fixedProjectId ? String(fixedProjectId) : "" });
  };
  const toBase64 = (input: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.onerror = reject;
      reader.readAsDataURL(input);
    });
  const save = async () => {
    if (!selectedProjectId) return toast.error("Selecione o projeto do documento.");
    try {
      const common = {
        title: form.title || file?.name || "Documento",
        projectId: selectedProjectId,
        actionId: fixedActionId ?? null,
        decisionId: fixedDecisionId ?? null,
        category: form.category || null,
        version: form.version || "1.0",
        tags: form.tags
          .split(",")
          .map(item => item.trim())
          .filter(Boolean),
        accessLevel: form.accessLevel,
      };
      if (mode === "file") {
        if (!file) return toast.error("Selecione um arquivo.");
        if (file.size > 15 * 1024 * 1024) return toast.error("O arquivo deve ter no máximo 15 MB.");
        await upload.mutateAsync({
          ...common,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          dataBase64: await toBase64(file),
        });
      } else {
        if (!form.externalUrl) return toast.error("Informe um link válido.");
        await createLink.mutateAsync({ ...common, externalUrl: form.externalUrl });
      }
      await utils.documents.list.invalidate();
      setOpen(false);
      reset();
      toast.success("Documento vinculado ao projeto.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o documento.");
    }
  };
  const launch = () => {
    reset();
    setOpen(true);
  };
  const openItem = async (id: number) => {
    try {
      const result = await openDocument.mutateAsync({ id });
      const parsed = new URL(result.url, window.location.origin);
      if (!["http:", "https:"].includes(parsed.protocol))
        throw new Error("Destino do documento não permitido.");
      window.open(parsed.toString(), "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir o documento.");
    }
  };
  const archiveItem = async (id: number) => {
    try {
      await archiveDocument.mutateAsync({ id });
      await utils.documents.list.invalidate();
      toast.success("Documento arquivado.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível arquivar o documento."
      );
    }
  };
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar documentos..."
            className="border-white/[0.08] bg-white/[0.035] pl-9"
          />
        </div>
        <Button
          onClick={launch}
          className={
            "bg-[var(--brand-accent)] font-bold " +
            "text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar documento
        </Button>
      </div>
      {filtered.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(document => {
            const Icon = iconFor(document.mimeType, document.kind);
            return (
              <article
                key={document.id}
                className="nexus-card-hover relative rounded-2xl border border-white/[0.06] bg-white/[0.02]"
              >
                <button
                  type="button"
                  onClick={() => openItem(document.id)}
                  disabled={openDocument.isPending}
                  className="w-full p-5 text-left disabled:opacity-60"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={
                        "flex h-10 w-10 items-center justify-center rounded-xl border " +
                        "border-[var(--brand-violet)]/15 bg-[var(--brand-violet-deep)]/10"
                      }
                    >
                      <Icon className="h-4 w-4 text-[var(--brand-violet)]" />
                    </span>
                    <ExternalLink className="h-4 w-4 text-content-tertiary" />
                  </div>
                  <h3 className="mt-5 truncate text-sm font-semibold text-content-primary">
                    {document.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 min-h-9 text-[11px] leading-5 text-content-tertiary">
                    {document.fileName || document.category || "Link externo"}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3">
                    <span className="max-w-[65%] truncate text-[11px] text-content-tertiary">
                      {projectName(document.projectId)} · v{document.version}
                    </span>
                    <span
                      className={
                        "rounded-full border border-white/[0.07] px-2 py-1 " +
                        "text-[11px] uppercase tracking-[.1em] text-content-tertiary"
                      }
                    >
                      {document.accessLevel}
                    </span>
                  </div>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => void archiveItem(document.id)}
                  disabled={archiveDocument.isPending}
                  className="absolute right-12 top-4 h-8 w-8"
                  aria-label={`Arquivar ${document.title}`}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            title="Nenhum documento encontrado"
            description={
              "Anexe arquivos ou registre links " +
              "oficiais vinculados aos objetos de governan\u00E7a."
            }
          />
        </div>
      )}
      <DocumentCenterDialog
        open={open}
        setOpen={setOpen}
        mode={mode}
        setMode={setMode}
        file={file}
        setFile={setFile}
        form={form}
        setForm={setForm}
        inputRef={inputRef}
        fixedProjectId={fixedProjectId}
        projects={projects.data}
        categoryOptions={categoryOptions}
        save={save}
        pending={upload.isPending || createLink.isPending}
      />
    </>
  );
}
function iconFor(mimeType: string | null, kind: "file" | "link") {
  if (kind === "link") return Link2;
  if (mimeType?.startsWith("image/")) return FileImage;
  if (mimeType?.includes("sheet") || mimeType?.includes("excel")) return FileSpreadsheet;
  if (mimeType?.includes("zip")) return FileArchive;
  if (mimeType?.includes("pdf") || mimeType?.includes("word")) return FileText;
  return File;
}
