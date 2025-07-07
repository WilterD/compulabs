/**
 * Función para decodificar caracteres Unicode mal codificados
 * Convierte caracteres como "InformÃ¡tica" a "Informática"
 */
export function decodeUnicode(text: string): string {
  if (!text) return text;
  
  try {
    // Intentar decodificar usando decodeURIComponent y escape
    return decodeURIComponent(escape(text));
  } catch (error) {
    // Si falla, devolver el texto original
    console.warn('Error decodificando texto Unicode:', error);
    return text;
  }
}

/**
 * Función para limpiar y decodificar texto que puede venir mal codificado
 */
export function cleanText(text: string): string {
  if (!text) return text;
  
  // Primero intentar decodificar Unicode
  const decoded = decodeUnicode(text);
  
  // Si el texto decodificado es diferente, usarlo
  if (decoded !== text) {
    return decoded;
  }
  
  // Si no hay cambios, devolver el original
  return text;
} 