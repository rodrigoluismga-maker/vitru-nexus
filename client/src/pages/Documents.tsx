import DashboardLayout from "@/components/DashboardLayout";
import { DocumentCenter } from "@/components/nexus/DocumentCenter";
import { PageHeader } from "@/components/nexus/PageHeader";
import { FileText } from "lucide-react";

export default function Documents() {
  return (
    <DashboardLayout>
      <div className="nexus-page">
        <PageHeader
          eyebrow="Knowledge Center"
          title="Documentos"
          description="Arquivos, links, versões, tags e classificações conectados ao portfólio estratégico."
          icon={FileText}
        />
        <section className="nexus-surface mt-8 rounded-3xl p-5 sm:p-6">
          <DocumentCenter />
        </section>
      </div>
    </DashboardLayout>
  );
}
