import OpenAI from 'openai';
import type { Message } from '@prisma/client';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Safety filter
const FORBIDDEN_TOPICS = [
  'illegal activity', 'harm', 'violence', 'discrimination', 'hate speech',
  'fraud', 'scam', 'spam', 'phishing',
];

function safetyCheck(text: string): { safe: boolean; reason?: string } {
  const lower = text.toLowerCase();
  for (const topic of FORBIDDEN_TOPICS) {
    if (lower.includes(topic)) {
      return { safe: false, reason: `Content flagged: ${topic}` };
    }
  }
  return { safe: true };
}

interface DraftResult {
  text: string;
  confidence: number;
  tokensUsed: number;
}

export async function draftReply(opts: {
  messages: Message[];
  tone: string;
  context?: string;
}): Promise<DraftResult> {
  const history = opts.messages.map((m) => `${m.senderType}: ${m.content}`).join('\n');

  const systemPrompt = `You are a professional WhatsApp business assistant. Draft a concise, helpful reply in a ${opts.tone} tone. Be warm but efficient. Keep it under 3 sentences unless necessary. ${opts.context ? 'Context: ' + opts.context : ''}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Conversation history:\n${history}\n\nDraft a reply as the business agent.` },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  const text = response.choices[0].message.content?.trim() || '';
  const safety = safetyCheck(text);
  if (!safety.safe) {
    return { text: '[AI Safety Filter] This content could not be generated.', confidence: 0, tokensUsed: response.usage?.total_tokens || 0 };
  }

  return {
    text,
    confidence: response.choices[0].finish_reason === 'stop' ? 0.9 : 0.5,
    tokensUsed: response.usage?.total_tokens || 0,
  };
}

export async function summarizeConversation(messages: Message[]): Promise<{
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}> {
  const history = messages.map((m) => `${m.senderType}: ${m.content}`).join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Summarize this WhatsApp conversation in 2-3 sentences. Extract 3 key points. Classify sentiment as positive, neutral, or negative. Return ONLY valid JSON with keys: summary, keyPoints (array), sentiment.',
      },
      { role: 'user', content: history },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
    max_tokens: 500,
  });

  const text = response.choices[0].message.content || '{}';
  try {
    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary || 'No summary available.',
      keyPoints: parsed.keyPoints || [],
      sentiment: parsed.sentiment || 'neutral',
    };
  } catch {
    return { summary: text.slice(0, 200), keyPoints: [], sentiment: 'neutral' };
  }
}

export async function extractLeadInfo(messages: Message[]): Promise<{
  name?: string;
  email?: string;
  company?: string;
  interest?: string;
  budget?: string;
  urgency?: string;
  nextStep?: string;
}> {
  const history = messages.map((m) => `${m.senderType}: ${m.content}`).join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Extract lead information from this WhatsApp conversation. Return ONLY valid JSON with keys: name, email, company, interest, budget, urgency, nextStep. Use null if not found.',
      },
      { role: 'user', content: history },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
    max_tokens: 400,
  });

  const text = response.choices[0].message.content || '{}';
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export async function generateFollowUp(messages: Message[]): Promise<DraftResult> {
  const history = messages.map((m) => `${m.senderType}: ${m.content}`).join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Generate a polite follow-up message for a WhatsApp business conversation. The customer has not replied. Keep it short, friendly, and include a clear next step or question.',
      },
      { role: 'user', content: `Conversation:\n${history}\n\nGenerate a follow-up message.` },
    ],
    temperature: 0.7,
    max_tokens: 250,
  });

  const text = response.choices[0].message.content?.trim() || '';
  const safety = safetyCheck(text);
  if (!safety.safe) {
    return { text: '[AI Safety Filter] Could not generate follow-up.', confidence: 0, tokensUsed: response.usage?.total_tokens || 0 };
  }

  return {
    text,
    confidence: 0.85,
    tokensUsed: response.usage?.total_tokens || 0,
  };
}

export async function analyzeSentiment(text: string): Promise<{ score: number; label: string }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Analyze the sentiment of this message. Return ONLY valid JSON with keys: score (-1 to 1), label (positive, neutral, negative, angry).',
      },
      { role: 'user', content: text },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
    max_tokens: 100,
  });

  try {
    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    return { score: parsed.score || 0, label: parsed.label || 'neutral' };
  } catch {
    return { score: 0, label: 'neutral' };
  }
}

export async function detectRevenueOpportunity(text: string): Promise<{
  isOpportunity: boolean;
  type?: string;
  confidence: number;
}> {
  const lower = text.toLowerCase();
  const keywords = ['price', 'quote', 'cost', 'how much', 'invoice', 'payment', 'buy', 'order', 'discount', 'deal', 'proposal', 'interested in', 'send me'];
  const matched = keywords.filter((k) => lower.includes(k));

  if (matched.length >= 2) {
    return { isOpportunity: true, type: 'buying_intent', confidence: 0.8 };
  }
  if (matched.length === 1) {
    return { isOpportunity: true, type: 'pricing_question', confidence: 0.6 };
  }
  return { isOpportunity: false, confidence: 0.3 };
}

export async function detectSupportRisk(text: string): Promise<{
  isRisk: boolean;
  type?: string;
  confidence: number;
}> {
  const lower = text.toLowerCase();
  const angry = ['angry', 'frustrated', 'terrible', 'worst', 'unacceptable', 'ridiculous', 'refund', 'complaint', 'broken', 'not working', 'scam'];
  const urgent = ['urgent', 'asap', 'immediately', 'emergency', 'critical'];

  const angryMatched = angry.filter((k) => lower.includes(k));
  const urgentMatched = urgent.filter((k) => lower.includes(k));

  if (angryMatched.length >= 2 || (angryMatched.length >= 1 && urgentMatched.length >= 1)) {
    return { isRisk: true, type: 'angry_customer', confidence: 0.85 };
  }
  if (urgentMatched.length >= 1) {
    return { isRisk: true, type: 'urgent_request', confidence: 0.7 };
  }
  return { isRisk: false, confidence: 0.2 };
}
