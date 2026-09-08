export type DocumentAccessLevel = "project" | "restricted" | "executive";

export type DocumentFormState = {
  title: string;
  category: string;
  version: string;
  tags: string;
  accessLevel: DocumentAccessLevel;
  externalUrl: string;
  projectId: string;
};

export const initialDocumentForm: DocumentFormState = {
  title: "",
  category: "Documento do projeto",
  version: "1.0",
  tags: "",
  accessLevel: "project",
  externalUrl: "",
  projectId: "",
};
