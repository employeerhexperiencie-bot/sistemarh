#!/usr/bin/env node
/**
 * Varre supabase/migrations/*.sql por padrões historicamente perigosos em RLS.
 * Não falha o build: o repositório contém migrations legadas com USING (true).
 * Uso: revisão humana + tendência zero em NOVOS arquivos.
 * CRITICAL: para bloquear CI em novas violações, compare contra baseline ou main.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');

const PATTERNS = [
  { name: 'USING (true)', re: /USING\s*\(\s*true\s*\)/gi },
  { name: 'WITH CHECK (true)', re: /WITH\s+CHECK\s*\(\s*true\s*\)/gi },
  { name: 'FOR ALL ... USING (true)', re: /FOR\s+ALL[\s\S]{0,120}?USING\s*\(\s*true\s*\)/gi },
];

async function main() {
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  let total = 0;
  const findings = [];

  for (const file of files) {
    const path = join(migrationsDir, file);
    const text = await readFile(path, 'utf8');
    for (const { name, re } of PATTERNS) {
      const matches = text.match(re);
      if (matches?.length) {
        total += matches.length;
        findings.push({ file, pattern: name, count: matches.length });
      }
    }
  }

  console.log('=== Scan de padrões RLS em migrations ===\n');
  if (findings.length === 0) {
    console.log('Nenhum padrão listado encontrado.');
    process.exit(0);
  }
  for (const f of findings) {
    console.log(`${f.file}: ${f.pattern} → ${f.count} ocorrência(s)`);
  }
  console.log(`\nTotal aproximado de matches: ${total}`);
  console.log(
    '\nNota: ocorrências em arquivos antigos são esperadas; novas migrations não devem reintroduzir políticas permissivas sem DROP/compensação explícita.'
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
