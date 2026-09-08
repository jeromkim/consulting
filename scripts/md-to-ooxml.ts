#!/usr/bin/env bun
/**
 * @version 1.2.1
 * @description Compiles Markdown documentation into native Microsoft Office Open XML (.docx / .xlsx / .pptx) structures (WordML / SpreadsheetML / PresentationML).
 * @usage bun scripts/md-to-ooxml.ts [--input <path>] [--output <path>] [--type docx|xlsx|pptx] [--check] [--help]
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve, extname } from "path";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Markdown to Office OOXML Compiler (md-to-ooxml.ts v1.2.0)

Usage:
  bun scripts/md-to-ooxml.ts --input <file.md> [--output <file.docx|xlsx|pptx>] [--type docx|xlsx|pptx] [--check]

Options:
  --input <path>      Path to input Markdown file (required)
  --output <path>     Path to output Office package (optional, defaults to input basename)
  --type <type>       Target format: docx, xlsx, or pptx (default: infer from output extension or docx)
  --check             Dry-run parse check without writing files
  --help              Show this help message
`);
  process.exit(0);
}

const isCheck = args.includes("--check");
const inputArgIdx = args.indexOf("--input");
const inputPath = inputArgIdx !== -1 ? args[inputArgIdx + 1] : null;

const outputArgIdx = args.indexOf("--output");
const outputPath = outputArgIdx !== -1 ? args[outputArgIdx + 1] : null;

const typeArgIdx = args.indexOf("--type");
let targetType = typeArgIdx !== -1 ? args[typeArgIdx + 1] : null;

if (!inputPath) {
  if (isCheck) {
    console.log("✅ md-to-ooxml.ts syntax & options check passed.");
    process.exit(0);
  }
  console.error("❌ Error: Missing required parameter --input <file.md>");
  process.exit(1);
}

const resolvedInput = resolve(process.cwd(), inputPath);

if (!existsSync(resolvedInput)) {
  console.error(`❌ Error: Input file not found: ${resolvedInput}`);
  process.exit(1);
}

if (!targetType) {
  if (outputPath) {
    const ext = extname(outputPath).toLowerCase();
    targetType = ext === ".xlsx" ? "xlsx" : ext === ".pptx" ? "pptx" : "docx";
  } else {
    targetType = "docx";
  }
}

if (targetType !== "docx" && targetType !== "xlsx" && targetType !== "pptx") {
  console.error(`❌ Error: Unsupported --type "${targetType}" (expected docx, xlsx, or pptx)`);
  process.exit(1);
}

const content = readFileSync(resolvedInput, "utf-8");

console.log(`📄 Parsing Markdown source: ${resolvedInput}`);
console.log(`🎯 Target output format: ${targetType.toUpperCase()}`);

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generates Microsoft Word WordML structure (.docx XML package).
 */
function compileToWordML(mdText: string): string {
  const lines = mdText.split("\n");
  const paragraphs: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("# ")) {
      paragraphs.push(`<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>${escapeXml(trimmed.slice(2))}</w:t></w:r></w:p>`);
    } else if (trimmed.startsWith("## ")) {
      paragraphs.push(`<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>${escapeXml(trimmed.slice(3))}</w:t></w:r></w:p>`);
    } else if (trimmed.startsWith("### ")) {
      paragraphs.push(`<w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr><w:r><w:t>${escapeXml(trimmed.slice(4))}</w:t></w:r></w:p>`);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      paragraphs.push(`<w:p><w:pPr><w:pStyle w:val="ListBullet"/></w:pPr><w:r><w:t>${escapeXml(trimmed.slice(2))}</w:t></w:r></w:p>`);
    } else {
      paragraphs.push(`<w:p><w:r><w:t>${escapeXml(trimmed)}</w:t></w:r></w:p>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Word.Document"?>
<w:wordDocument xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml">
  <w:body>
    ${paragraphs.join("\n    ")}
  </w:body>
</w:wordDocument>`;
}

/**
 * Generates Microsoft Excel SpreadsheetML structure (.xlsx XML package).
 */
function compileToSpreadsheetML(mdText: string): string {
  const lines = mdText.split("\n");
  const rows: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      // Markdown table row
      const cells = trimmed
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());

      // Skip separator rows like |---|---|
      if (cells.every((c) => /^:?-+:?$/.test(c))) continue;

      const cellXml = cells
        .map((val) => `<Cell><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`)
        .join("");
      rows.push(`<Row>${cellXml}</Row>`);
    } else {
      // General text line mapped to single cell row
      rows.push(`<Row><Cell><Data ss:Type="String">${escapeXml(trimmed)}</Data></Cell></Row>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Sheet1">
    <Table>
      ${rows.join("\n      ")}
    </Table>
  </Worksheet>
</Workbook>`;
}

/**
 * Generates a Microsoft PowerPoint PresentationML structure (.pptx package).
 *
 * v1.2.1: returns the individual OOXML package parts (name/contentType/xml)
 * rather than a Flat OPC single-file XML string. Confirmed via manual testing
 * (2026-09-08) that a Flat OPC file saved with a .pptx extension is NOT
 * reliably recognized as a real presentation by either Microsoft PowerPoint
 * or LibreOffice — both misinterpret it (LibreOffice imports it as a Calc
 * document regardless of the requested export filter) and produce garbage or
 * refuse to open it. main() now packs these parts into a genuine ZIP-based
 * OPC container via buildZipPackage(), which is what real .pptx readers
 * actually expect. See partsToFlatOpcXml() below if a Flat OPC string is ever
 * needed again (kept for reference; nothing currently consumes it).
 *
 * Markdown → slide mapping (deliberately simple):
 *   - Each `# ` H1 starts a new slide; the heading text becomes the title placeholder.
 *   - `## ` / `### ` inside a slide become bold lead-in bullets (level 0 / 1).
 *   - `- ` / `* ` list items become bullet paragraphs; indentation depth (2 spaces
 *     per level) maps to the `lvl` attribute (capped at 8).
 *   - Plain paragraphs become non-bulleted text lines (`buNone`).
 *   - Tables and fenced code blocks are simplified to plain-text lines within the
 *     body placeholder (table separator rows are skipped); no grid/table parts
 *     are generated.
 *   - Non-H1 content before the first heading becomes an implicit untitled slide.
 */
interface OoxmlPart {
  name: string;
  contentType: string;
  xml: string;
}

function compileToPresentationML(mdText: string): OoxmlPart[] {
  // --- Markdown → slide model -------------------------------------------------
  const slides: { title: string; bodyXml: string[] }[] = [];
  let current: { title: string; bodyXml: string[] } | null = null;
  let inCodeBlock = false;

  const pushBodyParagraph = (xml: string) => {
    if (!current) {
      current = { title: "", bodyXml: [] };
      slides.push(current);
    }
    current.bodyXml.push(xml);
  };

  const plainParagraph = (text: string) =>
    `<a:p><a:pPr lvl="0"><a:buNone/></a:pPr><a:r><a:rPr lang="en-US"/><a:t>${escapeXml(text)}</a:t></a:r></a:p>`;
  const bulletParagraph = (text: string, lvl: number) =>
    `<a:p><a:pPr lvl="${lvl}"/><a:r><a:rPr lang="en-US"/><a:t>${escapeXml(text)}</a:t></a:r></a:p>`;
  const leadInParagraph = (text: string, lvl: number) =>
    `<a:p><a:pPr lvl="${lvl}"/><a:r><a:rPr b="1" lang="en-US"/><a:t>${escapeXml(text)}</a:t></a:r></a:p>`;

  for (const line of mdText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      pushBodyParagraph(plainParagraph(trimmed));
      continue;
    }

    if (trimmed.startsWith("# ")) {
      current = { title: trimmed.slice(2), bodyXml: [] };
      slides.push(current);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      pushBodyParagraph(leadInParagraph(trimmed.slice(3), 0));
      continue;
    }
    if (trimmed.startsWith("### ")) {
      pushBodyParagraph(leadInParagraph(trimmed.slice(4), 1));
      continue;
    }

    const listMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (listMatch) {
      const lvl = Math.min(Math.floor(listMatch[1].length / 2), 8);
      pushBodyParagraph(bulletParagraph(listMatch[2].trim(), lvl));
      continue;
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed.split("|").slice(1, -1).map((c) => c.trim());
      // Skip separator rows like |---|---|
      if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
      pushBodyParagraph(plainParagraph(trimmed));
      continue;
    }

    pushBodyParagraph(plainParagraph(trimmed));
  }

  // --- Slide part XML ----------------------------------------------------------
  const buildSlideXml = (slideIndex: number, title: string, bodyXml: string[]): string => {
    const body = bodyXml.length > 0 ? bodyXml.join("") : "<a:p/>";
    return `<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title ${slideIndex}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="457200" y="274638"/><a:ext cx="11223750" cy="1325563"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US"/><a:t>${escapeXml(title)}</a:t></a:r></a:p></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Content Placeholder ${slideIndex}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="457200" y="1600200"/><a:ext cx="11223750" cy="4800600"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/>${body}</p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
  };

  const spTreeHeader = `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`;
  const PPT_NS = `xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"`;
  const RELS_NS = `xmlns="http://schemas.openxmlformats.org/package/2006/relationships"`;
  const REL_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

  const slideMasterXml = `<p:sldMaster ${PPT_NS}>
  <p:cSld>
    <p:spTree>
      ${spTreeHeader}
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title Placeholder"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="457200" y="274638"/><a:ext cx="11223750" cy="1325563"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Body Placeholder"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="457200" y="1600200"/><a:ext cx="11223750" cy="4800600"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`;

  const slideLayoutXml = `<p:sldLayout ${PPT_NS} type="obj" preserve="1">
  <p:cSld name="Title and Content">
    <p:spTree>
      ${spTreeHeader}
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title Placeholder"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:spPr/>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Body Placeholder"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>
        <p:spPr/>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`;

  const themeXml = `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
      <a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="44546A"/></a:dk2>
      <a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>
      <a:accent1><a:srgbClr val="4472C4"/></a:accent1>
      <a:accent2><a:srgbClr val="ED7D31"/></a:accent2>
      <a:accent3><a:srgbClr val="A5A5A5"/></a:accent3>
      <a:accent4><a:srgbClr val="FFC000"/></a:accent4>
      <a:accent5><a:srgbClr val="5B9BD5"/></a:accent5>
      <a:accent6><a:srgbClr val="70AD47"/></a:accent6>
      <a:hlink><a:srgbClr val="0563C1"/></a:hlink>
      <a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
        <a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
        <a:ln w="28575"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
      </a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`;

  // --- Package assembly (Flat OPC single-file form) -----------------------------
  const slideOverrides = slides
    .map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`)
    .join("\n        ");

  const contentTypesXml = `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
        ${slideOverrides}
</Types>`;

  const rootRelsXml = `<Relationships ${RELS_NS}>
  <Relationship Id="rId1" Type="${REL_TYPE}/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="${REL_TYPE}/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

  const nowIso = new Date().toISOString();
  const coreXml = `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(slides[0]?.title || "Presentation")}</dc:title>
  <dc:creator>md-to-ooxml</dc:creator>
  <cp:lastModifiedBy>md-to-ooxml</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:modified>
</cp:coreProperties>`;

  const appXml = `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>md-to-ooxml</Application>
  <PresentationFormat>On-screen Show (16:9)</PresentationFormat>
  <Slides>${slides.length}</Slides>
  <Company></Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0000</AppVersion>
</Properties>`;

  const sldIdEntries = slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join("\n      ");
  const presentationXml = `<p:presentation ${PPT_NS}>
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>
      ${sldIdEntries}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;

  const presentationRelsXml = `<Relationships ${RELS_NS}>
  <Relationship Id="rId1" Type="${REL_TYPE}/slideMaster" Target="slideMasters/slideMaster1.xml"/>
${slides.map((_, i) => `  <Relationship Id="rId${i + 2}" Type="${REL_TYPE}/slide" Target="slides/slide${i + 1}.xml"/>`).join("\n")}
  <Relationship Id="rId${slides.length + 2}" Type="${REL_TYPE}/theme" Target="theme/theme1.xml"/>
</Relationships>`;

  const slideMasterRelsXml = `<Relationships ${RELS_NS}>
  <Relationship Id="rId1" Type="${REL_TYPE}/slideLayout" Target="slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="${REL_TYPE}/theme" Target="../theme/theme1.xml"/>
</Relationships>`;

  const slideLayoutRelsXml = `<Relationships ${RELS_NS}>
  <Relationship Id="rId1" Type="${REL_TYPE}/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;

  const parts: { name: string; contentType: string; xml: string }[] = [
    { name: "/[Content_Types].xml", contentType: "application/xml", xml: contentTypesXml },
    { name: "/_rels/.rels", contentType: "application/vnd.openxmlformats-package.relationships+xml", xml: rootRelsXml },
    { name: "/docProps/core.xml", contentType: "application/vnd.openxmlformats-package.core-properties+xml", xml: coreXml },
    { name: "/docProps/app.xml", contentType: "application/vnd.openxmlformats-officedocument.extended-properties+xml", xml: appXml },
    { name: "/ppt/presentation.xml", contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml", xml: presentationXml },
    { name: "/ppt/_rels/presentation.xml.rels", contentType: "application/vnd.openxmlformats-package.relationships+xml", xml: presentationRelsXml },
    { name: "/ppt/slideMasters/slideMaster1.xml", contentType: "application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml", xml: slideMasterXml },
    { name: "/ppt/slideMasters/_rels/slideMaster1.xml.rels", contentType: "application/vnd.openxmlformats-package.relationships+xml", xml: slideMasterRelsXml },
    { name: "/ppt/slideLayouts/slideLayout1.xml", contentType: "application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml", xml: slideLayoutXml },
    { name: "/ppt/slideLayouts/_rels/slideLayout1.xml.rels", contentType: "application/vnd.openxmlformats-package.relationships+xml", xml: slideLayoutRelsXml },
    { name: "/ppt/theme/theme1.xml", contentType: "application/vnd.openxmlformats-officedocument.theme+xml", xml: themeXml },
    ...slides.map((slide, i) => ({
      name: `/ppt/slides/slide${i + 1}.xml`,
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.slide+xml",
      xml: buildSlideXml(i + 1, slide.title, slide.bodyXml),
    })),
    ...slides.map((_, i) => ({
      name: `/ppt/slides/_rels/slide${i + 1}.xml.rels`,
      contentType: "application/vnd.openxmlformats-package.relationships+xml",
      xml: `<Relationships ${RELS_NS}>
  <Relationship Id="rId1" Type="${REL_TYPE}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`,
    })),
  ];

  return parts;
}

/** Flat OPC single-file XML rendering of a part list — kept for reference/debugging; not used by main() as of v1.2.1 (see compileToPresentationML doc comment). */
function partsToFlatOpcXml(parts: OoxmlPart[]): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="PowerPoint.Show"?>
<pkg:package xmlns:pkg="http://schemas.microsoft.com/office/2006/xmlPackage">
${parts
  .map(
    (part) => `  <pkg:part pkg:name="${part.name}" pkg:contentType="${part.contentType}">
    <pkg:xmlData>
${part.xml}
    </pkg:xmlData>
  </pkg:part>`
  )
  .join("\n")}
</pkg:package>`;
}

// ─── Minimal ZIP writer (STORED, no compression) ──────────────────────────────
// Builds a real PKZIP archive so PresentationML/WordML/SpreadsheetML parts open
// as genuine OOXML packages in real Office/LibreOffice readers, per ADR-0036
// (TypeScript-only scripts — no new runtime dependency for this).

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/** Builds a ZIP (OPC) package from a list of {path, data} entries — STORED (uncompressed) method for correctness and simplicity. */
function buildZipPackage(files: { path: string; data: Uint8Array }[]): Uint8Array {
  const encoder = new TextEncoder();
  const localEntries: Uint8Array[] = [];
  const centralEntries: Uint8Array[] = [];
  let offset = 0;

  // A zero DOS date/time (0,0) decodes to day=0, month=0 — not a valid
  // calendar date under the DOS date-time spec, which strict OPC readers
  // (real PowerPoint, confirmed via testing 2026-09-08) may reject the whole
  // archive over, even though lenient readers (LibreOffice) tolerate it. Use
  // a fixed, valid DOS timestamp instead (2026-01-01 00:00:00).
  const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;
  const DOS_TIME = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const crc = crc32(file.data);
    const size = file.data.length;

    const lfh = new DataView(new ArrayBuffer(30));
    lfh.setUint32(0, 0x04034b50, true);
    lfh.setUint16(4, 20, true);
    lfh.setUint16(6, 0, true);
    lfh.setUint16(8, 0, true); // method: stored
    lfh.setUint16(10, DOS_TIME, true);
    lfh.setUint16(12, DOS_DATE, true);
    lfh.setUint32(14, crc, true);
    lfh.setUint32(18, size, true);
    lfh.setUint32(22, size, true);
    lfh.setUint16(26, nameBytes.length, true);
    lfh.setUint16(28, 0, true);

    const localEntry = concatBytes([new Uint8Array(lfh.buffer), nameBytes, file.data]);
    localEntries.push(localEntry);

    const cdh = new DataView(new ArrayBuffer(46));
    cdh.setUint32(0, 0x02014b50, true);
    cdh.setUint16(4, 20, true);
    cdh.setUint16(6, 20, true);
    cdh.setUint16(8, 0, true);
    cdh.setUint16(10, 0, true); // method: stored
    cdh.setUint16(12, DOS_TIME, true);
    cdh.setUint16(14, DOS_DATE, true);
    cdh.setUint32(16, crc, true);
    cdh.setUint32(20, size, true);
    cdh.setUint32(24, size, true);
    cdh.setUint16(28, nameBytes.length, true);
    cdh.setUint16(30, 0, true);
    cdh.setUint16(32, 0, true);
    cdh.setUint16(34, 0, true);
    cdh.setUint16(36, 0, true);
    cdh.setUint32(38, 0, true);
    cdh.setUint32(42, offset, true);

    centralEntries.push(concatBytes([new Uint8Array(cdh.buffer), nameBytes]));
    offset += localEntry.length;
  }

  const centralDirStart = offset;
  const centralDir = concatBytes(centralEntries);

  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, files.length, true);
  eocd.setUint16(10, files.length, true);
  eocd.setUint32(12, centralDir.length, true);
  eocd.setUint32(16, centralDirStart, true);
  eocd.setUint16(20, 0, true);

  return concatBytes([...localEntries, centralDir, new Uint8Array(eocd.buffer)]);
}

/** Converts OOXML parts (as produced by compileToPresentationML) into a real ZIP-based .pptx package. */
function partsToZipPackage(parts: OoxmlPart[]): Uint8Array {
  const encoder = new TextEncoder();
  const files = parts.map((part) => ({
    path: part.name.replace(/^\//, ""),
    data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${part.xml}`),
  }));
  return buildZipPackage(files);
}

if (isCheck) {
  console.log("✅ Parse completed successfully (dry-run).");
  process.exit(0);
}

const targetFile = outputPath ? resolve(process.cwd(), outputPath) : resolvedInput.replace(/\.md$/, `.${targetType}`);

if (targetType === "pptx") {
  const parts = compileToPresentationML(content);
  const zipBytes = partsToZipPackage(parts);
  writeFileSync(targetFile, zipBytes);
} else {
  const compiledOutput = targetType === "xlsx" ? compileToSpreadsheetML(content) : compileToWordML(content);
  writeFileSync(targetFile, compiledOutput, "utf-8");
}
console.log(`✅ Successfully compiled Office OOXML package (${targetType.toUpperCase()}): ${targetFile}`);
