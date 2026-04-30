// Patients mock store. In-memory mutable list.
export type MockPatient = {
  documento: string;
  tipoDocumento: string;
  nombre: string;
  email: string;
  celular: string;
  telAlterno?: string;
};

const PATIENTS: MockPatient[] = [
  {
    documento: "1001370488",
    tipoDocumento: "Cédula de ciudadanía",
    nombre: "Valentina COCO",
    email: "valentina.giraldo@cocotech.ai",
    celular: "3128736095",
    telAlterno: "3128736095",
  },
  {
    documento: "52111222",
    tipoDocumento: "Cédula de ciudadanía",
    nombre: "Andrés Felipe Ríos",
    email: "andres.rios@correo.com",
    celular: "3001234567",
  },
];

export function findPatient(doc: string): MockPatient | undefined {
  return PATIENTS.find((p) => p.documento === doc.trim());
}

export function createPatient(p: MockPatient): MockPatient {
  const existing = findPatient(p.documento);
  if (existing) return existing;
  PATIENTS.push(p);
  return p;
}

export function updatePatient(doc: string, partial: Partial<MockPatient>): MockPatient | undefined {
  const idx = PATIENTS.findIndex((p) => p.documento === doc);
  if (idx === -1) return undefined;
  PATIENTS[idx] = { ...PATIENTS[idx], ...partial };
  return PATIENTS[idx];
}

export function listPatients(): MockPatient[] {
  return [...PATIENTS];
}
