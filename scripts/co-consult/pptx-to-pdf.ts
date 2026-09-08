#!/usr/bin/env bun
/**
 * @version 1.0.0
 * @description Converts a .pptx file to PDF via headless LibreOffice, for the
 * proposal-writing skill's rendering step (and any other pptx deliverable).
 *
 * IMPORTANT: the target format is forced to `pdf:impress_pdf_Export` rather
 * than the plain `pdf` shorthand. LibreOffice's format auto-detection
 * mis-identifies the Flat OPC single-file .pptx produced by
 * scripts/md-to-ooxml.ts as a Calc (spreadsheet) document and silently
 * converts it with the wrong filter, corrupting the output - confirmed via
 * manual testing 2026-09-08. Forcing the Impress filter explicitly sidesteps
 * the misdetection.
 *
 * @usage bun scripts/co-consult/pptx-to-pdf.ts <input.pptx> [--outdir <dir>]
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

function usage(): never {
  console.error("Usage: bun scripts/co-consult/pptx-to-pdf.ts <input.pptx> [--outdir <dir>]");
  process.exit(1);
}

function findLibreOffice(): string | null {
  const { platform } = process;

  if (platform === "win32") {
    const candidates = [
      "C:/Program Files/LibreOffice/program/soffice.exe",
      "C:/Program Files (x86)/LibreOffice/program/soffice.exe",
    ];
    for (const p of candidates) {
      if (existsSync(p)) return p;
    }
    try {
      const result = execSync("where soffice", { encoding: "utf8", stdio: "pipe" });
      return result.trim().split("\n")[0];
    } catch {
      /* not in PATH */
    }
    return null;
  }

  if (platform === "darwin") {
    const macPath = "/Applications/LibreOffice.app/Contents/MacOS/soffice";
    if (existsSync(macPath)) return macPath;
    try {
      const result = execSync("which soffice", { encoding: "utf8", stdio: "pipe" });
      return result.trim().split("\n")[0];
    } catch {
      /* not in PATH */
    }
    return null;
  }

  try {
    const result = execSync("which soffice", { encoding: "utf8", stdio: "pipe" });
    return result.trim().split("\n")[0];
  } catch {
    /* not in PATH */
  }
  return null;
}

/**
 * Escape a path for safe interpolation inside a double-quoted shell argument.
 * Mirrors md-to-report.ts's shellEscapePath - execSync always spawns via a
 * shell, so paths must be escaped before interpolation to avoid a
 * shell-injection-shaped risk.
 */
function shellEscapePath(path: string): string {
  // On win32, execSync spawns via cmd.exe, where backslash is not an escape
  // character inside a double-quoted argument - doubling it corrupts native
  // Windows paths (confirmed via manual testing 2026-09-08). Only quotes need
  // escaping there. POSIX shells get the fuller escape set.
  if (process.platform === "win32") {
    return path.replace(/"/g, '\\"');
  }
  return path
    .replace(/\\/g, "\\\\")
    .replace(/\$/g, "\\$")
    .replace(/`/g, "\\`")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/"/g, '\\"');
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) usage();

  const inputPath = resolve(args[0]);
  const outdirFlagIdx = args.indexOf("--outdir");
  const outDir = outdirFlagIdx >= 0 && args[outdirFlagIdx + 1] ? resolve(args[outdirFlagIdx + 1]) : dirname(inputPath);

  if (!existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const soffice = findLibreOffice();
  if (!soffice) {
    console.error("Error: LibreOffice not found. Install it to enable pptx -> PDF conversion.");
    process.exit(1);
  }

  const safeOutDir = shellEscapePath(outDir);
  const safeInputPath = shellEscapePath(inputPath);
  const command = [
    `"${soffice}"`,
    "--headless",
    "--convert-to",
    "pdf:impress_pdf_Export",
    "--outdir",
    `"${safeOutDir}"`,
    `"${safeInputPath}"`,
  ].join(" ");

  try {
    execSync(command, { encoding: "utf8", stdio: "pipe", timeout: 60_000 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error: LibreOffice conversion failed: ${msg}`);
    process.exit(1);
  }

  const pdfPath = join(outDir, basename(inputPath, ".pptx") + ".pdf");
  if (!existsSync(pdfPath)) {
    console.error("Error: Conversion reported success but the PDF file was not found.");
    process.exit(1);
  }

  console.log(`PDF written to ${pdfPath}`);
}

main();
