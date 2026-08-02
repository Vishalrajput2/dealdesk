export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.NVIDIA_API_KEY;
  if (!key) return res.status(503).json({ error: "NVIDIA_API_KEY is not configured." });
  try {
    const { messages, model } = req.body || {};
    const allowed = new Set(["nvidia/nemotron-mini-4b-instruct", "nvidia/nemotron-3-nano-30b-a3b", "meta/llama-3.2-3b-instruct"]);
    const selectedModel = allowed.has(model) ? model : "nvidia/nemotron-mini-4b-instruct";
    const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: selectedModel, messages, temperature: 0.2, top_p: 0.7, max_tokens: 1200, stream: false }),
    });
    const data = await upstream.json();
    if (!upstream.ok) return res.status(502).json({ error: data?.error?.message || "NVIDIA request failed." });
    return res.status(200).json({ content: data.choices?.[0]?.message?.content || "No answer returned." });
  } catch (error) { return res.status(500).json({ error: "Assistant request failed." }); }
}
