#!/usr/bin/env node

/**
 * Script interactivo para agregar una nueva leccion aprendida
 *
 * Uso:
 *   node scripts/add-lesson.js
 *
 * Funcionalidad:
 * - Solicita informacion basica de la leccion via prompts
 * - Crea archivo en lessons-learned/by-date/ con nombre apropiado
 * - Actualiza automaticamente index.md
 * - Actualiza archivo de categoria correspondiente
 * - Valida formato y completitud basica
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuracion de paths
const LESSONS_DIR = path.join(__dirname, '..', 'lessons-learned');
const BY_DATE_DIR = path.join(LESSONS_DIR, 'by-date');
const BY_CATEGORY_DIR = path.join(LESSONS_DIR, 'by-category');
const INDEX_FILE = path.join(LESSONS_DIR, 'index.md');
const TEMPLATE_FILE = path.join(LESSONS_DIR, 'TEMPLATE.md');

// Categorias validas
const VALID_CATEGORIES = [
  'supabase',
  'google-calendar',
  'docker',
  'kong',
  'n8n',
  'nextjs',
  'typescript'
];

// Severidades validas
const VALID_SEVERITIES = ['baja', 'media', 'alta', 'critica'];

// Crear interfaz readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promesa wrapper para readline.question
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Formatear fecha a YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generar slug de titulo (titulo-con-guiones)
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
    .trim()
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-'); // Multiples guiones a uno
}

// Validar que directorios existen
function validateDirectories() {
  if (!fs.existsSync(LESSONS_DIR)) {
    console.error('Error: lessons-learned/ directory does not exist');
    process.exit(1);
  }
  if (!fs.existsSync(BY_DATE_DIR)) {
    console.error('Error: lessons-learned/by-date/ directory does not exist');
    process.exit(1);
  }
  if (!fs.existsSync(BY_CATEGORY_DIR)) {
    console.error('Error: lessons-learned/by-category/ directory does not exist');
    process.exit(1);
  }
  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error('Error: lessons-learned/TEMPLATE.md does not exist');
    process.exit(1);
  }
}

// Solicitar informacion de la leccion
async function promptLessonInfo() {
  console.log('\n=== Agregar Nueva Leccion Aprendida ===\n');

  // Titulo
  const title = await question('Titulo del problema: ');
  if (!title.trim()) {
    console.error('Error: El titulo no puede estar vacio');
    process.exit(1);
  }

  // Fecha (por defecto hoy)
  const defaultDate = formatDate(new Date());
  const dateInput = await question(`Fecha (YYYY-MM-DD) [${defaultDate}]: `);
  const date = dateInput.trim() || defaultDate;

  // Validar formato de fecha
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('Error: Formato de fecha invalido. Use YYYY-MM-DD');
    process.exit(1);
  }

  // Keywords
  const keywords = await question('Keywords (separados por coma): ');
  if (!keywords.trim()) {
    console.error('Error: Los keywords no pueden estar vacios');
    process.exit(1);
  }

  // Categoria
  console.log(`\nCategorias disponibles: ${VALID_CATEGORIES.join(', ')}`);
  const category = await question('Categoria principal: ');
  if (!VALID_CATEGORIES.includes(category.trim())) {
    console.error(`Error: Categoria invalida. Use una de: ${VALID_CATEGORIES.join(', ')}`);
    process.exit(1);
  }

  // Severidad
  console.log(`\nSeveridades disponibles: ${VALID_SEVERITIES.join(', ')}`);
  const severity = await question('Severidad: ');
  if (!VALID_SEVERITIES.includes(severity.trim())) {
    console.error(`Error: Severidad invalida. Use una de: ${VALID_SEVERITIES.join(', ')}`);
    process.exit(1);
  }

  // Tiempo de resolucion
  const resolutionTime = await question('Tiempo de resolucion (ej: 2 horas, 1 dia): ');

  // Resumen ejecutivo
  const summary = await question('Resumen ejecutivo (1-2 lineas): ');

  return {
    title: title.trim(),
    date: date.trim(),
    keywords: keywords.trim(),
    category: category.trim(),
    severity: severity.trim(),
    resolutionTime: resolutionTime.trim(),
    summary: summary.trim()
  };
}

// Crear archivo de leccion
function createLessonFile(lessonInfo) {
  const slug = slugify(lessonInfo.title);
  const filename = `${lessonInfo.date}-${slug}.md`;
  const filepath = path.join(BY_DATE_DIR, filename);

  // Verificar si ya existe
  if (fs.existsSync(filepath)) {
    console.error(`Error: El archivo ${filename} ya existe`);
    process.exit(1);
  }

  // Leer template
  let template = fs.readFileSync(TEMPLATE_FILE, 'utf8');

  // Reemplazar placeholders basicos
  template = template.replace('# [Titulo Descriptivo del Problema]', `# ${lessonInfo.title}`);
  template = template.replace('**Fecha:** YYYY-MM-DD', `**Fecha:** ${lessonInfo.date}`);
  template = template.replace('**Keywords:** keyword1, keyword2, keyword3, keyword4', `**Keywords:** ${lessonInfo.keywords}`);
  template = template.replace('**Categoria:** [supabase / google-calendar / docker / kong / n8n / nextjs / typescript]', `**Categoria:** ${lessonInfo.category}`);
  template = template.replace('**Severidad:** [baja / media / alta / critica]', `**Severidad:** ${lessonInfo.severity}`);
  template = template.replace('**Tiempo de Resolucion:** [X horas/dias]', `**Tiempo de Resolucion:** ${lessonInfo.resolutionTime}`);

  // Reemplazar resumen ejecutivo si fue provisto
  if (lessonInfo.summary) {
    template = template.replace(
      '[2-3 lineas resumiendo el problema y la solucion para lectura rapida]\n\nEjemplo: "Las tareas con fechas aparecian un dia antes debido a conversion automatica de timezone. Solucion: usar date-only strings sin timestamps."',
      lessonInfo.summary
    );
  }

  // Actualizar fecha de creacion al final
  template = template.replace('**Fecha de creacion:** YYYY-MM-DD', `**Fecha de creacion:** ${lessonInfo.date}`);
  template = template.replace('**Ultima actualizacion:** YYYY-MM-DD', `**Ultima actualizacion:** ${lessonInfo.date}`);

  // Escribir archivo
  fs.writeFileSync(filepath, template, 'utf8');

  return { filename, filepath };
}

// Actualizar index.md
function updateIndex(lessonInfo, filename) {
  let indexContent = fs.readFileSync(INDEX_FILE, 'utf8');

  // Encontrar la tabla y agregar nueva entrada al inicio (despues del header)
  const tableRegex = /(\| Fecha \| Titulo \| Keywords \| Severidad \| Tiempo Resolucion \|\n\|-------|--------|----------|-----------|-------------------\|)\n/;

  const newEntry = `| ${lessonInfo.date} | [${lessonInfo.title}](./by-date/${filename}) | ${lessonInfo.keywords} | ${lessonInfo.severity} | ${lessonInfo.resolutionTime} |\n`;

  // Reemplazar el placeholder si existe
  if (indexContent.includes('| - | *No hay lecciones documentadas aun* | - | - | - |')) {
    indexContent = indexContent.replace(
      '| - | *No hay lecciones documentadas aun* | - | - | - |',
      newEntry.trim()
    );
  } else {
    // Agregar al inicio de la tabla
    indexContent = indexContent.replace(tableRegex, `$1\n${newEntry}`);
  }

  // Actualizar fecha de ultima actualizacion
  const today = formatDate(new Date());
  indexContent = indexContent.replace(
    /\*\*Ultima actualizacion:\*\* \d{4}-\d{2}-\d{2}/,
    `**Ultima actualizacion:** ${today}`
  );

  // Actualizar contador de lecciones (basico)
  const lessonCount = (indexContent.match(/\|\s*\d{4}-\d{2}-\d{2}\s*\|/g) || []).length;
  indexContent = indexContent.replace(
    /- \*\*Total de lecciones:\*\* \d+/,
    `- **Total de lecciones:** ${lessonCount}`
  );

  fs.writeFileSync(INDEX_FILE, indexContent, 'utf8');
}

// Actualizar archivo de categoria
function updateCategory(lessonInfo, filename) {
  const categoryFile = path.join(BY_CATEGORY_DIR, `${lessonInfo.category}.md`);

  if (!fs.existsSync(categoryFile)) {
    console.warn(`Advertencia: Archivo de categoria ${lessonInfo.category}.md no existe`);
    return;
  }

  let categoryContent = fs.readFileSync(categoryFile, 'utf8');

  // Crear entrada de resumen
  const categoryEntry = `\n### [${lessonInfo.title}](../by-date/${filename})

**Fecha:** ${lessonInfo.date}
**Severidad:** ${lessonInfo.severity}
**Keywords:** ${lessonInfo.keywords}

**Problema:** ${lessonInfo.summary}

**Solucion:** [Completar en el archivo de leccion]

**Aprendizaje clave:** [Completar en el archivo de leccion]

---\n`;

  // Agregar despues de "## Lecciones Documentadas"
  if (categoryContent.includes('_Aun no hay lecciones documentadas en esta categoria_')) {
    categoryContent = categoryContent.replace(
      '_Aun no hay lecciones documentadas en esta categoria_',
      categoryEntry
    );
  } else {
    // Agregar despues de "### Total: X"
    categoryContent = categoryContent.replace(
      /(### Total: \d+)\n/,
      `$1${categoryEntry}\n`
    );
  }

  // Actualizar contador
  const lessonCount = (categoryContent.match(/###\s*\[.*\]\(\.\.\/by-date\//g) || []).length;
  categoryContent = categoryContent.replace(
    /### Total: \d+/,
    `### Total: ${lessonCount}`
  );

  // Actualizar fecha de ultima actualizacion
  const today = formatDate(new Date());
  categoryContent = categoryContent.replace(
    /\*\*Ultima actualizacion:\*\* \d{4}-\d{2}-\d{2}/,
    `**Ultima actualizacion:** ${today}`
  );
  categoryContent = categoryContent.replace(
    /\*\*Lecciones documentadas:\*\* \d+/,
    `**Lecciones documentadas:** ${lessonCount}`
  );

  fs.writeFileSync(categoryFile, categoryContent, 'utf8');
}

// Main
async function main() {
  try {
    // Validar que estructura existe
    validateDirectories();

    // Solicitar informacion
    const lessonInfo = await promptLessonInfo();

    console.log('\n=== Creando Leccion ===\n');

    // Crear archivo de leccion
    const { filename, filepath } = createLessonFile(lessonInfo);
    console.log(`Creado: ${filepath}`);

    // Actualizar index.md
    updateIndex(lessonInfo, filename);
    console.log(`Actualizado: ${INDEX_FILE}`);

    // Actualizar archivo de categoria
    updateCategory(lessonInfo, filename);
    console.log(`Actualizado: ${BY_CATEGORY_DIR}/${lessonInfo.category}.md`);

    console.log('\n=== Exito ===\n');
    console.log(`Leccion creada en: lessons-learned/by-date/${filename}`);
    console.log('\nProximos pasos:');
    console.log('1. Abre el archivo y completa todas las secciones del template');
    console.log('2. Revisa index.md y by-category para verificar que se actualizaron correctamente');
    console.log('3. Haz commit:');
    console.log(`   git add lessons-learned/`);
    console.log(`   git commit -m "docs: add lesson learned - ${lessonInfo.title}"`);
    console.log('\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar
main();
