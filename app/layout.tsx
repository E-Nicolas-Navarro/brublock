import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brublock — Un nuevo modo de construir contención",
  description: "Explorá bloques de hormigón modulares en 3D. Conocé las piezas y visualizá tu próximo proyecto de contención con Brublock.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-AR"><body>{children}</body></html>;
}
