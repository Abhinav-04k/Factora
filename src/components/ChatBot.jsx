import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Sparkles, AlertCircle, Quote, BarChart2, Layers, X } from 'lucide-react';

export default function ChatBot({ analysis, articleText, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am Factora AI. I've analyzed this article and I'm ready to help you investigate further. What would you like to explore?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text, promptOverride = null) => {
    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const model = 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const masterSystemPrompt = `You are Factora AI, an advanced misinformation detection assistant.
Your job is to help users critically evaluate news articles and claims with clarity, neutrality, and evidence-based reasoning.
Rules:
- Be concise but insightful.
- Never be sensational or emotional.
- Always explain reasoning clearly.
- If uncertain, say so honestly.
- Avoid absolute claims unless verified.
- Prefer structured responses (bullet points when helpful).
Focus on:
- Detecting bias, emotional language, and missing context
- Evaluating credibility of claims
- Comparing perspectives when needed
Tone:
- Calm, analytical, and trustworthy
- Like a fact-checker, not a debater
Output style:
- Start with a clear conclusion
- Then give reasoning
- Then optionally give supporting evidence or sources`;

      // Use prompt override if provided (for context-injected buttons), otherwise use standard chat context
      const fullPrompt = promptOverride || `Context: The user is asking about an article they just analyzed.
Article Title (if any): ${analysis?.pageTitle || 'Unknown'}
Article Excerpt: ${articleText?.slice(0, 500)}...
Analysis Summary: Bias is ${analysis?.biasDirection}, Credibility is ${analysis?.credibilityScore}%.

User Message: ${text}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: masterSystemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to reach AI Assistant.');

      const data = await response.json();
      const botContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that request.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: botContent }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (type) => {
    if (loading) return;

    let prompt = '';
    let userDisplay = '';

    switch (type) {
      case 'explain':
        userDisplay = "Explain Score";
        const signals = `Emotional: ${analysis?.signals?.emotionalLanguageCount}, Unsourced: ${analysis?.signals?.unsourcedClaimsCount}, Absolute: ${analysis?.signals?.absoluteStatementsCount}`;
        prompt = `An article has been analyzed and given a credibility score.
Score: ${analysis?.credibilityScore}/100
Detected Issues:
${signals}
User question:
"Why is this score low or what are the main issues?"
Explain in simple terms:
- What are the biggest problems in the article
- Refer to patterns like emotional language, lack of sources, or bias
- Keep it easy to understand (no technical jargon)
Keep it under 120 words.`;
        break;

      case 'verify':
        userDisplay = "Verify Claims";
        const claimsStr = analysis?.claims?.map(c => c.text).join('; ') || 'No claims detected.';
        prompt = `Analyze the main claims from the article for accuracy and credibility.
Claims:
"${claimsStr}"
Return your answer in this format:
Verdict: (True / Misleading / False / Unverified)
Explanation:
- Give 2–4 clear reasons
- Mention missing context if applicable
Confidence:
- Low / Medium / High
If possible, suggest what additional information would help verify the claim.`;
        break;

      case 'tone':
        userDisplay = "Analyze Tone & Bias";
        const phrasesStr = analysis?.signals?.emotionalPhrases?.join(', ') || 'None';
        prompt = `Analyze the tone and bias of the article. We detected these emotional or loaded phrases: "${phrasesStr}" and a bias direction of "${analysis?.biasDirection}".
Identify if it heavily relies on:
- Emotional or loaded language
- Unsupported claims
- Bias or framing issues
Respond in this format:
Main Issue:
Explanation:
Why it matters:`;
        break;

      case 'sides':
        userDisplay = "Two-Side View";
        const contextStr = analysis?.missingContext?.join('; ') || 'None';
        prompt = `Analyze the article's overall topic, taking into account its missing context: "${contextStr}" and its apparent bias: "${analysis?.biasDirection}".
Provide a balanced perspective:
Supporting View:
- Key arguments that support the article's narrative
Opposing View:
- Key arguments against the article's narrative or covering the missing context
Conclusion:
- Which side is better supported by evidence (if any)
- Mention uncertainty if present`;
        break;
    }

    if (prompt) {
      sendMessage(userDisplay, prompt);
    }
  };

  return (
    <div className="flex flex-col h-[600px] glass-card overflow-hidden animate-fade-in border-b-4 border-b-gold">
      {/* Header */}
      <div className="p-6 border-b border-navy-100 dark:border-navy-800 bg-white/50 dark:bg-navy-950/50 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gold/10 flex items-center justify-center text-gold shadow-sm">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black text-navy-900 dark:text-white uppercase tracking-tight">Factora AI Assistant</h3>
            <p className="text-[10px] text-navy-400 font-bold uppercase tracking-[2px]">Neural Chat Engine</p>
          </div>
        </div>
        {onClose && (
            <button onClick={onClose} className="p-2 rounded-full hover:bg-navy-50 dark:hover:bg-navy-900 text-navy-400 dark:text-navy-500 transition-colors">
                <X size={20} />
            </button>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin bg-slate-50/50 dark:bg-navy-950/20"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`max-w-[85%] rounded-[28px] p-5 shadow-sm border ${
              msg.role === 'user' 
                ? 'bg-navy-900 text-white border-navy-800 rounded-br-lg' 
                : 'glass-card bg-white dark:bg-navy-900 text-navy-800 dark:text-navy-100 border-navy-100 dark:border-navy-800 rounded-bl-lg'
            }`}>
              <p className="text-[15px] leading-loose whitespace-pre-wrap font-medium">
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="max-w-[85%] rounded-[28px] rounded-bl-lg p-5 glass-card dark:bg-navy-900 border-navy-100 dark:border-navy-800">
               <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '200ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '400ms' }} />
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 bg-white/30 dark:bg-navy-900/40 border-t border-navy-100 dark:border-navy-800">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleAction('explain')} disabled={loading} className="btn-chat-action">
            <BarChart2 size={12} /> Explain Score
          </button>
          <button onClick={() => handleAction('verify')} disabled={loading} className="btn-chat-action">
            <Quote size={12} /> Verify Claims
          </button>
          <button onClick={() => handleAction('tone')} disabled={loading} className="btn-chat-action">
            <AlertCircle size={12} /> Analyze Tone & Bias
          </button>
          <button onClick={() => handleAction('sides')} disabled={loading} className="btn-chat-action">
            <Layers size={12} /> Two-Side View
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="p-6 bg-white dark:bg-navy-950 border-t border-navy-100 dark:border-navy-900">
        <form 
          onSubmit={e => {
            e.preventDefault();
            if (input.trim() && !loading) {
              sendMessage(input);
              setInput('');
            }
          }}
          className="flex gap-4"
        >
          <input
            type="text"
            className="flex-1 bg-navy-50 dark:bg-navy-900 border border-navy-100 dark:border-navy-800 rounded-2xl px-6 py-4 text-sm text-navy-900 dark:text-white placeholder-navy-300 focus:outline-none focus:border-gold transition-colors"
            placeholder="Ask Factora AI anything about this article..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="w-14 h-14 rounded-2xl bg-navy-900 dark:bg-gold text-white dark:text-navy-950 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
