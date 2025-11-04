import pdf from 'pdf-parse';
import { parseBasicPDF, extractReadableText } from './pdf-fallback';

export interface PDFParseResult {
  text: string;
  numPages: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

export interface PDFParseOptions {
  maxPages?: number;
  cleanText?: boolean;
  preserveFormatting?: boolean;
}

/**
 * Parse PDF buffer and extract text content
 */
export async function parsePDF(
  buffer: Buffer, 
  options: PDFParseOptions = {}
): Promise<PDFParseResult> {
  try {
    // Try parsing with different configurations
    let data;
    
    try {
      // First attempt: Standard parsing
      data = await pdf(buffer, {
        max: options.maxPages || 50,
        version: 'v1.10.100' // Use specific version for compatibility
      });
    } catch (firstError) {
      console.log('First parsing attempt failed, trying alternative method...');
      
      try {
        // Second attempt: More permissive parsing
        data = await pdf(buffer, {
          max: options.maxPages || 50
        });
      } catch (secondError) {
        console.log('Second parsing attempt failed, trying basic extraction...');
        
        // Third attempt: Basic extraction only
        data = await pdf(buffer, {
          max: Math.min(options.maxPages || 50, 10), // Limit to 10 pages for problematic PDFs
          pagerender: undefined // Disable page rendering
        });
      }
    }

    let extractedText = data.text || '';

    // If no text found, throw specific error
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content found in PDF. This may be an image-based or encrypted PDF.');
    }

    // Clean and process text if requested
    if (options.cleanText !== false) {
      extractedText = cleanPDFText(extractedText, options.preserveFormatting);
    }

    return {
      text: extractedText,
      numPages: data.numpages || 0,
      metadata: {
        title: data.info?.Title || undefined,
        author: data.info?.Author || undefined,
        subject: data.info?.Subject || undefined,
        keywords: data.info?.Keywords || undefined,
        creator: data.info?.Creator || undefined,
        producer: data.info?.Producer || undefined,
        creationDate: data.info?.CreationDate || undefined,
        modificationDate: data.info?.ModDate || undefined,
      }
    };
  } catch (error) {
    console.error('PDF parsing with pdf-parse failed, trying fallback methods...', error);
    
    // Try fallback parsing methods
    try {
      // First fallback: Basic PDF structure parsing
      const basicResult = parseBasicPDF(buffer);
      if (basicResult.success && basicResult.text.length > 50) {
        console.log('Successfully parsed PDF using basic method');
        return {
          text: basicResult.text,
          numPages: 1, // Can't determine page count with basic method
          metadata: {
            // No metadata available with fallback method
          }
        };
      }

      // Second fallback: Readable text extraction
      const readableResult = extractReadableText(buffer);
      if (readableResult.success && readableResult.text.length > 50) {
        console.log('Successfully parsed PDF using readable text extraction');
        return {
          text: readableResult.text,
          numPages: 1, // Can't determine page count with basic method
          metadata: {
            // No metadata available with fallback method
          }
        };
      }

      // If fallbacks also failed, provide specific error messages
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('pattern') || errorMessage.includes('expected')) {
          throw new Error('PDF format not supported. This may be a newer PDF version or have special encoding.');
        }
        
        if (errorMessage.includes('encrypted') || errorMessage.includes('password')) {
          throw new Error('This PDF is password-protected or encrypted.');
        }
        
        if (errorMessage.includes('no text') || errorMessage.includes('image-based')) {
          throw new Error('No readable text found. This appears to be an image-based PDF.');
        }
      }
      
      throw new Error('Could not extract text from PDF using any available method.');
      
    } catch (fallbackError) {
      console.error('All PDF parsing methods failed:', fallbackError);
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Clean and format extracted PDF text
 */
function cleanPDFText(text: string, preserveFormatting = false): string {
  if (!text) return '';

  let cleaned = text;

  // Remove excessive whitespace and normalize line breaks
  cleaned = cleaned.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\r/g, '\n');
  
  if (!preserveFormatting) {
    // Remove excessive line breaks (more than 2 consecutive)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Remove excessive spaces
    cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
    
    // Fix common PDF extraction issues
    cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between camelCase
    cleaned = cleaned.replace(/(\.)([A-Z])/g, '$1 $2'); // Add space after periods
    cleaned = cleaned.replace(/([a-z])(\d)/g, '$1 $2'); // Add space between letters and numbers
    cleaned = cleaned.replace(/(\d)([a-z])/g, '$1 $2'); // Add space between numbers and letters
  }

  // Remove page numbers and headers/footers (basic patterns)
  const lines = cleaned.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    
    // Skip likely page numbers (single numbers on their own line)
    if (/^\d+$/.test(trimmed)) return false;
    
    // Skip very short lines that might be headers/footers
    if (trimmed.length < 3) return false;
    
    // Skip lines that are all caps and short (likely headers)
    if (trimmed.length < 50 && trimmed === trimmed.toUpperCase() && /^[A-Z\s]+$/.test(trimmed)) return false;
    
    return true;
  });

  cleaned = filteredLines.join('\n');

  // Final cleanup
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Extract key information from PDF content for better processing
 */
export function extractPDFSummary(parseResult: PDFParseResult): {
  wordCount: number;
  estimatedReadingTime: number; // minutes
  hasStructure: boolean;
  contentType: 'article' | 'presentation' | 'document' | 'unknown';
  keyPhrases: string[];
} {
  const { text } = parseResult;
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const estimatedReadingTime = Math.ceil(wordCount / 200); // 200 words per minute average

  // Detect content structure
  const hasHeaders = /^[A-Z][A-Z\s]{5,}$/m.test(text);
  const hasBullets = /^[\u2022\u25E6\u25AA\u25AB\u25B8\u25B9\u25BA\u25BB-]\s/m.test(text);
  const hasNumberedList = /^\d+\.\s/m.test(text);
  const hasStructure = hasHeaders || hasBullets || hasNumberedList;

  // Guess content type based on patterns
  let contentType: 'article' | 'presentation' | 'document' | 'unknown' = 'unknown';
  
  if (hasBullets || /slide|presentation|agenda/i.test(text)) {
    contentType = 'presentation';
  } else if (hasHeaders && wordCount > 500) {
    contentType = 'article';
  } else if (wordCount > 100) {
    contentType = 'document';
  }

  // Extract key phrases (simple approach - could be enhanced with NLP)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const keyPhrases = sentences
    .slice(0, 10) // Take first 10 sentences
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 100);

  return {
    wordCount,
    estimatedReadingTime,
    hasStructure,
    contentType,
    keyPhrases: keyPhrases.slice(0, 5) // Top 5 key phrases
  };
}

/**
 * Validate PDF file before processing
 */
export function validatePDFBuffer(buffer: Buffer): { valid: boolean; error?: string } {
  // Check if buffer starts with PDF header
  const pdfHeader = buffer.slice(0, 4).toString();
  if (pdfHeader !== '%PDF') {
    return { valid: false, error: 'Invalid PDF file format' };
  }

  // Check file size (limit to 10MB for performance)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (buffer.length > maxSize) {
    return { valid: false, error: 'PDF file too large (max 10MB)' };
  }

  // Check minimum size
  if (buffer.length < 100) {
    return { valid: false, error: 'PDF file appears to be empty or corrupted' };
  }

  return { valid: true };
}