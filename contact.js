// Shared contact-form handler used by both the production proxy worker and the
// staging worker. Sends the submission to the team via Resend. The API key and
// (optional) From address come from worker secrets/vars, never from source.

// Without a verified domain, Resend only delivers to the account owner's
// address. Once layer-nine.ai is verified in Resend, set the worker vars
// MAIL_FROM ("Layer Nine <website@layer-nine.ai>") and CONTACT_TO
// ("luce@layer-nine.ai,timur@layer-nine.ai,hunter@layer-nine.ai") to send
// branded mail to the whole team directly.
const DEFAULT_TO = ['timur@layer-nine.ai'];
const DEFAULT_FROM = 'Layer Nine <onboarding@resend.dev>';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Common disposable-address providers: not "working" emails for a sales lead.
const DISPOSABLE = new Set([
  'mailinator.com', 'tempmail.com', 'temp-mail.org', 'guerrillamail.com',
  '10minutemail.com', 'yopmail.com', 'trashmail.com', 'sharklasers.com',
  'getnada.com', 'dispostable.com', 'maildrop.cc', 'fakeinbox.com',
  'throwawaymail.com', 'mytemp.email', 'tempmailo.com',
]);

// A "working" email needs a domain that actually accepts mail: MX records,
// or at minimum an A record (RFC 5321 fallback). Checked via DNS-over-HTTPS.
async function domainAcceptsMail(domain) {
  const doh = async (type) => {
    const r = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
      { headers: { accept: 'application/dns-json' } },
    );
    if (!r.ok) throw new Error('doh');
    const d = await r.json();
    return Array.isArray(d.Answer) && d.Answer.length > 0;
  };
  try {
    if (await doh('MX')) return true;
    return await doh('A');
  } catch {
    // If the DNS check itself fails, don't block a potential lead.
    return true;
  }
}

export async function handleContact(request, env) {
  let data;
  try {
    data = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'bad json' }, { status: 400 });
  }

  // Honeypot: if the hidden field is filled, it's a bot. Pretend success, send nothing.
  if (data.website) return Response.json({ ok: true });

  const company = String(data.company || '').trim().slice(0, 200);
  const email = String(data.email || '').trim().slice(0, 200);
  const name = String(data.name || '').trim().slice(0, 200);
  const help = String(data.help || '').trim().slice(0, 5000);
  const page = String(data.page || '/').slice(0, 100);

  if (!company || !EMAIL_RE.test(email)) {
    return Response.json({ ok: false, error: 'validation' }, { status: 400 });
  }

  const domain = email.split('@')[1].toLowerCase();
  if (DISPOSABLE.has(domain) || !(await domainAcceptsMail(domain))) {
    return Response.json({ ok: false, error: 'email_domain' }, { status: 400 });
  }

  // No key configured yet -> tell the client so it can fall back to a mailto link.
  if (!env.RESEND_API_KEY) {
    return Response.json({ ok: false, error: 'unconfigured' }, { status: 503 });
  }

  const lines = [
    `Company: ${company}`,
    `Email:   ${email}`,
    name ? `Name:    ${name}` : null,
    `Page:    https://layer-nine.ai${page}`,
    '',
    help || '(no message provided)',
  ].filter((l) => l !== null);

  let resp;
  try {
    resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAIL_FROM || DEFAULT_FROM,
        to: env.CONTACT_TO ? env.CONTACT_TO.split(',').map((s) => s.trim()) : DEFAULT_TO,
        reply_to: email,
        subject: `Discovery call request — ${company}`,
        text: lines.join('\n'),
      }),
    });
  } catch {
    return Response.json({ ok: false, error: 'network' }, { status: 502 });
  }

  if (!resp.ok) {
    return Response.json({ ok: false, error: 'send failed' }, { status: 502 });
  }
  return Response.json({ ok: true });
}
