#!/usr/bin/env node

/**
 * Script de verificación para FocusOnIt
 * Verifica que todo esté configurado correctamente antes de ejecutar
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de FocusOnIt...\n');

let errors = 0;
let warnings = 0;

// 1. Verificar .env.local
console.log('📝 Verificando variables de entorno...');
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('   ❌ Archivo .env.local no encontrado');
  console.log('   → Copia .env.example a .env.local y configura tus credenciales\n');
  errors++;
} else {
  const envContent = fs.readFileSync(envPath, 'utf-8');

  if (envContent.includes('tu-supabase-url') || envContent.includes('tu-anon-key')) {
    console.log('   ⚠️  .env.local contiene valores de ejemplo');
    console.log('   → Reemplaza con tus credenciales reales de Supabase\n');
    warnings++;
  } else {
    console.log('   ✅ .env.local configurado\n');
  }
}

// 2. Verificar node_modules
console.log('📦 Verificando dependencias...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('   ❌ node_modules no encontrado');
  console.log('   → Ejecuta: npm install\n');
  errors++;
} else {
  // Verificar dependencias críticas
  const criticalDeps = [
    'next',
    'react',
    '@supabase/supabase-js',
    '@supabase/ssr',
    'date-fns',
    'react-hot-toast',
    'lucide-react'
  ];

  let missingDeps = [];
  criticalDeps.forEach(dep => {
    if (!fs.existsSync(path.join(nodeModulesPath, dep))) {
      missingDeps.push(dep);
    }
  });

  if (missingDeps.length > 0) {
    console.log('   ⚠️  Faltan dependencias:');
    missingDeps.forEach(dep => console.log(`      - ${dep}`));
    console.log('   → Ejecuta: npm install\n');
    warnings++;
  } else {
    console.log('   ✅ Todas las dependencias instaladas\n');
  }
}

// 3. Verificar estructura de archivos
console.log('📁 Verificando estructura del proyecto...');
const requiredFiles = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/(auth)/login/page.tsx',
  'app/(auth)/signup/page.tsx',
  'app/(dashboard)/today/page.tsx',
  'components/TaskInput.tsx',
  'components/TaskItem.tsx',
  'lib/supabase/client.ts',
  'lib/hooks/useTasks.ts',
  'middleware.ts',
  'setup.sql'
];

let missingFiles = [];
requiredFiles.forEach(file => {
  if (!fs.existsSync(path.join(__dirname, file))) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log('   ⚠️  Archivos faltantes:');
  missingFiles.forEach(file => console.log(`      - ${file}`));
  console.log('');
  warnings++;
} else {
  console.log('   ✅ Estructura completa\n');
}

// 4. Verificar TypeScript config
console.log('⚙️  Verificando TypeScript...');
if (!fs.existsSync(path.join(__dirname, 'tsconfig.json'))) {
  console.log('   ❌ tsconfig.json no encontrado\n');
  errors++;
} else {
  console.log('   ✅ TypeScript configurado\n');
}

// 5. Verificar Tailwind config
console.log('🎨 Verificando Tailwind CSS...');
if (!fs.existsSync(path.join(__dirname, 'tailwind.config.ts'))) {
  console.log('   ❌ tailwind.config.ts no encontrado\n');
  errors++;
} else {
  console.log('   ✅ Tailwind configurado\n');
}

// Resumen
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (errors === 0 && warnings === 0) {
  console.log('✅ ¡Todo listo! Puedes ejecutar: npm run dev');
  console.log('');
  console.log('📚 Próximos pasos:');
  console.log('   1. Ejecuta setup.sql en Supabase SQL Editor');
  console.log('   2. Ejecuta: npm run dev');
  console.log('   3. Abre: http://localhost:3000');
  console.log('   4. Crea tu cuenta en /signup');
  console.log('');
  process.exit(0);
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} error(es) encontrado(s)`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} advertencia(s)`);
  }
  console.log('');
  console.log('📖 Lee QUICKSTART.md para más ayuda');
  console.log('');
  process.exit(1);
}