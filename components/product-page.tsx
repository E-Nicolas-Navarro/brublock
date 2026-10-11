"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowDown, ArrowRight, Check, CheckCheck, ChevronRight, Copy, Download, Layers3, Menu, Minus, MousePointer2, MoveUpRight, Plus, RotateCcw, X } from "lucide-react";
import { blockTypes, blockVolumeM3, configurationMetrics, configurationSummary, formatNumber, quoteText, supplier, type BlockId, type WallConfig } from "@/lib/blocks";

const BlockScene = dynamic(() => import("./block-scene"), { ssr: false, loading: () => <div className="scene-fallback">Preparando la vista 3D…</div> });
const initialConfig: WallConfig = { columns: 4, layers: 3, staggered: true, exploded: false };

function Brand({ light = false }: { light?: boolean }) {
  return <a className={`brand ${light ? "brand-light" : ""}`} href="#inicio" aria-label="BRUBLOCKS, Cantera Moreno, inicio">
    <svg viewBox="0 0 38 40" fill="none" aria-hidden="true"><path d="M3 11 19 2l16 9v18l-16 9L3 29V11Z" stroke="currentColor" strokeWidth="3"/><path d="m3 11 16 9 16-9M19 20v18M11 7l16 9v9l-8 5" stroke="currentColor" strokeWidth="3"/></svg>
    <span className="brand-wordmark">bru<span className="brand-weight">blocks</span><small>{supplier.name}</small></span>
  </a>;
}

function PieceIcon({ id }: { id: BlockId }) {
  return <img className="piece-illustration" src={`/illustrations/${id}.svg`} width={88} height={66} alt="" aria-hidden="true" />;
}

export default function ProductPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<BlockId>("A00");
  const [heroMode, setHeroMode] = useState<"wall" | "piece">("wall");
  const [catalogMode, setCatalogMode] = useState<"illustration" | "3d">("illustration");
  const [config, setConfig] = useState<WallConfig>(initialConfig);
  const [resetKey, setResetKey] = useState(0);
  const [quote, setQuote] = useState("");
  const [copied, setCopied] = useState(false);
  const counts = useMemo(() => configurationSummary(config), [config]);
  const metrics = useMemo(() => configurationMetrics(config), [config]);
  const selectedBlock = blockTypes.find((b) => b.id === selected)!;
  const selectedVolume = blockVolumeM3(selectedBlock);
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP?.replace(/\D/g, "");
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  function updateConfig(patch: Partial<WallConfig>) {
    setConfig((current) => ({ ...current, ...patch }));
    setQuote("");
  }

  function prepareQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setQuote(`${quoteText(config, String(data.get("project")))}\n\nNombre: ${String(data.get("name")).trim()}\nContacto: ${String(data.get("email")).trim()}`);
    setCopied(false);
  }

  async function copyQuote() {
    try { await navigator.clipboard.writeText(quote); setCopied(true); }
    catch { setCopied(false); window.alert("No se pudo copiar automáticamente. Seleccioná el texto de la consulta para copiarlo."); }
  }

  function downloadQuote() {
    const url = URL.createObjectURL(new Blob([quote], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "consulta-brublocks.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <>
    <header className="site-header">
      <Brand />
      <nav className={menuOpen ? "nav-open" : ""} aria-label="Navegación principal">
        {[ ["El sistema", "sistema"], ["Las piezas", "piezas"], ["Configurador 3D", "configurador"] ].map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>)}
        <a className="nav-contact" href="#contacto" onClick={() => setMenuOpen(false)}>Hablemos de tu proyecto <MoveUpRight size={15} /></a>
      </nav>
      <button className="mobile-menu icon-button" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
    </header>

    <main>
      <section className="hero" id="inicio">
        <div className="hero-copy">
          <div className="hero-intro"><span className="status-dot" /> Hormigón. Modular. Apilable.</div>
          <h1>La fuerza<br />de una<br />buena base.</h1>
          <p>Bloques de hormigón que se combinan para dar forma a tu proyecto de contención. Una alternativa a los gaviones, pieza por pieza.</p>
          <a className="button button-dark" href="#configurador">Construí tu idea <ArrowRight size={19} /></a>
          <a className="text-link hero-secondary" href="#sistema">Conocé el sistema <ArrowDown size={15} /></a>
        </div>
        <div className="hero-visual" role="group" aria-label="Modelo 3D interactivo de bloques de hormigón">
          <div className="visual-top"><span><span className="live-dot" /> Explorá el producto en 3D</span><span className="model-badge">{heroMode === "wall" ? "Sistema modular" : `Modelo ${selected}`}</span></div>
          <div className="hero-scene"><BlockScene mode={heroMode} selected={selected} config={initialConfig} hero /></div>
          <div className="hero-scene-bottom">
            <div className="segmented" aria-label="Tipo de vista">
              <button aria-pressed={heroMode === "wall"} className={heroMode === "wall" ? "active" : ""} onClick={() => setHeroMode("wall")}><Layers3 size={15} /> En conjunto</button>
              <button aria-pressed={heroMode === "piece"} className={heroMode === "piece" ? "active" : ""} onClick={() => setHeroMode("piece")}>Una pieza</button>
            </div>
            <span className="orbit-hint"><MousePointer2 size={14} /> Arrastrá para girar</span>
          </div>
        </div>
        <div className="hero-foot"><span>Una pieza. Muchas posibilidades.</span><a href="#piezas">Explorá las 6 geometrías <ArrowDown size={16} /></a></div>
      </section>

      <section id="sistema" className="system-section section-padding">
        <div className="system-heading"><span className="section-kicker">Pensado como un sistema</span><h2>No llenes una jaula.<br />Construí con bloques.</h2></div>
        <div className="system-detail"><p className="section-description">En lugar de celdas de alambre llenas de piedra, una familia de piezas de hormigón. Diferentes geometrías que podés combinar y apilar en capas.</p><div className="system-features">
          <div><Layers3 size={23} strokeWidth={1.4} /><h3>De pieza a conjunto</h3><p>Explorá cómo cambia la composición al sumar bloques y capas.</p></div>
          <div><svg viewBox="0 0 26 26" width="25" height="25" fill="none" aria-hidden="true"><path d="m3 8 10-5 10 5-10 5L3 8Zm0 0v10l10 5 10-5V8M13 13v10" stroke="currentColor" strokeWidth="1.4"/></svg><h3>Distintas geometrías</h3><p>Piezas completas, cortas y de perfil bajo en un mismo catálogo.</p></div>
          <div><MousePointer2 size={23} strokeWidth={1.4} /><h3>Primero, visualizalo</h3><p>Probá una idea en 3D antes de conversar sobre tu obra.</p></div>
        </div></div>
      </section>

      <section id="piezas" className="pieces-section section-padding">
        <div className="section-title-row"><div><span className="section-kicker">La familia BRUBLOCKS</span><h2>Cada pieza tiene su lugar.</h2></div><p>Elegí una pieza y conocé sus datos.<br />Alterná entre ilustración y modelo 3D.</p></div>
        <div className="catalog-layout">
          <div className="catalog-list" role="group" aria-label="Seleccionar un modelo">
            {blockTypes.map((block) => <button key={block.id} className={`catalog-item ${selected === block.id ? "selected" : ""}`} aria-pressed={selected === block.id} onClick={() => setSelected(block.id)}>
              <PieceIcon id={block.id} /><span><span className="piece-code">{block.id}</span><strong>{block.name}</strong></span>{selected === block.id ? <span className="selected-check"><Check size={16} /></span> : <ChevronRight size={18} />}
            </button>)}
          </div>
          <div className="catalog-viewer">
            <div className="catalog-model-title"><span>{selected} · {selectedBlock.tag}</span><div className="segmented" aria-label="Presentación de la pieza"><button className={catalogMode === "illustration" ? "active" : ""} aria-pressed={catalogMode === "illustration"} onClick={() => setCatalogMode("illustration")}>Ilustración</button><button className={catalogMode === "3d" ? "active" : ""} aria-pressed={catalogMode === "3d"} onClick={() => setCatalogMode("3d")}>Modelo 3D</button></div></div>
            <div className="catalog-canvas">{catalogMode === "3d" ? <BlockScene mode="piece" selected={selected} config={initialConfig} /> : <img className="product-illustration" src={`/illustrations/${selected}.svg`} width={640} height={480} alt={`Ilustración isométrica de ${selectedBlock.name.toLowerCase()}, generada a partir del modelo ${selected}.`} />}</div>
            <div className="catalog-caption"><div className="catalog-caption-content"><h3>{selectedBlock.name}</h3><p>{selectedBlock.description}</p><dl className="block-specs">
              <div><dt>Medidas</dt><dd>{selectedBlock.dimensionsCm.map(formatNumber).join(" × ")} cm</dd></div>
              <div><dt>Peso según catálogo</dt><dd>{formatNumber(selectedBlock.weightKg)} kg</dd></div>
              {selectedVolume !== null ? <div><dt>Volumen calculado</dt><dd>{formatNumber(selectedVolume)} m³</dd></div> : <div><dt>Escalones</dt><dd>{formatNumber(selectedBlock.stepRiseCm!)} cm de alto<br />{formatNumber(selectedBlock.stepTreadCm!)} cm de pisada</dd></div>}
            </dl></div></div>
          </div>
        </div>
        <p className="catalog-note">Datos del catálogo de Cantera Moreno. Los volúmenes geométricos se calculan a partir de las medidas: los valores «512» y «256» de la fuente se muestran como 0,512 y 0,256 m³. El peso de 540 kg del cuadrado bajo se conserva tal como figura. Confirmá especificaciones y disponibilidad antes de cotizar. <a href={supplier.catalogUrl} target="_blank" rel="noopener noreferrer">Ver catálogo original <MoveUpRight size={12} /></a></p>
      </section>

      <section id="configurador" className="config-section section-padding">
        <div className="section-title-row"><div><span className="section-kicker">De la idea a la forma</span><h2>Tu próximo muro<br />empieza acá.</h2></div><p>Un pequeño laboratorio para tu proyecto.<br />Combiná capas y explorá el resultado.</p></div>
        <div className="config-layout">
          <div className="config-controls">
            <div className="config-controls-title"><Layers3 size={21} /><h3>Armá tu composición</h3></div>
            <div className="range-control"><label htmlFor="columns">Bloques de largo <span>{config.columns}</span></label><input id="columns" type="range" min="2" max="8" value={config.columns} onChange={(e) => updateConfig({ columns: Number(e.target.value) })} /><div className="range-labels"><span>2 bloques</span><span>8 bloques</span></div></div>
            <div className="layer-control"><span id="layer-label">Capas de altura</span><div className="stepper" aria-labelledby="layer-label"><button aria-label="Quitar una capa" disabled={config.layers === 1} onClick={() => updateConfig({ layers: config.layers - 1 })}><Minus size={17} /></button><output aria-live="polite">{config.layers}</output><button aria-label="Agregar una capa" disabled={config.layers === 6} onClick={() => updateConfig({ layers: config.layers + 1 })}><Plus size={17} /></button></div></div>
            <div className="alignment-control"><span>Disposición</span><div className="segmented"><button className={!config.staggered ? "active" : ""} aria-pressed={!config.staggered} onClick={() => updateConfig({ staggered: false })}>Alineada</button><button className={config.staggered ? "active" : ""} aria-pressed={config.staggered} onClick={() => updateConfig({ staggered: true })}>Trabada</button></div></div>
            <label className="toggle-row" htmlFor="exploded"><span>Separar las capas<small>Para ver cómo se organiza el conjunto</small></span><input id="exploded" type="checkbox" checked={config.exploded} onChange={(e) => updateConfig({ exploded: e.target.checked })} /><span className="toggle-track" aria-hidden="true" /></label>
            <div className="quantity-summary" aria-live="polite"><span>Tu composición</span><strong>{counts.total} <span>piezas</span></strong><p>{counts.full} bloques altos{counts.half > 0 ? ` + ${counts.half} cuadrados altos` : ""}</p><dl className="project-specs"><div><dt>Largo × alto nominal</dt><dd>{formatNumber(metrics.lengthM)} × {formatNumber(metrics.heightM)} m</dd></div><div><dt>Profundidad nominal</dt><dd>{formatNumber(metrics.depthM)} m</dd></div><div><dt>Peso estimado</dt><dd>{formatNumber(metrics.weightKg)} kg</dd></div></dl></div>
            <a href="#contacto" className="button button-yellow">Consultar este proyecto <ArrowRight size={18} /></a>
          </div>
          <div className="config-viewer">
            <div className="config-viewer-top"><span><span className="live-dot" /> Vista conceptual</span><button className="reset-button" onClick={() => { updateConfig(initialConfig); setResetKey((key) => key + 1); }}><RotateCcw size={14} /> Restablecer</button></div>
            <div className="config-canvas"><BlockScene mode="wall" config={config} resetKey={resetKey} /></div>
            <div className="config-viewer-bottom"><span>{config.columns} bloques de largo <span className="separator">/</span> {config.layers} capas</span><span className="orbit-hint"><MousePointer2 size={14} /> Arrastrá para girar · scroll para acercar</span></div>
          </div>
        </div>
        <p className="technical-note"><span aria-hidden="true">i</span> Medidas y peso orientativos según catálogo; separar las capas no altera las medidas nominales. Esto es una visualización, no un cálculo estructural. La fundación, el drenaje y la estabilidad deben definirse con un profesional para cada obra.</p>
      </section>

      <section id="contacto" className="contact-section section-padding">
        <div className="contact-copy"><span className="section-kicker">Hagámoslo concreto</span><h2>Contanos qué<br />querés construir.</h2><p>Prepará una consulta con tu composición y los detalles de tu obra. El siguiente paso es confirmar las especificaciones y evaluar el proyecto.</p><div className="contact-composition"><Layers3 size={20} /><span>Tu idea: <strong>{counts.total} piezas en {config.layers} capas</strong></span><a href="#configurador" aria-label="Editar composición"><MoveUpRight size={18} /></a></div><address className="supplier-info"><strong>{supplier.name}</strong><a href={supplier.phoneHref}>{supplier.phone}</a><span>{supplier.address}</span><small>Contacto publicado en el catálogo.</small></address></div>
        <div className="contact-form-wrap">
          <form onSubmit={prepareQuote} onChange={() => { setQuote(""); setCopied(false); }} className="contact-form">
            <div className="form-row"><label htmlFor="name">Tu nombre<input name="name" id="name" autoComplete="name" placeholder="Nombre y apellido" required maxLength={100} /></label><label htmlFor="email">Tu email<input type="email" name="email" id="email" autoComplete="email" placeholder="vos@empresa.com" required maxLength={160} /></label></div>
            <label htmlFor="project">Sobre tu proyecto<textarea id="project" name="project" rows={3} required maxLength={2000} placeholder="¿Dónde está la obra? ¿Qué necesitás contener? Contanos tu idea." /></label>
            <button className="button button-yellow" type="submit">Preparar consulta <ArrowRight size={18} /></button>
            <p className="form-note">Tus datos no se guardan ni se envían automáticamente. Podés revisar y descargar la consulta antes de compartirla.</p>
          </form>
          {quote && <div className="quote-result" role="status"><h3><CheckCheck size={19} /> Tu consulta está lista</h3><pre tabIndex={0}>{quote}</pre><div className="quote-actions"><button onClick={copyQuote}><Copy size={15} />{copied ? "Copiado" : "Copiar consulta"}</button><button onClick={downloadQuote}><Download size={15} /> Descargar</button>{whatsapp && <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(quote)}`} target="_blank" rel="noopener noreferrer">Enviar por WhatsApp <MoveUpRight size={15} /></a>}{contactEmail && <a href={`mailto:${contactEmail}?subject=${encodeURIComponent("Consulta de proyecto BRUBLOCKS")}&body=${encodeURIComponent(quote)}`}>Abrir email <MoveUpRight size={15} /></a>}</div>{!whatsapp && !contactEmail && <p>Podés llamar a Cantera Moreno al {supplier.phone}. El enlace de envío todavía no está configurado; descargá el resumen para compartirlo.</p>}</div>}
        </div>
      </section>
    </main>

    <footer className="site-footer"><Brand light /><p>Una buena base para lo que viene.</p><a href="#inicio">Volver arriba <ArrowUpIcon /></a><span>© {new Date().getFullYear()} BRUBLOCKS</span></footer>
  </>;
}

function ArrowUpIcon() { return <ArrowDown size={15} style={{ transform: "rotate(180deg)" }} />; }
