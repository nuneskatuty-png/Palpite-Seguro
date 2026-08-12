export default async function handler(req, res) {
  const { path } = req.query;
  if (!path) {
    res.status(400).json({ error: 'Missing path parameter' });
    return;
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'FOOTBALL_DATA_API_KEY not configured on the server' });
    return;
  }

  try {
    const apiRes = await fetch(`https://api.football-data.org/v4${path}`, {
      headers: { 'X-Auth-Token': apiKey },
    });
    const data = await apiRes.json();
    res.status(apiRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
