// Recrée le compte administrateur dans la base locale (dev et test) après chaque remise à neuf.
// L'adresse et le mot de passe viennent de .env.local (jamais commité) : LOCAL_ADMIN_EMAIL, LOCAL_ADMIN_PASSWORD.
// Passe par l'API d'administration de l'auth locale, qui chiffre le mot de passe comme pour une vraie inscription.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const say = (text) => console.log(`🐷 ${text}`);

function envLocal(name) {
  const file = path.join(process.cwd(), '.env.local');
  if (!existsSync(file)) return null;
  const line = readFileSync(file, 'utf8').split(/\r?\n/).find((item) => item.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).trim() : null;
}

const url = envLocal('NEXT_PUBLIC_SUPABASE_URL') ?? '';
const serviceKey = envLocal('SUPABASE_SERVICE_ROLE_KEY');
const email = envLocal('LOCAL_ADMIN_EMAIL');
const password = envLocal('LOCAL_ADMIN_PASSWORD');

if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url)) {
  say('Compte admin non créé : .env.local ne pointe pas sur la base locale.');
  process.exit(0);
}
if (!email || !password || !serviceKey) {
  say('Compte admin non créé : ajoute LOCAL_ADMIN_EMAIL et LOCAL_ADMIN_PASSWORD dans .env.local.');
  process.exit(0);
}

const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
const admin = `${url}/auth/v1/admin/users`;
const account = {
  email,
  password,
  email_confirm: true,
  app_metadata: { role: 'admin' },
  user_metadata: { pseudo: 'Admin' },
};

const created = await fetch(admin, { method: 'POST', headers, body: JSON.stringify(account) });
if (created.ok) {
  say(`Compte admin prêt : ${email}`);
  process.exit(0);
}

// Déjà là (base gardée) : on remet le rôle et le mot de passe.
const list = await fetch(`${admin}?per_page=1000`, { headers });
const existing = list.ok ? (await list.json()).users?.find((user) => user.email === email.toLowerCase()) : null;
if (!existing) {
  say(`Compte admin non créé (${created.status}) : ${(await created.text()).slice(0, 200)}`);
  process.exit(1);
}
const updated = await fetch(`${admin}/${existing.id}`, {
  method: 'PUT',
  headers,
  body: JSON.stringify({ password, app_metadata: { ...existing.app_metadata, role: 'admin' } }),
});
say(updated.ok ? `Compte admin mis à jour : ${email}` : `Mise à jour du compte admin impossible (${updated.status}).`);
process.exit(updated.ok ? 0 : 1);
