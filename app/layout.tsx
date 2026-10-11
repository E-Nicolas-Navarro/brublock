import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BRUBLOCKS | Cantera Moreno — Bloques de hormigón",
  description: "Explorá el catálogo BRUBLOCKS de Cantera Moreno: medidas, pesos y seis modelos 3D de bloques de hormigón para visualizar tu proyecto de contención.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-AR"><body>{children}</body></html>;
}
