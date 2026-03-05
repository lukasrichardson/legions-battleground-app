export const decodeHTMLEntities = (str: string): string => {
  if (!str) return str;
  
  // Create a temporary element to use browser's built-in HTML decoding
  if (typeof window !== 'undefined' && window.document) {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = str;
    return tempElement.textContent || tempElement.innerText || '';
  }
  
  // Fallback for server-side or when DOM is not available
  return str
    .replace(/&#8217;/g, "'")  // Right single quotation mark
    .replace(/&#8216;/g, "'")  // Left single quotation mark
    .replace(/&#8220;/g, '"') // Left double quotation mark
    .replace(/&#8221;/g, '"') // Right double quotation mark
    .replace(/&#8211;/g, '–')  // En dash
    .replace(/&#8212;/g, '—')  // Em dash
    .replace(/&#8230;/g, '…')  // Horizontal ellipsis
    .replace(/&amp;/g, '&')     // Ampersand
    .replace(/&lt;/g, '<')      // Less than
    .replace(/&gt;/g, '>')      // Greater than
    .replace(/&quot;/g, '"')   // Quotation mark
    .replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(dec);
    })
    .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
};