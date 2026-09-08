import DashboardLayout from "@/components/DashboardLayout";
import { EmptyState } from "@/components/nexus/EmptyState";
import { PageHeader } from "@/components/nexus/PageHeader";
import type { LucideIcon } from "lucide-react";

export default function Placeholder({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <DashboardLayout>
      <div className="nexus-page">
        <PageHeader eyebrow={eyebrow} title={title} description={description} icon={icon} />
        <div className="nexus-surface mt-8 rounded-3xl p-5">
          <EmptyState
            title="Estrutura preparada"
            description="Este módulo será conectado às fontes oficiais em uma próxima evolução. Nenhuma informação foi simulada."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
