/**
 * poster.js: 444Music share poster, Instagram portrait 1080 x 1350.
 * Loaded only when the Poster button is clicked, so the admin page never pays for it.
 * Needs /black.png (the 444Music logo) on the same site. Reads no database, writes nothing.
 */
const W = 1080, H = 1350;
const LOGO_URL = '/black.png';
const ICONS = 'https://cdn.jsdelivr.net/npm/simple-icons@11.14.0/icons/';
const DEFAULT_STORES = [
  { slug: 'spotify', name: 'Spotify' },
  { slug: 'applemusic', name: 'Apple Music' },
  { slug: 'youtubemusic', name: 'YouTube Music' }
];
const HEAD = '"Unbounded", "Arial Black", Impact, sans-serif';
const BODY = '"Oswald", "Arial Narrow", Impact, sans-serif';
const STRETCH = { O: 1.9, I: 3.4, U: 1.7, A: 1.6, E: 1.7 };

/* ---------- small helpers ---------- */
const lum = (c) => 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
const mix = (a, b, t) => ({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t });
const rgb = (c) => `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`;
const loadImg = (src, cors) => new Promise((ok, no) => {
  const i = new Image();
  if (cors) i.crossOrigin = 'anonymous';
  i.onload = () => ok(i);
  i.onerror = no;
  i.src = src;
});

let fontsReady = null;
function loadFonts() {
  if (fontsReady) return fontsReady;
  fontsReady = new Promise((done) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Unbounded:wght@900&family=Oswald:wght@400;500;600&display=swap';
    const go = () => Promise.all([
      document.fonts.load('900 100px Unbounded', 'ABLE GOD'),
      document.fonts.load('500 40px Oswald', 'Ab'),
      document.fonts.load('400 30px Oswald', 'Ab')
    ]).then(done, done);
    l.onload = go;
    l.onerror = done;
    document.head.appendChild(l);
    setTimeout(done, 6000);
  });
  return fontsReady;
}

/* ---------- logo: trimmed to the artwork, painted black or white ---------- */
let logoCache = null;
async function logo() {
  if (logoCache) return logoCache;
  const img = await loadImg(LOGO_URL, false);
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  const im = x.getImageData(0, 0, c.width, c.height), d = im.data;
  if (d[3] > 200) { // opaque corner: the file has a background, so cut it out by colour distance
    const br = d[0], bg = d[1], bb = d[2];
    for (let i = 0; i < d.length; i += 4) {
      const dist = Math.abs(d[i] - br) + Math.abs(d[i + 1] - bg) + Math.abs(d[i + 2] - bb);
      d[i + 3] = Math.min(255, dist * 2);
    }
    x.putImageData(im, 0, 0);
  }
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) {
    if (d[(y * c.width + xx) * 4 + 3] > 40) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  const w = Math.max(1, x1 - x0 + 1), h = Math.max(1, y1 - y0 + 1);
  const t = document.createElement('canvas');
  t.width = w; t.height = h;
  t.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h);
  return (logoCache = t);
}
function tint(src, color) {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

/* ---------- store icons ---------- */
const iconCache = {};
async function icon(slug, color) {
  const k = slug + color;
  if (iconCache[k] !== undefined) return iconCache[k];
  try {
    const r = await fetch(ICONS + slug + '.svg');
    if (!r.ok) throw new Error('missing');
    const svg = (await r.text()).replace('<svg', `<svg width="128" height="128" fill="${color}"`);
    iconCache[k] = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), false);
  } catch { iconCache[k] = null; }
  return iconCache[k];
}
// Always the same three stores on every poster, whatever links the release has
function storesFor() {
  return DEFAULT_STORES;
}

/* ---------- cover + colours ---------- */
async function loadCover(url) {
  if (!url) return null;
  try { return { img: await loadImg(url, true), safe: true }; } catch {}
  try { return { img: await loadImg(url, false), safe: false }; } catch { return null; }
}
function palette(img) {
  if (!img) return [{ r: 24, g: 24, b: 26 }, { r: 70, g: 70, b: 74 }];
  const s = 40, c = document.createElement('canvas');
  c.width = c.height = s;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, s, s);
  const d = x.getImageData(0, 0, s, s).data, bins = {};
  for (let i = 0; i < d.length; i += 4) {
    const k = ((d[i] >> 5) << 6) | ((d[i + 1] >> 5) << 3) | (d[i + 2] >> 5);
    const b = bins[k] || (bins[k] = { n: 0, r: 0, g: 0, b: 0 });
    b.n++; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2];
  }
  const list = Object.values(bins).map((b) => {
    const c2 = { r: b.r / b.n, g: b.g / b.n, b: b.b / b.n, n: b.n };
    c2.sat = (Math.max(c2.r, c2.g, c2.b) - Math.min(c2.r, c2.g, c2.b)) / 255;
    c2.w = c2.n * (0.5 + c2.sat);
    return c2;
  }).sort((p, q) => q.w - p.w);
  const a = list[0];
  const dist = (p, q) => Math.abs(p.r - q.r) + Math.abs(p.g - q.g) + Math.abs(p.b - q.b);
  const b = list.find((o) => dist(o, a) > 110) || mix(a, lum(a) > 128 ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 }, 0.55);
  return [a, b];
}

/* ---------- text ---------- */
function spaced(ctx, text, cx, y, spacing) {
  const chars = [...text], ws = chars.map((ch) => ctx.measureText(ch).width);
  const total = ws.reduce((p, q) => p + q, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = 'left';
  chars.forEach((ch, i) => { ctx.fillText(ch, x, y); x += ws[i] + spacing; });
  return total;
}
function fitSpaced(ctx, text, weight, size, em, maxW) {
  for (let s = size; s >= 22; s -= 2) {
    ctx.font = `${weight} ${s}px ${BODY}`;
    const w = [...text].reduce((p, ch) => p + ctx.measureText(ch).width, 0) + s * em * (text.length - 1);
    if (w <= maxW) return s;
  }
  return 22;
}
function stretchPlan(line) {
  const ch = [...line], plan = ch.map(() => 1);
  const letters = ch.filter((c) => /\S/.test(c)).length;
  const want = letters >= 6 ? 2 : letters >= 3 ? 1 : 0;
  const mid = (ch.length - 1) / 2, picked = [];
  for (let n = 0; n < want; n++) {
    let best = -1;
    for (const L of ['O', 'I', 'U', 'A', 'E']) {
      const idx = ch.map((c, i) => (c === L && !picked.some((p) => Math.abs(p - i) < 2)) ? i : -1).filter((i) => i >= 0);
      if (idx.length) { best = idx.sort((p, q) => Math.abs(p - mid) - Math.abs(q - mid))[0]; break; }
    }
    if (best < 0) break;
    picked.push(best);
    plan[best] = STRETCH[ch[best]];
  }
  return plan;
}
function layoutTitle(ctx, raw, maxW, maxH) {
  const words = raw.toUpperCase().trim().split(/\s+/);
  const options = [{ lines: [words.join(' ')], min: 88 }];
  if (words.length > 1) {
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
      const m = Math.max(a.length, b.length);
      if (!best || m < best.m) best = { m, lines: [a, b] };
    }
    options.push({ lines: best.lines, min: 44 });
  }
  const measure = (lines, s) => {
    ctx.font = `900 ${s}px ${HEAD}`;
    return lines.map((ln) => {
      const plan = stretchPlan(ln), ch = [...ln];
      const w = ch.reduce((p, c, i) => p + ctx.measureText(c).width * plan[i], 0) + s * 0.015 * (ch.length - 1);
      return { ln, plan, w };
    });
  };
  for (const o of options) {
    for (let s = 150; s >= o.min; s -= 4) {
      const m = measure(o.lines, s);
      if (Math.max(...m.map((r) => r.w)) <= maxW && o.lines.length * s * 0.98 <= maxH) return { rows: m, s, squeeze: 1 };
    }
  }
  const last = options[options.length - 1], s = 44, m = measure(last.lines, s);
  return { rows: m, s, squeeze: Math.min(1, maxW / Math.max(...m.map((r) => r.w))) };
}
function drawTitle(ctx, t, cx, top) {
  ctx.font = `900 ${t.s}px ${HEAD}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let y = top + t.s * 0.74;
  t.rows.forEach((r) => {
    let x = cx - (r.w * t.squeeze) / 2;
    [...r.ln].forEach((c, i) => {
      const adv = ctx.measureText(c).width * r.plan[i] * t.squeeze;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(r.plan[i] * t.squeeze, 1);
      ctx.fillText(c, 0, 0);
      ctx.restore();
      x += adv + t.s * 0.015 * t.squeeze;
    });
    y += t.s * 0.98;
  });
  return top + t.s * 0.74 + (t.rows.length - 1) * t.s * 0.98;
}

/* ---------- release data ---------- */
function featNames(item) {
  const names = [];
  const main = String(item.artistName || '').trim().toLowerCase();
  const add = (n) => { n = String(n || '').trim(); if (n && n.toLowerCase() !== main && !names.some((x) => x.toLowerCase() === n.toLowerCase())) names.push(n); };
  [item.featuringArtist, item.featuring, item.featuredArtist].forEach((v) => (Array.isArray(v) ? v.forEach(add) : add(v)));
  const lists = [item.artists, ...(Array.isArray(item.audioFiles) ? item.audioFiles.map((t) => t && t.artists) : [])];
  lists.forEach((l) => Array.isArray(l) && l.forEach((a) => a && /feat/i.test(a.type || '') && add(a.name)));
  // featuredArtists = [{ track, artists: [{ name, type }] }]; anything that is not "main" counts as featuring
  (Array.isArray(item.featuredArtists) ? item.featuredArtists : []).forEach((e) => e && Array.isArray(e.artists) && e.artists.forEach((a) => a && String(a.type || '').toLowerCase() !== 'main' && add(a.name)));
  return names.slice(0, 3);
}
function dateLabel(item) {
  const d = new Date(item.releaseDate);
  if (!item.releaseDate || isNaN(d.getTime())) return 'OUT NOW ON';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (d.getTime() <= today.getTime()) return 'OUT NOW ON';
  return 'COMING ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase() + ' ON';
}

/* ---------- the poster ---------- */
async function render(item) {
  await loadFonts();
  const title = item.releaseTitle || item.songTitle || item.title || 'Untitled';
  const artist = (item.artistName || 'Unknown Artist').toUpperCase();
  const feats = featNames(item);
  const coverUrl = item.officialCoverURL || item.coverURL || item.coverUrl || item.artworkUrl || '';
  const [cover, logoSrc, stores] = await Promise.all([loadCover(coverUrl), logo().catch(() => null), Promise.resolve(storesFor(item))]);

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // dynamic background taken from the cover
  const [p1, p2] = palette(cover && cover.img);
  const dark = lum(p1) <= lum(p2) ? p1 : p2, light = dark === p1 ? p2 : p1;
  const top = mix(dark, { r: 0, g: 0, b: 0 }, 0.35);
  const bot = lum(light) - lum(dark) < 40 ? mix(light, lum(light) > 128 ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 }, 0.22) : light;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, rgb(top)); g.addColorStop(1, rgb(bot));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 560, 80, W / 2, 560, 720);
  glow.addColorStop(0, 'rgba(255,255,255,0.10)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  const noise = document.createElement('canvas'); noise.width = noise.height = 200;
  const nx = noise.getContext('2d'), nd = nx.createImageData(200, 200);
  for (let i = 0; i < nd.data.length; i += 4) { const v = Math.random() * 255; nd.data[i] = nd.data[i + 1] = nd.data[i + 2] = v; nd.data[i + 3] = 16; }
  nx.putImageData(nd, 0, 0);
  ctx.fillStyle = ctx.createPattern(noise, 'repeat'); ctx.fillRect(0, 0, W, H);

  // black or white, only these two, from the colour right behind each element
  const ink = (y) => (lum(mix(top, bot, y / H)) > 140 ? '#000' : '#fff');

  // logo
  if (logoSrc) {
    const lh = 84, lw = lh * (logoSrc.width / logoSrc.height);
    ctx.drawImage(tint(logoSrc, ink(98)), (W - lw) / 2, 56, lw, lh);
  }
  // new release
  ctx.fillStyle = ink(215); ctx.globalAlpha = 0.9;
  ctx.fillRect(W / 2 - 48, 176, 96, 2);
  ctx.font = `600 28px ${BODY}`;
  spaced(ctx, 'NEW RELEASE', W / 2, 228, 12);
  ctx.globalAlpha = 1;

  // cover
  const S = 600, X = (W - S) / 2, Y = 262;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 26;
  if (cover) {
    const iw = cover.img.naturalWidth, ih = cover.img.naturalHeight, s = Math.min(iw, ih);
    ctx.drawImage(cover.img, (iw - s) / 2, (ih - s) / 2, s, s, X, Y, S, S);
  } else {
    ctx.fillStyle = '#1a1a1c'; ctx.fillRect(X, Y, S, S);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2; ctx.strokeRect(X + 1, Y + 1, S - 2, S - 2);

  // title, artist, featuring
  const featLine = feats.length ? 'FEAT. ' + feats.join(', ').toUpperCase() : '';
  const zoneTop = 898, zoneH = 244, artistBlock = 52 + (featLine ? 40 : 0);
  ctx.fillStyle = ink(1010);
  const t = layoutTitle(ctx, title, 940, zoneH - artistBlock - 14);
  const titleBottom = drawTitle(ctx, t, W / 2, zoneTop);
  ctx.textBaseline = 'alphabetic';
  let size = fitSpaced(ctx, artist, 500, 46, 0.16, 920);
  ctx.font = `500 ${size}px ${BODY}`;
  const ay = titleBottom + 14 + size;
  spaced(ctx, artist, W / 2, ay, size * 0.16);
  if (featLine) {
    size = fitSpaced(ctx, featLine, 400, 30, 0.14, 900);
    ctx.font = `400 ${size}px ${BODY}`;
    ctx.globalAlpha = 0.75;
    spaced(ctx, featLine, W / 2, ay + 14 + size, size * 0.14);
    ctx.globalAlpha = 1;
  }

  // stores
  ctx.fillStyle = ink(1180); ctx.font = `500 22px ${BODY}`;
  ctx.globalAlpha = 0.85;
  spaced(ctx, dateLabel(item), W / 2, 1182, 7);
  ctx.globalAlpha = 1;
  const col = ink(1235), IS = 60, GAP = 38;
  const imgs = await Promise.all(stores.map((s) => icon(s.slug, col)));
  const widths = stores.map((s, i) => (imgs[i] ? IS : Math.max(IS, 22 + s.name.length * 12)));
  let sx = (W - (widths.reduce((p, q) => p + q, 0) + GAP * (stores.length - 1))) / 2;
  stores.forEach((s, i) => {
    if (imgs[i]) ctx.drawImage(imgs[i], sx, 1206, IS, IS);
    else { ctx.fillStyle = col; ctx.font = `500 26px ${BODY}`; ctx.textAlign = 'left'; ctx.fillText(s.name.toUpperCase(), sx, 1246); }
    sx += widths[i] + GAP;
  });

  // link
  if (item.smartLinkSlug) {
    ctx.fillStyle = ink(1310); ctx.globalAlpha = 0.7; ctx.font = `400 22px ${BODY}`;
    spaced(ctx, '444musicdistro.com/l/' + item.smartLinkSlug, W / 2, 1312, 2);
    ctx.globalAlpha = 1;
  }
  return { canvas: c, safe: !cover || cover.safe, title, hadCover: !!cover };
}

/* ---------- preview window ---------- */
function styles() {
  if (document.getElementById('pzStyle')) return;
  const s = document.createElement('style');
  s.id = 'pzStyle';
  s.textContent = `
  .pz{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px}
  .pz canvas{height:min(76vh,calc((100vw - 32px)*1.25));aspect-ratio:4/5;border-radius:4px;box-shadow:0 30px 80px rgba(0,0,0,.7)}
  .pz-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center}
  .pz button{font:700 .74rem Inter,system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;padding:12px 22px;border-radius:4px;cursor:pointer;border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff}
  .pz button.main{background:#fff;color:#000;border-color:#fff}
  .pz button:disabled{opacity:.4;cursor:not-allowed}
  .pz small{color:#9a9a9f;font:.72rem Inter,system-ui,sans-serif}`;
  document.head.appendChild(s);
}

export async function showPoster(item, toast) {
  styles();
  const r = await render(item);
  if (!r.hadCover) toast('warning', 'No cover image found for this release, so the poster uses a plain block.');
  if (!r.safe) toast('warning', 'Preview only: the cover server blocks saving images from this page.');
  const o = document.createElement('div');
  o.className = 'pz';
  o.appendChild(r.canvas);
  const row = document.createElement('div');
  row.className = 'pz-row';
  o.appendChild(row);
  const note = document.createElement('small');
  note.textContent = '1080 x 1350, Instagram portrait';
  o.appendChild(note);

  const fileName = (item.smartLinkSlug || r.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-444music-poster.jpg';
  const blob = () => new Promise((ok, no) => { try { r.canvas.toBlob((b) => (b ? ok(b) : no(new Error('empty'))), 'image/jpeg', 0.94); } catch (e) { no(e); } });

  const dl = document.createElement('button');
  dl.className = 'main'; dl.textContent = 'Download'; dl.disabled = !r.safe;
  dl.onclick = async () => {
    try {
      const url = URL.createObjectURL(await blob());
      const a = document.createElement('a');
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch { toast('error', 'Could not save the image. The cover server blocks it.'); }
  };
  row.appendChild(dl);

  if (navigator.canShare && navigator.share) {
    const sh = document.createElement('button');
    sh.textContent = 'Share'; sh.disabled = !r.safe;
    sh.onclick = async () => {
      try {
        const file = new File([await blob()], fileName, { type: 'image/jpeg' });
        if (navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: r.title });
        else toast('info', 'This device cannot share images from here. Use Download.');
      } catch (e) { if (e && e.name !== 'AbortError') toast('error', 'Share failed.'); }
    };
    row.appendChild(sh);
  }
  const close = document.createElement('button');
  close.textContent = 'Close';
  const shut = () => { o.remove(); r.canvas.width = 0; document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') shut(); };
  close.onclick = shut;
  o.addEventListener('click', (e) => { if (e.target === o) shut(); });
  document.addEventListener('keydown', onKey);
  row.appendChild(close);
  document.body.appendChild(o);
}
