# Brublock

Web de producto en español con Next.js App Router, React Three Fiber y Drei. Usa las seis geometrías del archivo original `brunoblok.glb` para mostrar las piezas y configurar un muro conceptual.

## Iniciar

Requiere Node.js 20.9 o superior.

```bash
npm ci
npm run dev
```

Abrí [localhost:3000](http://localhost:3000). Para producción: `npm run build` y `npm run start`.

## Qué podés probar

- Girar y acercar las piezas originales en el catálogo.
- Construir una composición de 2–8 bloques de largo y 1–6 capas.
- Alternar capas alineadas o trabadas con medios bloques en los extremos.
- Separar las capas y restablecer la composición.
- Preparar, copiar y descargar una consulta con el listado de piezas.

El formulario **no envía ni almacena datos**. Para habilitar canales de contacto, copiá `.env.example` a `.env.local`, completá `NEXT_PUBLIC_WHATSAPP` y/o `NEXT_PUBLIC_CONTACT_EMAIL`, y reiniciá el servidor. En producción, configurá esas variables antes de compilar. WhatsApp abre un mensaje preparado; email abre el cliente del visitante.

## Modelos y límites

| Modelo | Nombre de presentación |
| --- | --- |
| A00 | Estándar |
| A01 | Media altura |
| B | Medio bloque |
| B01 | Compacto |
| C | Angosto |
| D | Especial |

Los nombres son descriptivos, no una ficha comercial validada. Se conservan las proporciones relativas del GLB, se aplican las transformaciones de exportación y se centra cada pieza individualmente. Las unidades del visor **no representan medidas físicas verificadas**.

El configurador utiliza A00 y B. El conteo incluye las dos medias piezas de cada capa trabada: por ejemplo, 4 bloques de largo × 3 capas son 11 piezas A00 y 2 piezas B. La separación de capas es sólo visual y no altera el conteo.

El material de hormigón utiliza `DoubleSide` tanto para la vista como para las sombras, respetando el material de doble cara del GLB. Las normales originales se conservan y transforman con la geometría; sólo se calculan si un modelo no las trae. La inspección de los 1.786 triángulos del GLB no detectó normales opuestas al orden de sus vértices, por lo que no se invirtieron. Estas decisiones se prueban en `tests/blocks.test.ts`; pueden revertirse en `lib/block-rendering.ts` sin alterar el archivo original.

No incluye cálculo estructural, precios, resistencia certificada ni validación de encastres. La estabilidad, la fundación, el drenaje y las especificaciones reales requieren evaluación profesional. Antes de publicar, confirmar marca, catálogo y canales comerciales.

## Verificación

```bash
npm run test
npm run typecheck
npm run build
```

Los tests cubren el conteo, el ancho de las capas, las posiciones de la vista separada, los límites y la correspondencia entre el catálogo y los nodos del GLB.

Verificado: 9 tests, tipos y compilación de producción. La revisión visual e interacción en navegador quedó pendiente: el sandbox de desarrollo no permite abrir el servidor (`listen EPERM`) ni iniciar Chromium. Ejecutar `npm run dev` fuera de ese sandbox para completar esa revisión.

## Archivos principales

| Archivo | Responsabilidad |
| --- | --- |
| `components/product-page.tsx` | Página, catálogo, controles y consulta local |
| `components/block-scene.tsx` | Carga del GLB, material y escenas R3F/Drei |
| `lib/blocks.ts` | Disposición de piezas y resumen de cantidades |
| `lib/block-rendering.ts` | Material doble cara y normalización sin reemplazar normales originales |
| `app/globals.css` | Diseño responsive y accesibilidad visual |
| `public/models/brunoblok.glb` | Copia del modelo original para servir al navegador |

Las escenas renderizan bajo demanda y contemplan errores de carga o falta de WebGL. La tipografía Barlow se carga desde Google Fonts con fuentes del sistema como respaldo.

## Unidades de trabajo

- **Presentación y catálogo:** página, estilos y escenas 3D. Verificación: compilación, tipos y vista en navegador. Reversión: `app/` y `components/`, sin modificar el GLB original.
- **Configuración conceptual:** `lib/blocks.ts`, sus tests y los controles de la página. Verificación: tests y cambios de capas, disposición y separación en navegador. Reversión: quitar el configurador y la preparación de consultas junto con esta librería.

Referencias: [Next.js](https://nextjs.org/docs/app/getting-started/installation), [R3F](https://r3f.docs.pmnd.rs/getting-started/installation), [Drei](https://drei.docs.pmnd.rs/).
