/**
 * Encodes analysis result as a base64 URL parameter for sharing
 */
export function encodeShareableReport(articleText, analysisResult) {
  try {
    const payload = {
      article: articleText.slice(0, 2000), // limit size
      analysis: analysisResult,
      ts: Date.now(),
    };
    const json = JSON.stringify(payload);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    return `${window.location.origin}${window.location.pathname}?report=${encoded}`;
  } catch (e) {
    console.error('Failed to encode report:', e);
    return null;
  }
}

/**
 * Decodes a shareable report from URL params
 */
export function decodeShareableReport() {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('report');
    if (!encoded) return null;
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to decode report:', e);
    return null;
  }
}

/**
 * Formats analysis result as plain text for copying
 */
export function formatResultAsText(articleText, analysis) {
  if (!analysis) return '';

  const lines = [
    `FACTORA ANALYSIS REPORT`,
    `Generated: ${new Date().toLocaleString()}`,
    `${'='.repeat(50)}`,
    ``,
    `CREDIBILITY SCORE: ${analysis.credibilityScore}/100`,
    `BIAS: ${analysis.biasDirection}`,
    `TONE: ${analysis.tone}`,
    `READING LEVEL: ${analysis.readingLevel}`,
    ``,
    `SIGNALS:`,
    `• Emotional Language Instances: ${analysis.signals?.emotionalLanguageCount ?? 0}`,
    `• Unsourced Claims: ${analysis.signals?.unsourcedClaimsCount ?? 0}`,
    `• Absolute Statements: ${analysis.signals?.absoluteStatementsCount ?? 0}`,
    ``,
    `MISSING CONTEXT:`,
    ...(analysis.missingContext || []).map((c, i) => `${i + 1}. ${c}`),
    ``,
    `KEY CLAIMS:`,
    ...(analysis.claims || []).map(c => `• ${c.text} [${c.verifiability} / ${c.confidence}]`),
    ``,
    `${'='.repeat(50)}`,
    `Analyzed by Factora — factora.app`,
  ];

  return lines.join('\n');
}
