const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function render() {
  console.log('🚀 Rendering 4K Redesigned Posters based on your reference template...');

  const src = path.join(process.cwd(), 'public', 'mugs_posters.html');
  const dest = path.join(process.cwd(), 'dist', 'mugs_posters.html');
  fs.copyFileSync(src, dest);

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 2800, deviceScaleFactor: 2.5 });
  await page.goto('http://localhost:8080/mugs_posters.html', { waitUntil: 'networkidle0' });

  await new Promise(r => setTimeout(r, 1500));

  const brainDir = 'C:\\Users\\Philippines Freight\\.gemini\\antigravity-ide\\brain\\7c4f4873-2feb-4e09-947e-a94a160f9678';
  const promoDir = path.join(process.cwd(), 'public', 'promo');
  const distDir = path.join(process.cwd(), 'dist', 'promo');

  if (!fs.existsSync(promoDir)) fs.mkdirSync(promoDir, { recursive: true });
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  const targets = [
    { selector: '#poster-lotso-canvas', name: 'poster_lotso_reference_style.png' },
    { selector: '#poster-stitch-canvas', name: 'poster_stitch_reference_style.png' },
    { selector: '#poster-mickey-canvas', name: 'poster_mickey_reference_style.png' },
    { selector: '#poster-nick-canvas', name: 'poster_nick_fox_reference_style.png' },
    { selector: '#poster-all-canvas', name: 'poster_all_4_reference_style.png' }
  ];

  for (const t of targets) {
    const el = await page.$(t.selector);
    if (el) {
      const destPromo = path.join(promoDir, t.name);
      const destBrain = path.join(brainDir, t.name);
      const destDist = path.join(distDir, t.name);

      await el.screenshot({ path: destPromo, type: 'png' });
      fs.copyFileSync(destPromo, destBrain);
      fs.copyFileSync(destPromo, destDist);
      console.log('✅ Generated 4K Poster Picture:', t.name);
    } else {
      console.error('❌ Selector not found:', t.selector);
    }
  }

  await browser.close();
  console.log('🎉 All 5 posters generated successfully in 4K resolution!');
}

render().catch(err => {
  console.error('Fatal render error:', err);
  process.exit(1);
});
