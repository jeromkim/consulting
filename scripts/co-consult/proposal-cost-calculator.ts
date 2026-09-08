#!/usr/bin/env bun
/**
 * Proposal Cost Calculator
 * Computes total labor cost (role x day-rate x duration) and total
 * solution/license/infra cost for a single engagement's proposal, from a
 * per-engagement cost input file. Exists to satisfy the workspace's
 * Computational Integrity policy: numeric outputs must be computed by
 * executed code, never by hand or AI arithmetic (docs/context.md
 * Computational Integrity Standards).
 *
 * @version 1.0.0
 * Usage:
 *   bun scripts/co-consult/proposal-cost-calculator.ts <cost-input.yaml> [--output <output-path>]
 * @module proposal-cost-calculator
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { load as yamlLoad } from "js-yaml";

interface RoleCost {
  role: string;
  day_rate: number;
  duration_days: number;
}

interface SolutionCost {
  item: string;
  cost: number;
}

interface CostInput {
  roles: RoleCost[];
  solution_costs: SolutionCost[];
}

function usage(): never {
  console.error(
    "Usage: bun scripts/co-consult/proposal-cost-calculator.ts <cost-input.yaml|.json> [--output <output-path>]"
  );
  process.exit(1);
}

function loadInput(path: string): CostInput {
  const raw = readFileSync(path, "utf-8");
  const parsed = path.endsWith(".json") ? JSON.parse(raw) : (yamlLoad(raw) as unknown);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Cost input file did not parse to an object.");
  }
  const data = parsed as Partial<CostInput>;
  const roles = Array.isArray(data.roles) ? data.roles : [];
  const solutionCosts = Array.isArray(data.solution_costs) ? data.solution_costs : [];

  for (const r of roles) {
    if (typeof r.role !== "string" || !r.role.trim()) {
      throw new Error("Every role entry requires a non-empty 'role' string.");
    }
    if (typeof r.day_rate !== "number" || !Number.isFinite(r.day_rate) || r.day_rate < 0) {
      throw new Error(`Role "${r.role}" has an invalid day_rate: ${JSON.stringify(r.day_rate)}`);
    }
    if (
      typeof r.duration_days !== "number" ||
      !Number.isFinite(r.duration_days) ||
      r.duration_days < 0
    ) {
      throw new Error(
        `Role "${r.role}" has an invalid duration_days: ${JSON.stringify(r.duration_days)}`
      );
    }
  }
  for (const s of solutionCosts) {
    if (typeof s.item !== "string" || !s.item.trim()) {
      throw new Error("Every solution_costs entry requires a non-empty 'item' string.");
    }
    if (typeof s.cost !== "number" || !Number.isFinite(s.cost) || s.cost < 0) {
      throw new Error(`Item "${s.item}" has an invalid cost: ${JSON.stringify(s.cost)}`);
    }
  }

  return { roles, solution_costs: solutionCosts };
}

function computeLaborCost(roles: RoleCost[]) {
  const lineItems = roles.map((r) => ({
    role: r.role,
    day_rate: r.day_rate,
    duration_days: r.duration_days,
    subtotal: r.day_rate * r.duration_days,
  }));
  const total = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
  return { lineItems, total };
}

function computeSolutionCost(items: SolutionCost[]) {
  const total = items.reduce((sum, i) => sum + i.cost, 0);
  return { lineItems: items, total };
}

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function renderMarkdown(labor: ReturnType<typeof computeLaborCost>, solution: ReturnType<typeof computeSolutionCost>) {
  const grandTotal = labor.total + solution.total;
  const lines: string[] = [];
  lines.push("## Proposal Cost Estimate");
  lines.push("");
  lines.push("### Labor Cost");
  lines.push("");
  lines.push("| Role | Day Rate | Duration (days) | Subtotal |");
  lines.push("|------|---------:|-----------------:|---------:|");
  for (const li of labor.lineItems) {
    lines.push(
      `| ${li.role} | ${formatCurrency(li.day_rate)} | ${li.duration_days} | ${formatCurrency(li.subtotal)} |`
    );
  }
  lines.push(`| **Total Labor Cost** | | | **${formatCurrency(labor.total)}** |`);
  lines.push("");
  lines.push("### Solution / License / Infra Cost");
  lines.push("");
  lines.push("| Item | Cost |");
  lines.push("|------|-----:|");
  for (const li of solution.lineItems) {
    lines.push(`| ${li.item} | ${formatCurrency(li.cost)} |`);
  }
  lines.push(`| **Total Solution Cost** | **${formatCurrency(solution.total)}** |`);
  lines.push("");
  lines.push(`### Grand Total: ${formatCurrency(grandTotal)}`);
  lines.push("");
  return lines.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) usage();

  const inputPath = resolve(args[0]);
  const outputFlagIdx = args.indexOf("--output");
  const outputPath =
    outputFlagIdx >= 0 && args[outputFlagIdx + 1] ? resolve(args[outputFlagIdx + 1]) : null;

  if (!existsSync(inputPath)) {
    console.error(`Error: Cost input file not found: ${inputPath}`);
    process.exit(1);
  }

  let input: CostInput;
  try {
    input = loadInput(inputPath);
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }

  const labor = computeLaborCost(input.roles);
  const solution = computeSolutionCost(input.solution_costs);
  const grandTotal = labor.total + solution.total;

  const result = {
    input_file: inputPath,
    labor_cost: { line_items: labor.lineItems, total: labor.total },
    solution_cost: { line_items: solution.lineItems, total: solution.total },
    grand_total: grandTotal,
  };

  const markdown = renderMarkdown(labor, solution);

  if (outputPath) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath.replace(/\.json$/, "").concat(".md"), markdown, "utf-8");
    writeFileSync(
      outputPath.replace(/\.md$/, "").concat(".json"),
      JSON.stringify(result, null, 2),
      "utf-8"
    );
    console.log(`Cost estimate written to ${outputPath.replace(/\.(md|json)$/, "")}.md/.json`);
  } else {
    console.log(markdown);
    console.log("\n```json");
    console.log(JSON.stringify(result, null, 2));
    console.log("```");
  }
}

main();
