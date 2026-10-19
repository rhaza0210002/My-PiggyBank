// Séance de test entre amis : construit l'app en production avec l'outil de retours, la lance sur le PC,
// ouvre un tunnel Cloudflare gratuit et affiche les liens à envoyer. Ctrl+C arrête tout.
//
//   yarn seance-test               construction + app + tunnel
//   yarn seance-test --sans-build  réutilise la dernière construction
//   yarn seance-test --wifi        sans tunnel : seulement les amis sur le même Wi-Fi
//   yarn seance-test --garder-donnees  ne remet pas la base de test à neuf (reprendre une séance)
//
// La base est la base locale (Docker), remise à neuf à chaque séance ; le navigateur des testeurs la joint
// par l'app (`/supabase`), puisque le tunnel n'expose que l'app.
//
// Les retours (erreurs et « Signaler un souci ») arrivent dans .superpowers/retours/retours.jsonl.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import path from 'node:path';

const PORT = 3100;
const args = new Set(process.argv.slice(2));
const withTunnel = !args.has('--wifi');
const env = { ...process.env, NEXT_PUBLIC_TEST_SESSION: 'on', TEST_SESSION: 'on', NEXT_PUBLIC_SUPABASE_VIA_APP: 'on' };
const next = path.join('node_modules', 'next', 'dist', 'bin', 'next');
const marker = path.join('.next', 'SEANCE_TEST');
const BUILD_VERSION = 'v2-base-locale';
const children = [];

const say = (text) => console.log(`\n🐷 ${text}`);

function findCloudflared() {
  const candidates = [
    'cloudflared',
    'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
    'C:\\Program Files\\cloudflared\\cloudflared.exe',
    path.join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'WinGet', 'Links', 'cloudflared.exe'),
  ];
  return candidates.find((candidate) => spawnSync(candidate, ['--version'], { stdio: 'ignore' }).status === 0) ?? null;
}

function lanAddresses() {
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((item) => item && item.family === 'IPv4' && !item.internal && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(item.address))
    .map((item) => item.address);
  // Les 172.x sont souvent des cartes virtuelles (WSL, Hyper-V) : l'adresse de la box passe d'abord.
  const home = addresses.filter((address) => address.startsWith('192.168.'));
  return (home.length ? home : addresses).map((address) => `http://${address}:${PORT}`);
}

function copyToClipboard(text) {
  if (process.platform !== 'win32') return;
  spawnSync('powershell', ['-NoProfile', '-Command', `Set-Clipboard -Value '${text}'`], { stdio: 'ignore' });
}

function stopAll() {
  children.forEach((child) => child.kill());
  process.exit(0);
}
process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);

const cloudflared = withTunnel ? findCloudflared() : null;
if (withTunnel && !cloudflared) {
  say('cloudflared est introuvable. Installe-le une fois avec :  winget install Cloudflare.cloudflared');
  say('ou lance la séance pour le Wi-Fi seulement :  yarn seance-test --wifi');
  process.exit(1);
}

// Base de test : la base locale (Docker), remise à neuf à chaque séance. Jamais la prod.
function envLocal(name) {
  const file = path.join(process.cwd(), '.env.local');
  if (!existsSync(file)) return null;
  const line = readFileSync(file, 'utf8').split(/\r?\n/).find((item) => item.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).trim() : null;
}

const supabaseUrl = envLocal('NEXT_PUBLIC_SUPABASE_URL') ?? '';
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(supabaseUrl)) {
  say('.env.local ne pointe pas sur la base locale : pas de séance de test sur la base de prod.');
  say('Mets-y NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321 (voir le README, « Base de données »).');
  process.exit(1);
}

const supabaseCli = (cliArgs) => spawnSync('npx', ['supabase', ...cliArgs], { stdio: 'inherit', shell: true }).status;
if (spawnSync('npx', ['supabase', 'status'], { stdio: 'ignore', shell: true }).status !== 0) {
  say('Démarrage de la base locale (Docker Desktop doit tourner)…');
  if (supabaseCli(['start']) !== 0) {
    say('La base locale n’a pas démarré : Docker Desktop est-il lancé ?');
    process.exit(1);
  }
}
if (!args.has('--garder-donnees')) {
  say('Remise à neuf de la base de test (comptes et données fictifs)…');
  if (supabaseCli(['db', 'reset']) !== 0) {
    say('La remise à neuf a échoué : rien n’est lancé.');
    process.exit(1);
  }
}

// Une construction ordinaire n'a ni le bouton de retours ni le relais vers la base : on ne la réutilise que
// si elle vient d'ici, dans la même version du script.
if (!args.has('--sans-build') || !existsSync(marker) || !readFileSync(marker, 'utf8').startsWith(BUILD_VERSION)) {
  say('Construction de l’app en mode séance de test (1 à 2 minutes)…');
  const build = spawnSync(process.execPath, [next, 'build'], { stdio: 'inherit', env });
  if (build.status !== 0) {
    say('La construction a échoué : rien n’est lancé.');
    process.exit(1);
  }
  writeFileSync(marker, `${BUILD_VERSION} ${new Date().toISOString()}`);
}

say(`Lancement de l’app sur le port ${PORT}…`);
const app = spawn(process.execPath, [next, 'start', '-p', String(PORT), '-H', '0.0.0.0'], { stdio: 'inherit', env });
children.push(app);
app.on('exit', (code) => {
  say(`L’app s’est arrêtée (code ${code}).`);
  stopAll();
});

const lan = lanAddresses();
if (lan.length) say(`Sur le même Wi-Fi :  ${lan.join('   ou   ')}`);

if (cloudflared) {
  say('Ouverture du tunnel Cloudflare…');
  const tunnel = spawn(cloudflared, ['tunnel', '--no-autoupdate', '--url', `http://localhost:${PORT}`], { env });
  children.push(tunnel);
  let announced = false;
  const watch = (chunk) => {
    const match = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(chunk.toString());
    if (match && !announced) {
      announced = true;
      copyToClipboard(match[0]);
      say(`Lien à envoyer à tes amis (déjà copié) :  ${match[0]}`);
      say('Retours : .superpowers/retours/retours.jsonl   ·   Ctrl+C pour tout arrêter.');
    }
  };
  tunnel.stdout.on('data', watch);
  tunnel.stderr.on('data', watch);
  tunnel.on('exit', (code) => {
    if (!announced) say(`Le tunnel n’a pas pu s’ouvrir (code ${code}). Le Wi-Fi reste disponible.`);
  });
} else {
  say('Retours : .superpowers/retours/retours.jsonl   ·   Ctrl+C pour tout arrêter.');
}
