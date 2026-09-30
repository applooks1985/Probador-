// POST: inicia el probador con IA (Replicate). GET ?id=...: consulta el estado.
const API = 'https://api.replicate.com/v1';
const H = () => ({ Authorization: 'Bearer ' + process.env.REPLICATE_API_TOKEN, 'Content-Type': 'application/json' });
async function toData(u) {
  if (u.startsWith('data:')) return u;
  const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error('No pude descargar la imagen de la prenda');
  const t = (r.headers.get('content-type') || 'image/jpeg').split(';')[0];
  return 'data:' + t + ';base64,' + Buffer.from(await r.arrayBuffer()).toString('base64');
}
module.exports = async (req, res) => {
  try {
    if (!process.env.REPLICATE_API_TOKEN) throw new Error('Falta REPLICATE_API_TOKEN en Vercel');
    if (req.method === 'GET') {
      const j = await (await fetch(API + '/predictions/' + encodeURIComponent(req.query.id), { headers: H() })).json();
      return res.json({ status: j.status, output: j.output, error: j.error });
    }
    const { person, garment, name, category } = req.body || {};
    if (!person || !garment) throw new Error('Falta la foto o la imagen de la prenda');
    const m = await (await fetch(API + '/models/cuuupid/idm-vton', { headers: H() })).json();
    const version = m.latest_version && m.latest_version.id;
    if (!version) throw new Error(m.detail || 'Modelo no disponible');
    const r = await fetch(API + '/predictions', { method: 'POST', headers: H(), body: JSON.stringify({
      version, input: { human_img: person, garm_img: await toData(garment), garment_des: name || 'garment',
        category: category || 'upper_body', crop: false, steps: 30 } }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.detail || 'Error de Replicate');
    res.json({ id: j.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
