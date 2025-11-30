export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Using the globally loaded pdfjsLib from the script tag in index.html
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // We join with space to maintain flow.
      // Filter out empty items to reduce noise.
      const pageText = textContent.items
        .map((item: any) => item.str)
        .filter((str: string) => str.trim().length > 0)
        .join(' ');
      
      // Add double newline to denote page boundaries (useful for structure)
      fullText += pageText + '\n\n';
    }

    return cleanText(fullText);
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF. Please ensure it is a valid PDF file.");
  }
};

const cleanText = (text: string): string => {
  let cleaned = text;

  // 1. Fix common PDF ligatures
  cleaned = cleaned
    .replace(/ﬁ/g, 'fi')
    .replace(/ﬂ/g, 'fl')
    .replace(/ﬃ/g, 'ffi')
    .replace(/ﬄ/g, 'ffl')
    .replace(/ﬅ/g, 'ft')
    .replace(/ﬆ/g, 'st');

  // 2. Fix hyphenation split across lines
  // Looks for word ending in hyphen, optional whitespace, then lowercase word
  // Example: "environ- ment" -> "environment"
  cleaned = cleaned.replace(/([a-zA-Z]+)-\s+([a-z]+)/g, '$1$2');

  // 3. Remove Page Numbers and common footer/header artifacts
  // Matches "Page 1 of 10", "1 / 45", "Page 5"
  cleaned = cleaned.replace(/\bPage\s+\d+\s+(?:of|\/)\s+\d+\b/gi, ' ');
  cleaned = cleaned.replace(/\bPage\s+\d+\b/gi, ' ');
  // Matches "12 of 45" or "12 / 45" often found in footers
  cleaned = cleaned.replace(/\b\d+\s+(?:of|\/)\s+\d+\b/gi, ' ');

  // 4. Clean Citation markers like [1], [12], [3-5]
  cleaned = cleaned.replace(/\[\d+(?:[-–,]\d+)*\]/g, '');

  // 5. Fix spacing around punctuation
  // Remove space before punctuation: "word ." -> "word."
  cleaned = cleaned.replace(/\s+([.,;:)])/g, '$1');

  // 6. Normalize Whitespace
  // Replace non-breaking spaces with normal spaces
  cleaned = cleaned.replace(/\u00A0/g, ' ');
  
  // Collapse multiple horizontal spaces/tabs into a single space
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  
  // Collapse 3+ newlines to 2 (standardize paragraph breaks)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
};