#!/usr/bin/env node
/**
 * build.js — run this locally before pushing to GitHub.
 * Scans your problems/ and solutions/ folders and writes archive.json.
 *
 * Usage:
 *   node build.js
 *
 * Requirements: Node.js (no extra packages needed)
 */

const fs   = require("fs");
const path = require("path");

// ── CONFIG ────────────────────────────────────────────────────
const PROBLEMS_ROOT  = "problems";
const SOLUTIONS_ROOT = "solutions";
const OUTPUT_FILE    = "archive.json";
// ─────────────────────────────────────────────────────────────

function getDirs(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();
}

function prettify(name) {
  return name.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

const competitions = getDirs(PROBLEMS_ROOT);

const archive = competitions.map(comp => {
  const compPath = path.join(PROBLEMS_ROOT, comp);
  const yearDirs = getDirs(compPath);
  const hasYears = yearDirs.length > 0 && yearDirs.every(d => /^\d{4}$/.test(d));

  const years = hasYears
    ? yearDirs.map(year => {
        const yearPath = path.join(compPath, year);
        const problems = getDirs(yearPath).map(prob => {
          const solPath    = path.join(SOLUTIONS_ROOT, comp, year, prob);
          const hasSolution = fs.existsSync(solPath);
          return {
            name:        prob,
            pretty:      prettify(prob),
            probPath:    path.join(PROBLEMS_ROOT,  comp, year, prob).replace(/\\/g, "/"),
            solPath:     hasSolution
                           ? path.join(SOLUTIONS_ROOT, comp, year, prob).replace(/\\/g, "/")
                           : null,
          };
        });
        return { year, problems };
      })
    : [];

  return {
    name:   prettify(comp),
    slug:   comp,
    path:   compPath.replace(/\\/g, "/"),
    years,
  };
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(archive, null, 2));

// Summary
const totalProblems  = archive.reduce((a, c) => a + c.years.reduce((b, y) => b + y.problems.length, 0), 0);
const totalSolutions = archive.reduce((a, c) => a + c.years.reduce((b, y) => b + y.problems.filter(p => p.solPath).length, 0), 0);

console.log(`✓ ${OUTPUT_FILE} written`);
console.log(`  ${archive.length} competition(s)`);
console.log(`  ${totalProblems} problem(s)`);
console.log(`  ${totalSolutions} solution(s)`);