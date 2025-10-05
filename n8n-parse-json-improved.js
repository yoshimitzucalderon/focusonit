// Nodo de código mejorado para n8n - Parse JSON Response
// Copia este código en el nodo "Code" después de DeepSeek

const response = $input.first().json;

// Intentar obtener el texto de diferentes posibles campos
let aiResponse = response.text || response.message || response.choices?.[0]?.message?.content || JSON.stringify(response);

console.log('🤖 Respuesta completa de AI:', aiResponse);

try {
  // Limpiar posibles bloques de markdown
  aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  // Buscar el objeto JSON en la respuesta
  const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('No se encontró objeto JSON en la respuesta');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  console.log('✅ JSON parseado correctamente:', parsed);

  // Validar y limpiar los datos
  const result = {
    title: (parsed.title || 'Nueva tarea').substring(0, 100).trim(),
    description: parsed.description || null,
    dueDate: parsed.dueDate || null,
    priority: ['low', 'medium', 'high'].includes(parsed.priority) ? parsed.priority : 'medium',
    tags: Array.isArray(parsed.tags) ? parsed.tags : []
  };

  console.log('📦 Resultado final:', result);

  return { json: result };

} catch (error) {
  console.error('❌ Error al parsear JSON:', error.message);
  console.error('📄 Respuesta que causó el error:', aiResponse);

  // Fallback: usar el transcript original
  const transcript = $input.all()[0].json.body?.transcript || 'Nueva tarea';

  return {
    json: {
      title: transcript.substring(0, 100),
      description: null,
      dueDate: null,
      priority: 'medium',
      tags: []
    }
  };
}
