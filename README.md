# BRUBLOCKS · Cantera Moreno

Web de producto en español con Next.js App Router, React Three Fiber y Drei. Usa las seis geometrías del archivo original `brunoblok.glb` para mostrar las piezas y configurar un muro conceptual.

## Iniciar

Requiere Node.js 20.9 o superior.

```bash
npm ci
npm run dev
```

Abrí [localhost:3000](http://localhost:3000). Para producción: `npm run build` y `npm run start`.

## Qué podés probar

- Ver las seis ilustraciones isométricas y alternar al modelo 3D para girar y acercar cada pieza.
- Consultar los nombres, medidas y pesos del catálogo real de Cantera Moreno.
- Construir una composición de 2–8 bloques de largo y 1–6 capas.
- Alternar capas alineadas o trabadas con medios bloques en los extremos.
- Separar las capas y restablecer la composición.
- Preparar, copiar y descargar una consulta con el listado de piezas.

El teléfono **0294 425-0785** y la dirección **Ruta Nacional 40, km 2030** figuran en la página, tal como aparecen en la fuente. No se dedujo un número internacional de WhatsApp.

El formulario **no envía ni almacena datos**. Para habilitar enlaces de envío, copiá `.env.example` a `.env.local`, completá `NEXT_PUBLIC_WHATSAPP` y/o `NEXT_PUBLIC_CONTACT_EMAIL`, y reiniciá el servidor. En producción, configurá esas variables antes de compilar. WhatsApp abre un mensaje preparado; email abre el cliente del visitante.

## Modelos y límites

Fuente: la imagen de catálogo provista por el usuario, conservada sin modificaciones en [`public/catalogos/brublocks.jpeg`](public/catalogos/brublocks.jpeg) y enlazada desde la página.

| Modelo GLB | Nombre del catálogo | Medidas impresas (cm) | Peso (kg) |
| --- | --- | --- | --- |
| A00 | Bloque alto | 80 × 160 × 80 | 2.560 |
| B | Bloque cuadrado alto | 80 × 80 × 80 | 1.280 |
| A01 | Bloque bajo | 80 × 160 × 40 | 1.280 |
| B01 | Bloque cuadrado bajo | 80 × 80 × 40 | 540 |
| C | Bloque tabique | 40 × 160 × 80 | 1.280 |
| D | Bloque escalera | 160 × 80 | 1.920 |

La escalera informa 20 cm de alto y 22,5 cm de pisada por escalón; no especifica altura total ni volumen. No se inventaron esos valores. El peso de **540 kg** del cuadrado bajo se mantiene exactamente como aparece en la imagen.

**Volúmenes:** la fuente imprime «1,024 m³», «512 m³» y «256 m³». Esas cadenas se preservan en `catalogVolumeText`. La página muestra por separado el volumen **calculado a partir de las medidas**, en m³: 1,024; 0,512; 0,512; 0,256 y 0,512 para las piezas rectangulares. La diferencia se aclara en la página y debe confirmarse comercialmente.

Se conservan las proporciones y transformaciones del GLB. Las unidades internas del visor no son metros; las medidas nominales se obtienen del catálogo. El configurador agrega largo, altura, profundidad y peso estimado a la consulta. Para 4 bloques de largo y 3 capas: **6,4 × 2,4 × 0,8 m**, con **30.720 kg** estimados. Separar las capas no cambia esas medidas nominales.

El configurador utiliza A00 y B. El conteo incluye las dos medias piezas de cada capa trabada: por ejemplo, 4 bloques de largo × 3 capas son 11 bloques altos A00 y 2 bloques cuadrados altos B. La separación de capas es sólo visual y no altera el conteo.

El material de hormigón utiliza `DoubleSide` tanto para la vista como para las sombras, respetando el material de doble cara del GLB. Las normales originales se conservan y transforman con la geometría; sólo se calculan si un modelo no las trae. La inspección de los 1.786 triángulos del GLB no detectó normales opuestas al orden de sus vértices, por lo que no se invirtieron. Estas decisiones se prueban en `tests/blocks.test.ts`; pueden revertirse en `lib/block-rendering.ts` sin alterar el archivo original.

No incluye cálculo estructural, precios, resistencia certificada ni validación de encastres. La estabilidad, la fundación, el drenaje y las especificaciones reales requieren evaluación profesional. Antes de cotizar, confirmar disponibilidad, especificaciones, transporte y canal comercial.

## Verificación

```bash
npm run test
npm run typecheck
npm run build
```

Los tests cubren el conteo, el ancho de las capas, las posiciones de la vista separada, los límites y la correspondencia entre el catálogo y los nodos del GLB.

Verificado: 15 tests, tipos y compilación de producción. La revisión visual e interacción en navegador quedó pendiente: el sandbox de desarrollo no permite abrir el servidor (`listen EPERM`) ni iniciar Chromium. Ejecutar `npm run dev` fuera de ese sandbox para completar esa revisión.

## Archivos principales

| Archivo | Responsabilidad |
| --- | --- |
| `components/product-page.tsx` | Página, catálogo, controles y consulta local |
| `components/block-scene.tsx` | Carga del GLB, material y escenas R3F/Drei |
| `lib/blocks.ts` | Disposición de piezas y resumen de cantidades |
| `lib/block-rendering.ts` | Material doble cara y normalización sin reemplazar normales originales |
| `app/globals.css` | Diseño responsive y accesibilidad visual |
| `public/models/brunoblok.glb` | Copia del modelo original para servir al navegador |
| `public/illustrations/*.svg` | Seis ilustraciones vectoriales específicas de cada pieza |
| `scripts/generate-illustrations.ts` | Proyección isométrica y sombreado de los meshes reales |

Las escenas renderizan bajo demanda y contemplan errores de carga o falta de WebGL. La tipografía Barlow se carga desde Google Fonts con fuentes del sistema como respaldo.

## Regenerar ilustraciones

```bash
npm run illustrations:generate
```

Las ilustraciones SVG se generan directamente del GLB: proyección ortográfica, hormigón gris, contornos oscuros y fondo transparente. No se usan formas inventadas ni iconos genéricos. El script contempla winding global invertido para decidir la visibilidad en la proyección, omite costuras coplanares y recorta contornos ocultos sin modificar el GLB original. La escalera conserva también los encastres presentes en el modelo 3D, aunque el dibujo del folleto no los muestra.

Se inspeccionaron visualmente las seis piezas mediante rasterizaciones locales de los SVG. La página completa sigue pendiente de revisión en navegador por la restricción de sockets del entorno.

## Unidades de trabajo

- **Presentación y catálogo:** página, estilos y escenas 3D. Verificación: compilación, tipos y vista en navegador. Reversión: `app/` y `components/`, sin modificar el GLB original.
- **Configuración conceptual:** `lib/blocks.ts`, sus tests y los controles de la página. Verificación: tests y cambios de capas, disposición y separación en navegador. Reversión: quitar el configurador y la preparación de consultas junto con esta librería.

- **Catálogo real e ilustraciones:** datos de `lib/blocks.ts`, imágenes de `public/catalogos/` y `public/illustrations/`, script de generación y presentación del catálogo. Verificación: 15 tests, tipos, build e inspección de las seis ilustraciones; interacción de la página pendiente por `EPERM`. Reversión: datos/presentación del catálogo y assets/script nuevos; no modifica el GLB original.

Referencias: [Next.js](https://nextjs.org/docs/app/getting-started/installation), [R3F](https://r3f.docs.pmnd.rs/getting-started/installation), [Drei](https://drei.docs.pmnd.rs/).
