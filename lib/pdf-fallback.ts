/**
 * Fallback PDF parsing using a simpler approach
 * This is used when the main pdf-parse library fails
 */

export interface SimplePDFResult {
  text: string;
  success: boolean;
  method: string;
}

/**
 * Extract text from PDF buffer using basic PDF structure parsing
 */
export function parseBasicPDF(buffer: Buffer): SimplePDFResult {
  try {
    const pdfString = buffer.toString('latin1');
    
    // Check if it's a valid PDF
    if (!pdfString.startsWith('%PDF-')) {
      return {
        text: '',
        success: false,
        method: 'basic-validation-failed'
      };
    }

    // Extract text between stream objects (very basic approach)
    const textBlocks: string[] = [];
    
    // Look for BT (Begin Text) and ET (End Text) markers
    const btPattern = /BT\s*([\s\S]*?)\s*ET/g;
    const matches = pdfString.match(btPattern);
    
    if (matches) {
      for (const match of matches) {
        // Extract text from Tj operators
        const tjPattern = /\((.*?)\)\s*Tj/g;
        let tjMatch;
        while ((tjMatch = tjPattern.exec(match)) !== null) {
          if (tjMatch[1]) {
            textBlocks.push(tjMatch[1]);
          }
        }
        
        // Extract text from TJ operators (array format)
        const tjArrayPattern = /\[(.*?)\]\s*TJ/g;
        let tjArrayMatch;
        while ((tjArrayMatch = tjArrayPattern.exec(match)) !== null) {
          if (tjArrayMatch[1]) {
            // Parse the array and extract strings
            const arrayContent = tjArrayMatch[1];
            const stringPattern = /\((.*?)\)/g;
            let stringMatch;
            while ((stringMatch = stringPattern.exec(arrayContent)) !== null) {
              if (stringMatch[1]) {
                textBlocks.push(stringMatch[1]);
              }
            }
          }
        }
      }
    }

    // If no text found with BT/ET, try a broader search
    if (textBlocks.length === 0) {
      // Look for any text in parentheses followed by Tj
      const broadPattern = /\((.*?)\)\s*Tj/g;
      let broadMatch;
      while ((broadMatch = broadPattern.exec(pdfString)) !== null) {
        if (broadMatch[1] && broadMatch[1].trim().length > 0) {
          textBlocks.push(broadMatch[1]);
        }
      }
    }

    const extractedText = textBlocks
      .map(text => decodeURIComponent(text.replace(/\\(.)/g, '$1'))) // Basic unescape
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      text: extractedText,
      success: extractedText.length > 0,
      method: 'basic-text-extraction'
    };

  } catch (error) {
    console.error('Basic PDF parsing failed:', error);
    return {
      text: '',
      success: false,
      method: 'basic-error'
    };
  }
}

/**
 * Try to extract readable text using character frequency analysis
 */
export function extractReadableText(buffer: Buffer): SimplePDFResult {
  try {
    const text = buffer.toString('utf8');
    
    // Extract sequences that look like readable text
    const readableChunks: string[] = [];
    
    // Look for sequences of letters, spaces, and common punctuation
    const readablePattern = /[a-zA-Z][a-zA-Z\s.,!?;:'"()-]{10,}/g;
    const matches = text.match(readablePattern);
    
    if (matches) {
      for (const match of matches) {
        const cleaned = match.trim();
        if (cleaned.length > 15) { // Only keep longer sequences
          readableChunks.push(cleaned);
        }
      }
    }

    const extractedText = readableChunks
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      text: extractedText,
      success: extractedText.length > 50, // Need meaningful amount of text
      method: 'readable-text-extraction'
    };

  } catch (error) {
    console.error('Readable text extraction failed:', error);
    return {
      text: '',
      success: false,
      method: 'readable-error'
    };
  }
}