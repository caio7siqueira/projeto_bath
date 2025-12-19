// Script de validação estática para checklist de QA
const fs = require('fs');
const path = require('path');

function walk(dir, ext, results = []) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) walk(full, ext, results);
    else if (full.endsWith(ext)) results.push(full);
  }
  return results;
}

// 1. Buscar "/pets" como endpoint raiz (proibido)
const backendFiles = walk(path.join(__dirname, '../../apps/api/src'), '.ts');
let foundPetsRoot = false;
for (const file of backendFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (/\bController\(['"]pets['"]\)/.test(content) || /@Controller\(['"]\/pets['"]\)/.test(content)) {
    foundPetsRoot = true;
    console.error(`ERRO: Endpoint raiz /pets encontrado em ${file}`);
  }
}
if (foundPetsRoot) process.exit(1);

// 2. Buscar router.push para rotas inexistentes
const frontendFiles = walk(path.join(__dirname, '../../apps/web/src'), '.tsx');
let foundBadPush = false;
for (const file of frontendFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/router\.push\(['"]([^'"]+)['"]\)/g);
  if (matches) {
    for (const m of matches) {
      const route = m.match(/router\.push\(['"]([^'"]+)['"]\)/)[1];
      if (!route.startsWith('/admin') && !route.startsWith('/superadmin') && !route.startsWith('/')) {
        foundBadPush = true;
        console.error(`ERRO: router.push para rota potencialmente inexistente (${route}) em ${file}`);
      }
    }
  }
}
if (foundBadPush) process.exit(1);

console.log('QA estático OK');
