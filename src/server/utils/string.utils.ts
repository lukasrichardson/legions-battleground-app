export const renderNumberthSuffix = (number) => {
  if (!number) return "";
  const string = number.toString();
  const lastChar = string[string.length - 1];

  if (string === "11" || string === "12" || string === "13") {
    return "th";
  } else if (lastChar === "1") {
    return "st"
  } else if (lastChar === "2") {
    return "nd"
  } else if (lastChar === "3") {
    return "rd"
  } else {
    return "th"
  }
}

export const decodeHTMLEntities = (str: string): string => {
  if (!str) return str;
  
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