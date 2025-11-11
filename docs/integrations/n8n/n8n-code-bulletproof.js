// ═══════════════════════════════════════════════════════════════════
// 🛡️ NODO BULLET-PROOF: Parse JSON Response de OpenRouter/DeepSeek
// ═══════════════════════════════════════════════════════════════════
// Copia este código en el nodo "Code" después de OpenRouter

const response = $input.first().json;

// 📥 Intentar obtener el contenido de diferentes estructuras posibles
let aiResponse =
  response.choices?.[0]?.message?.content ||  // OpenRouter format
  response.text ||                             // Gemini format
  response.message ||                          // Otros formatos
  JSON.stringify(response);                    // Fallback

console.log('🤖 Respuesta RAW de AI:', aiResponse);

try {
  // 🧹 Limpiar bloques de markdown y espacios
  aiResponse = aiResponse
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .replace(/^[\s\n]+/, '')
    .replace(/[\s\n]+$/, '')
    .trim();

  console.log('🧹 Respuesta limpia:', aiResponse);

  // 🔍 Buscar el objeto JSON en la respuesta
  const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('❌ No se encontró objeto JSON válido en la respuesta');
  }

  // 📦 Parsear el JSON
  const parsed = JSON.parse(jsonMatch[0]);
  console.log('✅ JSON parseado exitosamente:', parsed);

  // 🛡️ Validar y sanitizar cada campo
  const title = typeof parsed.title === 'string' && parsed.title.trim()
    ? parsed.title.trim().substring(0, 100)
    : 'Nueva tarea';

  const description = typeof parsed.description === 'string' && parsed.description.trim()
    ? parsed.description.trim()
    : null;

  // 📅 Validar formato de fecha (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const dueDate = parsed.dueDate && dateRegex.test(parsed.dueDate)
    ? parsed.dueDate
    : null;

  // ⚡ Validar priority
  const validPriorities = ['low', 'medium', 'high'];
  const priority = validPriorities.includes(parsed.priority)
    ? parsed.priority
    : 'medium';

  // 🏷️ Validar y limpiar tags
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.filter(tag => typeof tag === 'string' && tag.trim()).map(tag => tag.trim())
    : [];

  // 🌐 Timestamp en hora del Pacífico (Los Angeles)
  const now = new Date();
  const pacificTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now);

  const pacificTimestamp = `${pacificTime.find(p => p.type === 'year').value}-${pacificTime.find(p => p.type === 'month').value}-${pacificTime.find(p => p.type === 'day').value}T${pacificTime.find(p => p.type === 'hour').value}:${pacificTime.find(p => p.type === 'minute').value}:${pacificTime.find(p => p.type === 'second').value}`;

  // 📦 Resultado final validado
  const result = {
    title,
    description,
    dueDate,
    priority,
    tags,
    createdAt: pacificTimestamp,
    source: 'voice'
  };

  console.log('📦 Resultado final validado:', result);
  return { json: result };

} catch (error) {
  // 🚨 FALLBACK: Error al parsear
  console.error('❌ ERROR al parsear JSON:', error.message);
  console.error('📄 Contenido que causó error:', aiResponse);

  // Intentar obtener el transcript original del webhook
  let transcript = 'Nueva tarea';
  try {
    const webhookData = $('Webhook').first().json.body;
    transcript = webhookData?.transcript || transcript;
  } catch (e) {
    console.error('⚠️ No se pudo recuperar transcript del webhook');
  }

  // Timestamp de fallback
  const now = new Date();
  const pacificTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now);

  const pacificTimestamp = `${pacificTime.find(p => p.type === 'year').value}-${pacificTime.find(p => p.type === 'month').value}-${pacificTime.find(p => p.type === 'day').value}T${pacificTime.find(p => p.type === 'hour').value}:${pacificTime.find(p => p.type === 'minute').value}:${pacificTime.find(p => p.type === 'second').value}`;

  return {
    json: {
      title: transcript.substring(0, 100),
      description: null,
      dueDate: null,
      priority: 'medium',
      tags: ['voice', 'error-parsing'],
      createdAt: pacificTimestamp,
      source: 'voice-fallback'
    }
  };
}
