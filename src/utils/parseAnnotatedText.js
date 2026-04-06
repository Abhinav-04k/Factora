/**
 * Parses annotated text with [EMOTIONAL], [UNSOURCED], [ABSOLUTE] tags
 * Returns an array of segments: { type: 'text'|'emotional'|'unsourced'|'absolute', content: string }
 */
export function parseAnnotatedText(annotatedText) {
  if (!annotatedText) return [];

  const segments = [];
  // Match all tag patterns
  const regex = /\[(EMOTIONAL|UNSOURCED|ABSOLUTE)\](.*?)\[\/\1\]/gs;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(annotatedText)) !== null) {
    // Add plain text before this tag
    if (match.index > lastIndex) {
      const plainText = annotatedText.slice(lastIndex, match.index);
      if (plainText) {
        segments.push({ type: 'text', content: plainText });
      }
    }

    // Add the tagged segment
    const tagType = match[1].toLowerCase(); // 'emotional', 'unsourced', 'absolute'
    segments.push({ type: tagType, content: match[2] });

    lastIndex = regex.lastIndex;
  }

  // Add remaining plain text
  if (lastIndex < annotatedText.length) {
    const remaining = annotatedText.slice(lastIndex);
    if (remaining) {
      segments.push({ type: 'text', content: remaining });
    }
  }

  return segments;
}

export const TOOLTIP_DESCRIPTIONS = {
  emotional: 'Emotionally loaded language — designed to trigger a strong reaction rather than inform.',
  unsourced: 'Unsourced claim — no attribution or verifiable source is provided for this statement.',
  absolute: 'Absolute statement — uses words like "always", "never", or "everyone" without evidence.',
};
