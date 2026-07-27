import { Logger } from '@nestjs/common';

export function recoverJson(text: string): string {
  let recovered = text.trim();
  if (recovered.endsWith(',')) {
    recovered = recovered.slice(0, -1);
  }

  const openBraces = (recovered.match(/\{/g) || []).length;
  let closeBraces = (recovered.match(/\}/g) || []).length;
  const openBrackets = (recovered.match(/\[/g) || []).length;
  let closeBrackets = (recovered.match(/\]/g) || []).length;

  while (openBraces > closeBraces) {
    recovered += '}';
    closeBraces++;
  }
  while (openBrackets > closeBrackets) {
    recovered += ']';
    closeBrackets++;
  }

  return recovered;
}

export function parseGeminiChunks(rawBuffer: string): string {
  const streamItems: unknown[] = JSON.parse(rawBuffer);
  let fullText = '';

  if (Array.isArray(streamItems)) {
    for (const item of streamItems) {
      const candidates = (item as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates;
      const text = candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) fullText += text;
    }
  }

  return fullText;
}

export function tryParseGeminiResponse(rawBuffer: string, lastExtractedText: string, logger: Logger): { success: true; data: unknown } | { success: false; error: Error } {
  try {
    const finalFullText = parseGeminiChunks(rawBuffer);
    const data: unknown = JSON.parse(finalFullText);
    return { success: true, data };
  } catch {
    logger.debug(`Malformed JSON sample: ${lastExtractedText.slice(-100)}`);

    try {
      const recovered = recoverJson(lastExtractedText);
      const data: unknown = JSON.parse(recovered);
      logger.log('Successfully recovered truncated AI response JSON');
      return { success: true, data };
    } catch (innerError) {
      return {
        success: false,
        error: new Error(
          'Failed to parse AI response as valid JSON even after recovery attempt',
        ),
      };
    }
  }
}
