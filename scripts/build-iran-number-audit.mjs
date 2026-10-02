/** Rebuild with the exact generation, validation and scene modules used by the UI. */
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'vite';
const root = process.cwd();
const out = path.resolve(process.argv[2] ?? 'docs/research/iran-customizer/numbering-audit.json');
const result = await build({ root, configFile: false, logLevel: 'warn', build: { write: false, minify: false, lib: { entry: path.join(root, 'src/templates/iran-number-audit.ts'), formats: ['es'] } } });
const code = (Array.isArray(result) ? result : [result]).flatMap(result => result.output).filter(item => item.type === 'chunk').map(item => item.code).join('\n');
const { buildIranNumberAudit } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const report = buildIranNumberAudit();
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ out, presetCount: report.presetCount, totalChecks: report.totalChecks, failedChecks: report.failedChecks, failures: report.presets.filter(preset => !preset.passed).map(preset => ({ id: preset.id, checks: preset.checks.filter(check => !check.pass) })) }, null, 2));
if (!report.passed) process.exitCode = 1;
