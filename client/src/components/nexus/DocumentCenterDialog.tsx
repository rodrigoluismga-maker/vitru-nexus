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
import { Link2, UploadCloud } from "lucide-react";
import type { RefObject } from "react";
import type { DocumentAccessLevel, DocumentFormState } from "./DocumentCenterTypes";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  mode: "file" | "link";
  setMode: (mode: "file" | "link") => void;
  file: File | null;
  setFile: (file: File | null) => void;
  form: DocumentFormState;
  setForm: (form: DocumentFormState) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  fixedProjectId?: number;
  projects?: Array<{ id: number; name: string }>;
  categoryOptions?: string[];
  save: () => void;
  pending: boolean;
};

export function DocumentCenterDialog(props: Props) {
  const {
    open,
    setOpen,
    mode,
    setMode,
    file,
    setFile,
    form,
    setForm,
    inputRef,
    fixedProjectId,
    projects,
    categoryOptions,
    save,
    pending,
  } = props;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[var(--surface-2)]/96 backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar documento</DialogTitle>
          <DialogDescription>
            Arquivos são armazenados fora do banco; somente metadados e vínculos permanecem no
            NEXUS.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === "file" ? "secondary" : "outline"}
              onClick={() => setMode("file")}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Arquivo
            </Button>
            <Button
              variant={mode === "link" ? "secondary" : "outline"}
              onClick={() => setMode("link")}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Link externo
            </Button>
          </div>
          {!fixedProjectId && (
            <Field label="Projeto">
              <Select
                value={form.projectId}
                onValueChange={value => setForm({ ...form, projectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map(project => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          {mode === "file" ? (
            <div>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.pptx,.ppt,.docx,.doc,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={event => setFile(event.target.files?.[0] ?? null)}
              />
              <button
                onClick={() => inputRef.current?.click()}
                className={
                  "flex w-full flex-col items-center rounded-2xl border border-dashed " +
                  "border-white/12 bg-white/[0.02] p-8 text-center " +
                  "hover:border-[var(--brand-violet)]/30 " +
                  "hover:bg-[var(--brand-violet-deep)]/[0.04]"
                }
              >
                <UploadCloud className="h-6 w-6 text-[var(--brand-violet)]" />
                <span className="mt-3 text-sm font-semibold text-content-secondary">
                  {file?.name || "Selecionar arquivo"}
                </span>
                <span className="mt-1 text-[11px] text-content-tertiary">
                  PDF, Office ou imagem · até 15 MB
                </span>
              </button>
            </div>
          ) : (
            <Field label="URL externa">
              <Input
                type="url"
                value={form.externalUrl}
                onChange={event => setForm({ ...form, externalUrl: event.target.value })}
                placeholder="https://..."
              />
            </Field>
          )}
          <Field label="Título">
            <Input
              value={form.title}
              onChange={event => setForm({ ...form, title: event.target.value })}
              placeholder={file?.name || "Título do documento"}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoria">
              {categoryOptions?.length ? (
                <Select
                  value={form.category}
                  onValueChange={value => setForm({ ...form, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.category}
                  onChange={event => setForm({ ...form, category: event.target.value })}
                />
              )}
            </Field>
            <Field label="Versão">
              <Input
                value={form.version}
                onChange={event => setForm({ ...form, version: event.target.value })}
              />
            </Field>
          </div>
          <Field label="Nível de acesso">
            <Select
              value={form.accessLevel}
              onValueChange={value =>
                setForm({ ...form, accessLevel: value as DocumentAccessLevel })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Projeto</SelectItem>
                <SelectItem value="restricted">Restrito</SelectItem>
                <SelectItem value="executive">Executivo</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tags">
            <Input
              value={form.tags}
              onChange={event => setForm({ ...form, tags: event.target.value })}
              placeholder="orçamento, aprovação, versão final"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={save}
            disabled={pending || (!file && mode === "file")}
            className="bg-[var(--brand-accent)] font-bold text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
          >
            {pending ? "Enviando..." : "Salvar documento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
