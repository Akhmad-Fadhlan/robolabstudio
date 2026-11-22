const KILO_COMPLETIONS = 'https://ai-gateway.kilo.ai/api/v1/chat/completions';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const authorization = req.headers.authorization;
  if (!/^Bearer [^\s]{1,4096}$/.test(authorization ?? '')) return res.status(401).json({ error: 'API key required' });

  const { model, messages, max_tokens } = req.body ?? {};
  if (
    typeof model !== 'string' || !model.trim() || model.length > 160 ||
    !Array.isArray(messages) || !messages.length || messages.length > 14 ||
    messages.some(message =>
      !message || !['system', 'user', 'assistant'].includes(message.role) ||
      typeof message.content !== 'string' || message.content.length > 12000
    ) ||
    !Number.isInteger(max_tokens) || max_tokens < 1 || max_tokens > 2300
  ) return res.status(400).json({ error: 'Invalid chat request' });

  try {
    const response = await fetch(KILO_COMPLETIONS, {
      method: 'POST',
      headers: { Authorization: authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: messages.map(({ role, content }) => ({ role, content })),
        max_tokens,
        stream: false,
      }),
      signal: AbortSignal.timeout(39000),
      redirect: 'error',
    });
    if (!response.ok) return res.status(response.status).json({ error: 'Provider error' });
    const data = await response.json();
    return res.status(200).json({ choices: [{ message: { content: data?.choices?.[0]?.message?.content ?? '' } }] });
  } catch {
    return res.status(502).json({ error: 'Provider unavailable' });
  }
}
