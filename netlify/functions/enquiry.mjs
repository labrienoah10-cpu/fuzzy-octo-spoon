const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false }, 405);
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) return json({ ok: false }, 403);
  let d;
  try { d = await req.json(); } catch { return json({ ok: false }, 400); }
  const cut = (v, n) => String(v ?? '').trim().slice(0, n);
  const name = cut(d.name, 100), email = cut(d.email, 200);
  const company = cut(d.company, 150), details = cut(d.details, 1000);
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || details.length < 10)
    return json({ ok: false }, 422);
  const hook = process.env.DISCORD_WEBHOOK_URL;
  if (!hook) return json({ ok: false }, 500);
  const r = await fetch(hook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'Beaudry Marketing',
      allowed_mentions: { parse: [] },
      embeds: [{
        title: 'New project enquiry',
        color: 0x2f5bff,
        fields: [
          { name: 'Name', value: name },
          { name: 'Email', value: email },
          { name: 'Company', value: company || '-' },
          { name: 'Project details', value: details },
        ],
        timestamp: new Date().toISOString(),
      }],
    }),
  });
  return json({ ok: r.ok }, r.ok ? 200 : 502);
};
