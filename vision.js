// Lee una captura de pantalla de una prenda (nombre, marca, precio, tipo) con Claude Haiku en Replicate
module.exports = async (req, res) => {
  try {
    if (!process.env.REPLICATE_API_TOKEN) throw new Error('Falta REPLICATE_API_TOKEN en Vercel');
    const { image } = req.body || {};
    if (!image) throw new Error('Falta la captura');
    const r = await fetch('https://api.replicate.com/v1/models/anthropic/claude-4.5-haiku/predictions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.REPLICATE_API_TOKEN, 'Content-Type': 'application/json', Prefer: 'wait=5' },
      body: JSON.stringify({ input: {
        image, max_tokens: 300,
        system_prompt: 'Respondes SOLO con un objeto JSON válido, sin texto adicional ni comillas invertidas.',
        prompt: 'Esta es una captura de una tienda de ropa online. Devuelve: {"name":"tipo de prenda y color en español, p. ej. Camiseta roja","brand":"marca o tienda","price":número en euros o null,"category":"upper_body si es prenda de arriba, lower_body si es pantalón o falda, dresses si es vestido o mono"}'
      } })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.detail || 'Error de Replicate');
    res.json({ id: j.id, status: j.status, output: j.output, error: j.error });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
