import fs from 'fs';
import path from 'path';

const distPath = path.join(process.cwd(), 'dist');

console.log('🔍 Executando verificação de integridade no diretório dist...');

if (!fs.existsSync(distPath)) {
  console.error('❌ Erro: Diretório dist não existe!');
  process.exit(1);
}

const requiredFiles = [
  'index.html',
  'server.cjs',
  'manifest.json',
  'logo_dm.svg'
];

let hasErrors = false;

requiredFiles.forEach(file => {
  const filePath = path.join(distPath, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Erro: Arquivo obrigatório ausente: dist/${file}`);
    hasErrors = true;
  } else {
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      console.error(`❌ Erro: Arquivo dist/${file} está vazio (0 bytes)`);
      hasErrors = true;
    } else {
      console.log(`✅ dist/${file} existe e está íntegro (${stats.size} bytes)`);
    }
  }
});

// Verifica se há arquivos de bundle JS e CSS compilados
const files = fs.readdirSync(distPath);
const hasJs = files.some(file => file.endsWith('.js') && !['service-worker.js', 'sw.js', 'firebase-messaging-sw.js'].includes(file));
const hasCss = files.some(file => file.endsWith('.css'));

if (!hasJs) {
  console.error('❌ Erro: Nenhum arquivo JavaScript de bundle do React encontrado em dist!');
  hasErrors = true;
} else {
  console.log('✅ Bundle JavaScript encontrado no diretório dist.');
}

if (!hasCss) {
  console.error('❌ Erro: Nenhum arquivo CSS encontrado em dist!');
  hasErrors = true;
} else {
  console.log('✅ Bundle CSS encontrado no diretório dist.');
}

if (hasErrors) {
  console.error('🛑 Falha na verificação de integridade do diretório dist!');
  process.exit(1);
} else {
  console.log('🎉 Verificação de integridade do diretório dist concluída com sucesso!');
  process.exit(0);
}
