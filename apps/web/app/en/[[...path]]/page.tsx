import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentType } from "@elsystar/database";
import { LeadForm } from "../../../components/lead-form";
import { getHomepageContent, getProjectBySlug, getPublishedProjects, getPublishedSolutions, getSolutionBySlug } from "../../../lib/content";
import { getCorporateContent, getFaqEntries } from "../../../lib/corporate";
import { getPublicDocumentSeriesBySlug, getSupportLibrary } from "../../../lib/documents";
import { getProductBySlug, getPublishedCategories, getPublishedProducts } from "../../../lib/products";
import { absoluteSiteUrl } from "../../../lib/site";
import { getTranslationMap, hasTranslation, localizeCategory, localizeCorporate, localizeFaq, localizeHomepage, localizeProduct, localizeProject, localizeSolution, tr, uiEn } from "../../../lib/i18n";

const documentLabels: Record<string, string> = {
  MANUAL: "Manuals", CERTIFICATE: "Certificates", SOFTWARE: "Software", FIRMWARE: "Firmware", SCHEME: "Schematics", PASSPORT: "Passports", OTHER: "Other materials",
};
const relationLabels: Record<string, string> = {
  COMPATIBLE: "Compatible equipment", ACCESSORY: "Accessories", ALTERNATIVE: "Alternative models", RELATED: "Related products",
};

function header(cta = "/en/contacts#request") {
  return <header className="header shell" lang="en"><a className="logo" href="/en">ELSY<span>STAR</span></a><nav><a href="/en/products">Products</a><a href="/en/solutions">Solutions</a><a href="/en/projects">Projects</a><a href="/en/support">Documentation</a><a href="/en/about">About</a><a href="/en/contacts">Contacts</a></nav><div className="actions"><a className="button small" data-analytics="cta_click" href={cta}>Request a quote</a></div></header>;
}

function footer(corporate?: { phonePrimary?: string | null; emailPrimary?: string | null }) {
  return <footer className="footer" lang="en"><div className="shell footerInner"><div><div className="logo light">ELSY<span>STAR</span></div><p>Intelligent solutions for road traffic management.</p></div><div><b>Products</b><a href="/en/products">Catalog</a><a href="/en/solutions">Solutions</a><a href="/en/support">Documentation</a></div><div><b>Company</b><a href="/en/about">About</a><a href="/en/production">Manufacturing</a><a href="/en/projects">Projects</a><a href="/en/contacts">Contacts</a></div><div><b>Contact</b>{corporate?.phonePrimary && <a href={`tel:${corporate.phonePrimary.replace(/[^+\d]/g, "")}`}>{corporate.phonePrimary}</a>}{corporate?.emailPrimary && <a href={`mailto:${corporate.emailPrimary}`}>{corporate.emailPrimary}</a>}</div></div></footer>;
}

function formatSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function pathOf(parts?: string[]) {
  return parts?.filter(Boolean) ?? [];
}

export async function generateMetadata({ params }: { params: Promise<{ path?: string[] }> }): Promise<Metadata> {
  const { path } = await params;
  const parts = pathOf(path);
  const translations = await getTranslationMap("en");
  const relative = `/en${parts.length ? `/${parts.join("/")}` : ""}`;
  let title = "ELSYSTAR — Traffic Controllers & Intelligent Transport Systems";
  let description = "Traffic controllers, automated traffic management systems and engineering solutions for urban transport infrastructure.";
  let index = true;

  if (parts[0] === "products" && parts[1]) {
    const product = await getProductBySlug(parts[1]);
    if (!product) return { title: "Product not found — ELSYSTAR", robots: { index: false, follow: false } };
    title = tr(translations, "Product", product.slug, "seoTitle", "") || `${tr(translations, "Product", product.slug, "name", product.name)} — ELSYSTAR`;
    description = tr(translations, "Product", product.slug, "seoDescription", "") || tr(translations, "Product", product.slug, "shortDescription", product.shortDescription);
    index = hasTranslation(translations, "Product", product.slug, "name");
  } else if (parts[0] === "solutions" && parts[1]) {
    const solution = await getSolutionBySlug(parts[1]);
    if (!solution) return { title: "Solution not found — ELSYSTAR", robots: { index: false, follow: false } };
    title = tr(translations, "Solution", solution.slug, "seoTitle", "") || `${tr(translations, "Solution", solution.slug, "name", solution.name)} — ELSYSTAR`;
    description = tr(translations, "Solution", solution.slug, "seoDescription", "") || tr(translations, "Solution", solution.slug, "shortDescription", solution.shortDescription);
    index = hasTranslation(translations, "Solution", solution.slug, "name");
  } else if (parts[0] === "projects" && parts[1]) {
    const project = await getProjectBySlug(parts[1]);
    if (!project) return { title: "Project not found — ELSYSTAR", robots: { index: false, follow: false } };
    title = tr(translations, "Project", project.slug, "seoTitle", "") || `${tr(translations, "Project", project.slug, "title", project.title)} — ELSYSTAR`;
    description = tr(translations, "Project", project.slug, "seoDescription", "") || tr(translations, "Project", project.slug, "summary", project.summary);
    index = !project.isDemo && hasTranslation(translations, "Project", project.slug, "title");
  } else {
    const staticMeta: Record<string, [string, string]> = {
      products: ["ELSYSTAR Products — Traffic Controllers and Equipment", "Traffic controllers and equipment for local and centralized road traffic management."],
      solutions: ["ELSYSTAR Solutions — Automated Traffic Management", "Traffic management solutions, Megapolis ATMS, intersection control and infrastructure modernization."],
      projects: ["ELSYSTAR Projects", "Published ELSYSTAR traffic-management projects and clearly marked demonstration scenarios."],
      support: ["ELSYSTAR Documentation & Support", "Manuals, certificates, software, firmware and technical support materials."],
      about: ["About ELSYSTAR", "ELSYSTAR engineering expertise in traffic controllers and automated road traffic management systems."],
      production: ["ELSYSTAR Manufacturing", "In-house manufacturing of traffic controllers and equipment for automated traffic management systems."],
      contacts: ["Contact ELSYSTAR", "Contact ELSYSTAR for equipment, engineering support and commercial proposals."],
      faq: ["ELSYSTAR FAQ", "Frequently asked questions about ELSYSTAR products, documentation and commercial requests."],
    };
    if (parts[0] && staticMeta[parts[0]]) [title, description] = staticMeta[parts[0]];
  }

  const ruPath = parts.length ? `/${parts.join("/")}` : "/";
  return {
    title,
    description,
    alternates: { canonical: absoluteSiteUrl(relative), languages: { "ru-RU": absoluteSiteUrl(ruPath), "en": absoluteSiteUrl(relative), "x-default": absoluteSiteUrl(ruPath) } },
    openGraph: { title, description, url: absoluteSiteUrl(relative), locale: "en_US", alternateLocale: ["ru_RU"], type: "website" },
    robots: { index, follow: index },
  };
}

async function homePage(translations: Awaited<ReturnType<typeof getTranslationMap>>) {
  const [rawProducts, rawContent, rawSolutions, rawProjects, rawCorporate] = await Promise.all([getPublishedProducts(), getHomepageContent(), getPublishedSolutions(true), getPublishedProjects(true), getCorporateContent()]);
  const products = rawProducts.filter((item) => hasTranslation(translations, "Product", item.slug, "name")).slice(0, 3).map((item) => localizeProduct(item, translations));
  const content = localizeHomepage(rawContent as Record<string, unknown>, translations) as any;
  const solutions = rawSolutions.filter((item) => hasTranslation(translations, "Solution", item.slug, "name")).map((item) => localizeSolution(item, translations));
  const projects = rawProjects.filter((item) => hasTranslation(translations, "Project", item.slug, "title")).map((item) => localizeProject(item, translations));
  const corporate = localizeCorporate(rawCorporate as any, translations) as any;
  const platform = solutions.find((item) => item.type === "PLATFORM");
  return <main lang="en">{header("#request")}
    <section className="hero shell"><div className="heroCopy"><p className="eyebrow">{content.heroEyebrow}</p><h1>{content.heroTitle}</h1><p className="lead">{content.heroDescription}</p><div className="heroButtons"><a className="button" href={content.primaryCtaHref}>{content.primaryCtaLabel}</a><a className="button ghost" href={content.secondaryCtaHref}>{content.secondaryCtaLabel}</a></div></div><div className="heroVisual" aria-label="Urban transport infrastructure and traffic controller"><div className="signal"><i></i><i></i><i className="active"></i></div><div className="cabinet"><div className="cabinetLogo">ELSYSTAR</div><div className="vents"></div><div className="handle"></div><small>UK-4.1M</small></div></div></section>
    <section className="trust shell"><div><strong>{content.trust1Value}</strong><span>{content.trust1Label}</span></div><div><strong>{content.trust2Value}</strong><span>{content.trust2Label}</span></div><div><strong>{content.trust3Value}</strong><span>{content.trust3Label}</span></div></section>
    <section className="section shell"><div className="sectionHead"><div><p className="eyebrow">{content.productsEyebrow}</p><h2>{content.productsTitle}</h2></div><a href="/en/products">{uiEn.allProducts}</a></div><div className="productGrid">{products.map((product) => <article key={product.id}>{product.mediaAssets[0] ? <img src={product.mediaAssets[0].url} alt={product.mediaAssets[0].alt ?? product.name} /> : <div className="miniCabinet"></div>}<div><h3>{product.model}</h3><p>{product.shortDescription}</p><a href={`/en/products/${product.slug}`}>{uiEn.details}</a></div></article>)}</div></section>
    <section className="section shell"><div className="sectionHead"><div><p className="eyebrow">{content.solutionsEyebrow}</p><h2>{content.solutionsTitle}</h2></div><a href="/en/solutions">{uiEn.allSolutions}</a></div><div className="threeCards">{solutions.slice(0,3).map((solution) => <article className="solutionVisualCard" key={solution.id}>{solution.imageUrl && <img src={solution.imageUrl} alt={solution.name} />}<div className="visualCardBody"><h3>{solution.name}</h3><p>{solution.shortDescription}</p><a href={`/en/solutions/${solution.slug}`}>{uiEn.details}</a></div></article>)}</div></section>
    {platform && <section className="megapolis shell"><div><p className="eyebrow">PLATFORM</p><h2>{platform.name}</h2><p>{platform.shortDescription}</p><a className="textLink" href={`/en/solutions/${platform.slug}`}>{uiEn.aboutSystem}</a></div><div className="map"><span className="road r1"></span><span className="road r2"></span><span className="road r3"></span><i></i><i></i><i></i></div></section>}
    {projects.length > 0 && <section className="section shell homeProjects"><div className="sectionHead"><div><p className="eyebrow">{content.projectsEyebrow}</p><h2>{content.projectsTitle}</h2></div><a href="/en/projects">{uiEn.allProjects}</a></div><div className="homeProjectGrid">{projects.slice(0,3).map((project) => <article key={project.id}>{project.coverImageUrl && <img src={project.coverImageUrl} alt={project.title} />}<div className="projectCardBody">{project.isDemo && <span className="demoBadge">Demo case</span>}<span>{[project.city, project.year].filter(Boolean).join(" · ") || "ELSYSTAR project"}</span><h3>{project.title}</h3><p>{project.summary}</p><a href={`/en/projects/${project.slug}`}>{uiEn.details}</a></div></article>)}</div></section>}
    <section className="companyTeaser shell"><div><p className="eyebrow">{corporate.aboutEyebrow}</p><h2>{corporate.aboutTitle}</h2><p>{corporate.aboutLead}</p></div><div className="companyTeaserActions"><a className="textLink" href="/en/about">About ELSYSTAR →</a><a className="textLink" href="/en/production">Manufacturing →</a></div></section>
    <section className="support shell"><div><p className="eyebrow">{content.supportEyebrow}</p><h2>{content.supportTitle}</h2><p>{content.supportDescription}</p></div><div className="heroButtons"><a className="button ghost" href="/en/support">Documentation</a><a className="button ghost" href="/en/faq">FAQ</a></div></section>
    <section id="request" className="requestSection shell"><div className="requestIntro"><p className="eyebrow">{content.requestEyebrow}</p><h2>{content.requestTitle}</h2><p>{content.requestDescription}</p></div><LeadForm locale="en" /></section>
    {footer(corporate)}
  </main>;
}

async function productsPage(translations: Awaited<ReturnType<typeof getTranslationMap>>, query: Record<string, string | string[] | undefined>) {
  const selected = typeof query.category === "string" ? query.category : undefined;
  const [rawProducts, rawCategories] = await Promise.all([getPublishedProducts(selected), getPublishedCategories()]);
  const products = rawProducts.filter((item) => hasTranslation(translations, "Product", item.slug, "name")).map((item) => localizeProduct(item, translations));
  const categories = rawCategories.filter((item) => hasTranslation(translations, "ProductCategory", item.slug, "name")).map((item) => localizeCategory(item, translations)!);
  const active = categories.find((item) => item.slug === selected);
  return <main lang="en">{header()}<section className="catalogHero shell"><p className="eyebrow">PRODUCTS</p><h1>{active ? active.name : "ELSYSTAR equipment catalog"}</h1><p className="lead">{active?.description || "Traffic controllers, equipment and components for local and centralized management of transport infrastructure."}</p></section><section className="catalogFilters shell"><a className={!selected ? "active" : ""} href="/en/products">All</a>{categories.map((category) => <a className={selected === category.slug ? "active" : ""} key={category.id} href={`/en/products?category=${encodeURIComponent(category.slug)}`}>{category.name}</a>)}</section><section className="catalogGrid shell">{products.map((product) => <article key={product.id} className="catalogCard"><div className="catalogMedia">{product.mediaAssets[0] ? <img src={product.mediaAssets[0].url} alt={product.mediaAssets[0].alt ?? product.name} /> : <div className="catalogCabinet"><span>ELSYSTAR</span></div>}</div><div><p className="eyebrow">{product.category?.name ?? "ELSYSTAR"}</p><h2>{product.model}</h2><h3>{product.name}</h3><p>{product.shortDescription}</p><div className="catalogSpecs">{product.specifications.slice(0,3).map((spec) => <span key={spec.id}>{spec.label}: <b>{spec.value}{spec.unit ? ` ${spec.unit}` : ""}</b></span>)}</div><a className="textLink" href={`/en/products/${product.slug}`}>Learn more →</a></div></article>)}</section>{!products.length && <section className="shell emptyCatalog"><h2>No translated products in this category yet</h2><p>English product cards appear after their translation is added in the administration panel.</p></section>}{footer()}</main>;
}

async function productPage(slug: string, translations: Awaited<ReturnType<typeof getTranslationMap>>) {
  const raw = await getProductBySlug(slug); if (!raw) notFound();
  const product = localizeProduct(raw, translations); const primary = product.mediaAssets.find((item) => item.isPrimary) ?? product.mediaAssets[0];
  return <main lang="en">{header("#request")}<section className="productHero shell"><div><a className="backLink" href="/en/products">← All products</a><p className="eyebrow">{product.model}</p><h1>{product.name}</h1><p className="lead">{product.shortDescription}</p><div className="heroButtons"><a className="button" href="#request">Request a quote</a>{product.documents.length > 0 && <a className="button ghost" href="#documents">Documentation</a>}</div></div><div className="productVisual productMediaHero">{primary ? <img src={primary.url} alt={primary.alt ?? product.name} /> : <div className="productCabinet"><div className="cabinetLogo">ELSYSTAR</div><div className="vents"></div><div className="handle"></div><small>{product.model}</small></div>}</div></section>
    <section className="productBody shell"><article className="productDescription"><p className="eyebrow">DESCRIPTION</p><h2>Purpose and capabilities</h2><p>{product.description || product.shortDescription}</p></article><article className="specPanel"><p className="eyebrow">SPECIFICATIONS</p><h2>Key parameters</h2>{product.specifications.length ? <div className="publicSpecList">{product.specifications.map((spec) => <div key={spec.id}><span>{spec.label}</span><strong>{spec.value}{spec.unit ? ` ${spec.unit}` : ""}</strong></div>)}</div> : <p className="mutedText">Specifications are being prepared.</p>}</article></section>
    {product.features.length > 0 && <section className="section shell productFeatures"><div className="sectionHead"><div><p className="eyebrow">CAPABILITIES</p><h2>Key features</h2></div></div><div className="threeCards">{product.features.map((feature) => <article key={feature.id}><div className="icon">✓</div><h3>{feature.title}</h3><p>{feature.description}</p></article>)}</div></section>}
    {product.configurations.length > 0 && <section className="section shell"><div className="sectionHead"><div><p className="eyebrow">CONFIGURATIONS</p><h2>Available configurations</h2></div></div><div className="configurationGrid">{product.configurations.map((item) => <article key={item.id}><span>{item.sku || "Configuration"}</span><h3>{item.name}</h3><p>{item.description || "Contact ELSYSTAR for configuration details."}</p><a href="#request">Request configuration →</a></article>)}</div></section>}
    {product.relatedProducts.length > 0 && <section className="section shell"><div className="sectionHead"><div><p className="eyebrow">RELATED PRODUCTS</p><h2>Compatibility and alternatives</h2></div></div><div className="relatedProductGrid">{product.relatedProducts.map((relation) => <article key={relation.id}>{relation.product.imageUrl ? <img src={relation.product.imageUrl} alt={relation.product.name} /> : <div className="miniCabinet"></div>}<span>{relationLabels[relation.type] ?? "Related product"}</span><h3>{relation.product.model}</h3><p>{relation.product.shortDescription}</p><a href={`/en/products/${relation.product.slug}`}>Learn more →</a></article>)}</div></section>}
    <section id="documents" className="documentsSection shell"><div className="sectionHead"><div><p className="eyebrow">DOCUMENTATION</p><h2>Product materials</h2></div><a href="/en/support">Documentation center →</a></div>{product.documents.length ? <div className="documentGrid">{product.documents.map((document) => <a key={document.id} href={document.fileUrl} target="_blank" rel="noreferrer"><span>{document.type}</span><strong>{document.title}</strong><small>{document.version ? `Version ${document.version}` : "Open document"}</small></a>)}</div> : <p className="mutedText">Technical materials will appear here after publication.</p>}</section>
    <section id="request" className="requestSection shell"><div className="requestIntro"><p className="eyebrow">ENGINEERING CONSULTATION</p><h2>Discuss {product.model}</h2><p>We can help verify compatibility, select a configuration and prepare a commercial proposal.</p></div><LeadForm locale="en" productId={product.id} productLabel={product.model} /></section>{footer()}</main>;
}

async function solutionsPage(translations: Awaited<ReturnType<typeof getTranslationMap>>) {
  const solutions = (await getPublishedSolutions()).filter((item) => hasTranslation(translations, "Solution", item.slug, "name")).map((item) => localizeSolution(item, translations));
  return <main lang="en">{header()}<section className="pageHero shell compactHero"><p className="eyebrow">SOLUTIONS</p><h1>Traffic management solutions</h1><p className="lead">From individual signalized intersections to centralized city-wide monitoring and dispatching.</p></section><section className="section shell"><div className="threeCards">{solutions.map((item) => <article className="solutionVisualCard" key={item.id}>{item.imageUrl && <img src={item.imageUrl} alt={item.name} />}<div className="visualCardBody"><span>{item.type === "PLATFORM" ? "PLATFORM" : "SOLUTION"}</span><h2>{item.name}</h2><p>{item.shortDescription}</p><a href={`/en/solutions/${item.slug}`}>Learn more →</a></div></article>)}</div></section>{footer()}</main>;
}

async function solutionPage(slug: string, translations: Awaited<ReturnType<typeof getTranslationMap>>) {
  const raw = await getSolutionBySlug(slug); if (!raw) notFound(); const item = localizeSolution(raw, translations);
  return <main lang="en">{header()}<section className="pageHero shell"><p className="eyebrow">{item.type === "PLATFORM" ? "PLATFORM" : "SOLUTION"}</p><h1>{item.name}</h1><p className="lead">{item.shortDescription}</p></section><section className="productBody shell"><article className="productDescription"><p className="eyebrow">OVERVIEW</p><h2>Engineering scope</h2><p>{item.description || item.shortDescription}</p></article><article className="specPanel"><p className="eyebrow">ELSYSTAR</p><h2>Integration approach</h2><p>Solutions are built around ELSYSTAR controllers, monitoring, communications and software components according to the requirements of the specific traffic-control site.</p></article></section><section className="support shell"><div><p className="eyebrow">PROJECT DISCUSSION</p><h2>Need a configuration for your site?</h2><p>Send the site requirements and the ELSYSTAR team can prepare an engineering proposal.</p></div><a className="button" href="/en/contacts#request">Contact an engineer</a></section>{footer()}</main>;
}

async function projectsPage(translations: Awaited<ReturnType<typeof getTranslationMap>>) {
  const projects = (await getPublishedProjects()).filter((item) => hasTranslation(translations, "Project", item.slug, "title")).map((item) => localizeProject(item, translations));
  return <main lang="en">{header()}<section className="pageHero shell compactHero"><p className="eyebrow">PROJECTS</p><h1>Projects and demonstration scenarios</h1><p className="lead">Real deployments are published from the CMS. Modelled demonstration cases are always explicitly marked as demo content.</p></section><section className="section shell"><div className="homeProjectGrid">{projects.map((project) => <article key={project.id}>{project.coverImageUrl && <img src={project.coverImageUrl} alt={project.title} />}<div className="projectCardBody">{project.isDemo && <span className="demoBadge">Demo case</span>}<span>{[project.city, project.year].filter(Boolean).join(" · ")}</span><h2>{project.title}</h2><p>{project.summary}</p><a href={`/en/projects/${project.slug}`}>View case →</a></div></article>)}</div></section>{footer()}</main>;
}

async function projectPage(slug: string, translations: Awaited<ReturnType<typeof getTranslationMap>>) {
  const raw = await getProjectBySlug(slug); if (!raw) notFound(); const project = localizeProject(raw, translations);
  return <main lang="en">{header()}<section className="pageHero shell"><div>{project.isDemo && <span className="demoBadge">Demo case — modelled data</span>}<p className="eyebrow">{[project.city, project.region, project.year].filter(Boolean).join(" · ")}</p><h1>{project.title}</h1><p className="lead">{project.summary}</p></div></section>{project.coverImageUrl && <section className="projectHeroMedia shell"><img src={project.coverImageUrl} alt={project.title} /></section>}<section className="productBody shell"><article className="productDescription"><p className="eyebrow">CHALLENGE</p><h2>Project objective</h2><p>{project.challenge || project.summary}</p></article><article className="productDescription"><p className="eyebrow">SOLUTION</p><h2>Engineering approach</h2><p>{project.solutionText || "Project details are being prepared."}</p></article></section><section className="section shell"><div className="sectionHead"><div><p className="eyebrow">RESULT</p><h2>{project.isDemo ? "Modelled outcome" : "Project outcome"}</h2></div></div><p className="lead">{project.result || "Results are being prepared."}</p>{project.metrics.length > 0 && <div className="projectMetrics">{project.metrics.map((metric) => <div key={`${metric.value}-${metric.label}`}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}</div>}</section>{footer()}</main>;
}

async function corporatePage(kind: "about" | "production" | "contacts", translations: Awaited<ReturnType<typeof getTranslationMap>>) {
  const corporate = localizeCorporate(await getCorporateContent() as any, translations) as any;
  if (kind === "contacts") return <main lang="en">{header("#request")}<section className="pageHero shell compactHero"><p className="eyebrow">CONTACTS</p><h1>Contact ELSYSTAR</h1><p className="lead">Equipment selection, engineering support, documentation and commercial requests.</p></section><section className="contactGrid shell"><article><span>Phone</span><strong>{corporate.phonePrimary || "—"}</strong>{corporate.phoneSecondary && <p>{corporate.phoneSecondary}</p>}</article><article><span>Email</span><strong>{corporate.emailPrimary || "—"}</strong></article><article><span>Legal entity</span><strong>{corporate.legalName || corporate.companyName}</strong>{corporate.address && <p>{corporate.address}</p>}</article></section><section id="request" className="requestSection shell"><div className="requestIntro"><p className="eyebrow">REQUEST</p><h2>Tell us about your project</h2><p>Describe the site, equipment or integration task. We will use your contact details to respond.</p></div><LeadForm locale="en" /></section>{footer(corporate)}</main>;
  if (kind === "production") return <main lang="en">{header()}<section className="pageHero shell"><p className="eyebrow">{corporate.productionEyebrow}</p><h1>{corporate.productionTitle}</h1><p className="lead">{corporate.productionLead}</p></section><section className="productBody shell"><article className="productDescription"><p className="eyebrow">MANUFACTURING</p><h2>Equipment production</h2><p>{corporate.productionBody}</p></article><article className="specPanel"><p className="eyebrow">PORTFOLIO</p><h2>From components to systems</h2><p>ELSYSTAR manufactures traffic controllers and supporting modules and supplies complete automated traffic-management solutions.</p></article></section>{footer(corporate)}</main>;
  return <main lang="en">{header()}<section className="pageHero shell"><p className="eyebrow">{corporate.aboutEyebrow}</p><h1>{corporate.aboutTitle}</h1><p className="lead">{corporate.aboutLead}</p></section><section className="productBody shell"><article className="productDescription"><p className="eyebrow">ABOUT</p><h2>{corporate.companyName}</h2><p>{corporate.aboutBody}</p></article><article className="productDescription"><p className="eyebrow">EXPERIENCE</p><h2>{corporate.historyTitle}</h2><p>{corporate.historyBody}</p></article></section><section className="section shell"><div className="sectionHead"><div><p className="eyebrow">COMPETENCIES</p><h2>{corporate.competenciesTitle}</h2></div></div><div className="threeCards">{corporate.competencies.map((item: any) => <article key={item.id}><h3>{item.title}</h3><p>{item.description}</p></article>)}</div></section>{footer(corporate)}</main>;
}

async function faqPage(translations: Awaited<ReturnType<typeof getTranslationMap>>) {
  const faqs = (await getFaqEntries()).map((item) => localizeFaq(item, translations));
  return <main lang="en">{header()}<section className="pageHero shell compactHero"><p className="eyebrow">FAQ</p><h1>Frequently asked questions</h1><p className="lead">Products, documentation, software and commercial requests.</p></section><section className="section shell"><div className="faqList">{faqs.map((entry) => <article key={entry.id}><h2>{entry.question}</h2><p>{entry.answer}</p></article>)}</div></section>{footer()}</main>;
}

async function supportPage(translations: Awaited<ReturnType<typeof getTranslationMap>>, query: Record<string, string | string[] | undefined>) {
  const q = typeof query.q === "string" ? query.q : undefined; const type = typeof query.type === "string" ? query.type : undefined; const product = typeof query.product === "string" ? query.product : undefined; const language = typeof query.language === "string" ? query.language : undefined;
  const [library, corporate] = await Promise.all([getSupportLibrary({ q, type, productId: product, language }), getCorporateContent()]); const company = localizeCorporate(corporate as any, translations) as any;
  return <main lang="en">{header()}<section className="pageHero shell compactHero"><p className="eyebrow">DOCUMENTATION & SUPPORT</p><h1>{company.supportTitle}</h1><p className="lead">{company.supportBody}</p></section><section className="supportFilters shell"><form><input name="q" defaultValue={q ?? ""} placeholder="Search title, product or description" /><select name="type" defaultValue={type ?? ""}><option value="">All types</option>{Object.values(DocumentType).map((item) => <option key={item} value={item}>{documentLabels[item]}</option>)}</select><select name="product" defaultValue={product ?? ""}><option value="">All products</option>{library.products.map((item) => <option key={item.id} value={item.id}>{item.model}</option>)}</select><select name="language" defaultValue={language ?? ""}><option value="">All languages</option>{library.languages.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}</select><button className="button small" type="submit">Search</button><a href="/en/support">Reset</a></form></section><section className="supportLibrary shell">{library.series.length > 0 && <div className="supportSeriesGrid">{library.series.map((series) => { const current = series.currentVersion; return <article key={series.id} className="supportSeriesCard"><div className="supportSeriesTop"><span>{documentLabels[series.type] ?? series.type}</span><span>{series.language.toUpperCase()}</span></div><h2>{tr(translations, "DocumentSeries", series.slug, "title", series.title)}</h2><p>{tr(translations, "DocumentSeries", series.slug, "description", series.description) || current?.description || "ELSYSTAR technical material."}</p><div className="supportSeriesMeta">{current?.version && <strong>v{current.version}</strong>}{current?.releaseDate && <span>{current.releaseDate.toLocaleDateString("en-GB")}</span>}{current?.fileSize && <span>{formatSize(current.fileSize)}</span>}</div><div className="supportSeriesActions">{current && <a className="button small" href={current.fileUrl} target="_blank" rel="noreferrer">Download current</a>}<a href={`/en/support/${series.slug}`}>Version history →</a></div></article>; })}</div>}{!library.series.length && !library.legacy.length && <div className="emptyLibrary"><h2>No materials match the selected filters</h2><p>Change the filters or contact ELSYSTAR technical support.</p></div>}</section>{footer(company)}</main>;
}

async function supportDetail(slug: string, translations: Awaited<ReturnType<typeof getTranslationMap>>) {
  const series = await getPublicDocumentSeriesBySlug(slug); if (!series) notFound(); const title = tr(translations, "DocumentSeries", series.slug, "title", series.title); const description = tr(translations, "DocumentSeries", series.slug, "description", series.description);
  return <main lang="en">{header()}<section className="pageHero shell compactHero"><a className="backLink" href="/en/support">← Documentation center</a><p className="eyebrow">{documentLabels[series.type] ?? series.type} · {series.language.toUpperCase()}</p><h1>{title}</h1><p className="lead">{description || "ELSYSTAR technical documentation series."}</p></section><section className="section shell"><div className="documentList">{series.versions.map((version) => <a key={version.id} href={version.fileUrl} target="_blank" rel="noreferrer"><div><strong>{tr(translations, "Document", version.id, "title", version.title)}</strong><p>{tr(translations, "Document", version.id, "description", version.description) || version.fileName}</p></div><div className="documentMeta">{version.version && <span>v{version.version}</span>}<span>{version.language.toUpperCase()}</span>{version.isCurrent && <b>Current</b>}<b>Open ↗</b></div></a>)}</div></section>{footer()}</main>;
}

export default async function EnglishPage({ params, searchParams }: { params: Promise<{ path?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { path } = await params; const query = await searchParams; const parts = pathOf(path); const translations = await getTranslationMap("en");
  if (!parts.length) return homePage(translations);
  if (parts[0] === "products" && !parts[1]) return productsPage(translations, query);
  if (parts[0] === "products" && parts[1]) return productPage(parts[1], translations);
  if (parts[0] === "solutions" && !parts[1]) return solutionsPage(translations);
  if (parts[0] === "solutions" && parts[1]) return solutionPage(parts[1], translations);
  if (parts[0] === "projects" && !parts[1]) return projectsPage(translations);
  if (parts[0] === "projects" && parts[1]) return projectPage(parts[1], translations);
  if (parts[0] === "support" && !parts[1]) return supportPage(translations, query);
  if (parts[0] === "support" && parts[1]) return supportDetail(parts[1], translations);
  if (parts[0] === "about") return corporatePage("about", translations);
  if (parts[0] === "production") return corporatePage("production", translations);
  if (parts[0] === "contacts") return corporatePage("contacts", translations);
  if (parts[0] === "faq") return faqPage(translations);
  notFound();
}
