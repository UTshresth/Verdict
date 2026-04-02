// Groq AI Integration — 3 keys, 3 roles
// Key 1 (JUDGE): Validates rooms + delivers final verdict
// Key 2 & 3 (MODERATORS): Load-balanced message moderation

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// Round-robin counter for load balancing moderator keys
let modKeyIndex = 0;

function getModeratorKey(): string {
  const keys = [process.env.GROQ_KEY_MOD_1!, process.env.GROQ_KEY_MOD_2!];
  const key = keys[modKeyIndex % keys.length];
  modKeyIndex++;
  return key;
}

function getJudgeKey(): string {
  return process.env.GROQ_KEY_JUDGE!;
}

async function callGroq(apiKey: string, messages: { role: string; content: string }[], temperature = 0.3): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Groq API error:', err);
    throw new Error('AI service unavailable');
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ═══════════════════════════════════════════════
// 1. ROOM VALIDATION (Pre-creation gatekeeper)
// ═══════════════════════════════════════════════
export async function validateRoom(topic: string, sideA: string, sideB: string): Promise<{ valid: boolean; reason: string }> {
  const prompt = `You are a debate room validator. Analyze if this is a legitimate, meaningful debate topic with two clearly opposing sides.

TOPIC: "${topic}"
SIDE A: "${sideA}"
SIDE B: "${sideB}"

Rules for validity:
1. The topic must be a debatable subject (not nonsensical, random characters, or offensive)
2. Both sides must present coherent opposing viewpoints
3. No hate speech, slurs, or calls to violence
4. The two sides must actually be opposing (not the same argument rephrased)
5. It should be a real topic that people could meaningfully debate

Respond in EXACTLY this JSON format, nothing else:
{"valid": true, "reason": "Brief explanation"}
or
{"valid": false, "reason": "Why it was rejected"}`;

  try {
    const response = await callGroq(getJudgeKey(), [
      { role: 'system', content: 'You are a strict debate validator. Respond ONLY with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Room validation error:', e);
    // Fail-open: if AI is down, allow room creation
    return { valid: true, reason: 'AI validation unavailable, approved by default.' };
  }
}

// ═══════════════════════════════════════════════
// 2. MESSAGE MODERATION (Load-balanced)
// ═══════════════════════════════════════════════
export async function moderateMessage(
  message: string,
  topic: string,
  sideA: string,
  sideB: string,
  userSide: string
): Promise<{ approved: boolean; reason: string }> {
  const prompt = `You are a debate moderator AI. Check if this message is valid for the ongoing debate.

DEBATE TOPIC: "${topic}"
SIDE A: "${sideA}"
SIDE B: "${sideB}"
USER IS ON: Side ${userSide}
MESSAGE: "${message}"

Check ALL of these:
1. Is the message on-topic (related to the debate subject)?
2. Is it free of personal attacks, slurs, hate speech, or profanity?
3. If it states facts, are they not blatantly false misinformation?
4. Is it a genuine argument/counterpoint, not spam or gibberish?

Respond in EXACTLY this JSON format:
{"approved": true, "reason": "Brief note"}
or
{"approved": false, "reason": "Why it was rejected — be specific and concise"}`;

  try {
    const response = await callGroq(getModeratorKey(), [
      { role: 'system', content: 'You are a strict but fair debate moderator. Respond ONLY with valid JSON.' },
      { role: 'user', content: prompt }
    ], 0.1);

    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Message moderation error:', e);
    // Fail-open: if AI is down, allow the message
    return { approved: true, reason: 'Moderation unavailable, approved by default.' };
  }
}

// ═══════════════════════════════════════════════
// 3. FINAL VERDICT (AI Judge)
// ═══════════════════════════════════════════════
const JUDGE_PERSONALITIES: Record<string, string> = {
  ANALYST: `You are "The Analyst" — a cold, data-driven judge. Base your verdict strictly on logic, evidence quality, and argument structure. Emotions mean nothing. Only rational arguments count.`,
  MONK: `You are "The Monk" — a calm, ethical, and balanced judge. You weigh both sides with compassion, looking for wisdom, empathy, and moral reasoning. You value understanding over aggression.`,
  ROASTER: `You are "The Roaster" — a brutal, witty judge with razor-sharp commentary. You call out weak arguments with savage humor. Your verdict is entertaining but fair. Don't hold back.`,
  DEVILS_ADVOCATE: `You are "The Judgeman" — a skeptic who questions EVERYTHING. You poke holes in both sides ruthlessly. Neither side impresses you easily. Only the most airtight argument wins your approval.`,
};

export async function deliverVerdict(
  topic: string,
  sideA: string,
  sideB: string,
  judgeMode: string,
  messages: { sender: string; side: string; text: string }[]
): Promise<{ winner: 'A' | 'B'; verdict: string }> {
  const personality = JUDGE_PERSONALITIES[judgeMode] || JUDGE_PERSONALITIES.ANALYST;

  const messageLog = messages
    .filter(m => m.side === 'A' || m.side === 'B')
    .map(m => `[Side ${m.side} — ${m.sender}]: ${m.text}`)
    .join('\n');

  const prompt = `${personality}

DEBATE TOPIC: "${topic}"
SIDE A argues: "${sideA}"
SIDE B argues: "${sideB}"

═══ FULL ARGUMENT TRANSCRIPT ═══
${messageLog || '(No arguments were submitted)'}
═══ END TRANSCRIPT ═══

IMPORTANT: You MUST pick a winner. Draws are NOT allowed. Even if both sides are close, use your judgement, logic, and the strength of arguments to decide who wins. If no arguments were submitted, judge purely on which POSITION is stronger logically.

Consider: argument quality, evidence, logic, persuasiveness, and factual accuracy.

Respond in EXACTLY this JSON format (NO other text):
{"winner": "A", "verdict": "Your detailed verdict explaining why this side won (2-4 sentences, in character)"}
or
{"winner": "B", "verdict": "..."}`;

  try {
    const response = await callGroq(getJudgeKey(), [
      { role: 'system', content: personality + ' You MUST always pick a winner. DRAW is never an option.' },
      { role: 'user', content: prompt }
    ], 0.7);

    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);
    // Force no draws
    if (result.winner !== 'A' && result.winner !== 'B') {
      result.winner = 'A'; // Default to A if AI somehow returns something else
    }
    return result;
  } catch (e) {
    console.error('Verdict delivery error:', e);
    return { winner: 'A', verdict: 'The AI Judge encountered an error but ruled in favor of Side A by default.' };
  }
}

