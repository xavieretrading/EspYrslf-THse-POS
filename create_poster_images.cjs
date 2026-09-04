const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function buildPosters() {
  console.log('🚀 Generating 10K Agency Poster Images...');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

  const posters = [
    {
      name: 'Lotso_Bear_Promo_Poster.png',
      themeColor: '#e11d48',
      darkColor: '#881337',
      accentColor: '#fb7185',
      splashBg: '#ffe4e6',
      splashCircle: '#fda4af',
      badgeGradient: 'radial-gradient(circle at 35% 30%, #ff4d79 0%, #e11d48 50%, #9f1239 100%)',
      heroImg: '/promo/lotso_mug_enhanced_1788338784248.jpg',
      boxImg: '/mugs/865bb574-740a-4b7a-815d-7527dc919ab4.jpg',
      mascot: '🧸',
      desc: '100% High-Grade Ceramic • Food Safe • Official Collectible'
    },
    {
      name: 'Stitch_Promo_Poster.png',
      themeColor: '#0284c7',
      darkColor: '#075985',
      accentColor: '#38bdf8',
      splashBg: '#e0f2fe',
      splashCircle: '#7dd3fc',
      badgeGradient: 'radial-gradient(circle at 35% 30%, #38bdf8 0%, #0284c7 50%, #0369a1 100%)',
      heroImg: '/promo/stitch_mug_enhanced_1788338343236.jpg',
      boxImg: '/mugs/ea972e35-c678-4de5-8c3b-fdb468cf308f.jpg',
      mascot: '👽',
      desc: 'Pastel Blue Ceramic • Matching Handle & Ceramic Lid'
    },
    {
      name: 'Mickey_Mouse_Promo_Poster.png',
      themeColor: '#d97706',
      darkColor: '#78350f',
      accentColor: '#f59e0b',
      splashBg: '#fef3c7',
      splashCircle: '#fcd34d',
      badgeGradient: 'radial-gradient(circle at 35% 30%, #fbbf24 0%, #d97706 50%, #92400e 100%)',
      heroImg: '/promo/mickey_mug_enhanced_1788338840358.jpg',
      boxImg: '/mugs/b61ca38e-3cbb-42cc-963c-d81458eadbf3.jpg',
      mascot: '🐭',
      desc: 'Classic Mickey Mouse • Glossy Black Rim & Ivory Ceramic'
    },
    {
      name: 'Nick_Fox_Promo_Poster.png',
      themeColor: '#ea580c',
      darkColor: '#9a3412',
      accentColor: '#fb923c',
      splashBg: '#ffedd5',
      splashCircle: '#fdba74',
      badgeGradient: 'radial-gradient(circle at 35% 30%, #fb923c 0%, #ea580c 50%, #9a3412 100%)',
      heroImg: '/promo/nick_fox_mug_enhanced_1788338885064.jpg',
      boxImg: '/mugs/e6b3b0a3-b8c3-4e31-8e75-af0a2068cdcd.jpg',
      mascot: '🦊',
      desc: 'Zootopia Nick Fox • Peach Ceramic & Sunburst Yellow Rim'
    },
    {
      name: 'All_4_Squad_Promo_Poster.png',
      themeColor: '#7c3aed',
      darkColor: '#4c1d95',
      accentColor: '#a855f7',
      splashBg: '#f3e8ff',
      splashCircle: '#d8b4fe',
      badgeGradient: 'radial-gradient(circle at 35% 30%, #c084fc 0%, #7c3aed 50%, #4c1d95 100%)',
      heroImg: '/promo/all_4_mugs_collection_1788338948421.jpg',
      boxImg: '/promo/all_4_mugs_collection_1788338948421.jpg',
      mascot: '✨',
      desc: 'Complete Series • All 4 Characters with Gift Boxes'
    }
  ];

  const promoDir = path.join(process.cwd(), 'public', 'promo');
  const brainDir = 'C:\\Users\\Philippines Freight\\.gemini\\antigravity-ide\\brain\\7c4f4873-2feb-4e09-947e-a94a160f9678';
  if (!fs.existsSync(promoDir)) fs.mkdirSync(promoDir, { recursive: true });

  for (const p of posters) {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,800;0,900;1,900&family=Caveat:wght@700&family=Plus+Jakarta+Sans:wght@800;900&display=swap" rel="stylesheet" />
  <style>
    body { margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: #ffffff; width: 1080px; height: 1080px; overflow: hidden; }
    .font-heavy { font-family: 'Montserrat', sans-serif; font-weight: 900; }
    .font-brush { font-family: 'Caveat', cursive; }
    .splash-bubble {
      background: ${p.badgeGradient};
      border-radius: 46% 54% 58% 42% / 48% 52% 48% 52%;
      box-shadow: inset 0 6px 14px rgba(255, 255, 255, 0.7), inset 0 -6px 12px rgba(0, 0, 0, 0.35);
    }
    .splash-ring {
      background: radial-gradient(circle at 30% 30%, #ffedd5, #f59e0b);
      border-radius: 50% 50% 45% 55% / 55% 45% 55% 45%;
      box-shadow: 0 15px 35px rgba(245, 158, 11, 0.4);
    }
    .stitched-promo {
      background: #ffffff;
      border: 3.5px dashed ${p.themeColor};
      border-radius: 32px;
      box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.15);
    }
    .product-shadow {
      filter: drop-shadow(0 30px 25px rgba(15, 23, 42, 0.3));
    }
  </style>
</head>
<body class="relative flex flex-col justify-between w-[1080px] height-[1080px]">

  <div class="absolute top-0 right-0 w-[520px] h-[190px] rounded-bl-[200px] z-0 opacity-95" style="background: linear-gradient(225deg, ${p.themeColor}, ${p.accentColor});"></div>

  <svg class="absolute bottom-20 right-4 w-[580px] h-[340px] z-0 opacity-70 pointer-events-none" viewBox="0 0 600 350" fill="none">
    <path d="M50,180 Q140,90 280,160 T520,120 Q560,200 480,260 T200,280 Q80,270 50,180 Z" fill="${p.splashBg}"/>
    <path d="M120,200 Q200,120 320,180 T560,160 Q590,230 510,290 T240,300 Q130,290 120,200 Z" fill="${p.splashBg}"/>
    <circle cx="80" cy="120" r="14" fill="${p.splashCircle}"/>
    <circle cx="110" cy="80" r="8" fill="${p.splashCircle}"/>
    <circle cx="530" cy="90" r="12" fill="${p.splashCircle}"/>
    <circle cx="560" cy="130" r="7" fill="${p.splashCircle}"/>
  </svg>

  <!-- TOP HEADER -->
  <div class="relative z-10 px-10 pt-8 flex justify-between items-start">
    <div class="flex items-center gap-3.5">
      <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-400 flex items-center justify-center shadow-xl border-4 border-white">
        <svg class="w-9 h-9 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
      </div>
      <div>
        <p class="text-sm font-heavy tracking-[0.2em] uppercase" style="color: ${p.themeColor};">SPOT</p>
        <p class="text-xl font-heavy text-slate-950 leading-tight">Agri Consumer Goods Trading OPC</p>
      </div>
    </div>

    <!-- 3D LIQUID SPLASH PRICE BADGE -->
    <div class="relative mr-3" style="filter: drop-shadow(0 20px 25px rgba(0,0,0,0.25));">
      <div class="splash-ring p-2.5">
        <div class="splash-bubble px-10 py-5 text-center text-white">
          <p class="text-[13px] font-heavy tracking-widest text-amber-200 uppercase leading-none">PROMO ONLY</p>
          <p class="font-heavy text-7xl text-white tracking-tighter leading-none mt-1 drop-shadow-md">599</p>
        </div>
      </div>
    </div>
  </div>

  <!-- MAIN BODY -->
  <div class="relative z-10 px-10 flex items-center justify-between mt-[-25px]">
    <!-- Left Column: Headline & Offer -->
    <div class="w-[46%] flex flex-col items-start gap-3">
      <div>
        <h2 class="font-heavy text-5xl leading-[1.02] tracking-tight" style="color: ${p.themeColor};">
          TAKE YOUR<br/>FAVORITE CHARACTER
        </h2>
        <div class="font-brush text-8xl leading-none mt-[-10px] transform -rotate-2 drop-shadow-md" style="color: ${p.darkColor};">
          Home!
        </div>
      </div>

      <!-- BUY 10 GET 1 FREE -->
      <div class="stitched-promo p-4 flex flex-col items-center w-[300px] text-center relative mt-1">
        <div class="text-white font-heavy text-2xl px-7 py-2 rounded-full uppercase tracking-wider shadow-lg" style="background: ${p.themeColor};">
          BUY 10
        </div>
        <div class="flex items-center justify-center gap-2 mt-2">
          <span class="font-heavy text-3xl text-slate-800 tracking-tight">GET</span>
          <span class="font-heavy text-6xl leading-none drop-shadow-md" style="color: ${p.themeColor};">1</span>
          <span class="font-heavy text-3xl text-slate-800 tracking-tight">FREE</span>
        </div>
      </div>

      <!-- Packaging Box Inset -->
      <div class="relative mt-2">
        <div class="w-64 h-40 rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-slate-50">
          <img src="http://localhost:8080${p.boxImg}" alt="Box Inset" class="w-full h-full object-cover" />
        </div>
        <div class="absolute -bottom-3 -right-3 text-white font-heavy text-[11px] px-3 py-1 rounded-lg shadow-md border-2 border-white" style="background: ${p.themeColor};">
          🎁 GIFT BOX INCLUDED
        </div>
      </div>
    </div>

    <!-- Right Column: Hero Large Mug -->
    <div class="w-[54%] flex justify-center items-center relative">
      <div class="absolute w-[470px] h-[550px] rounded-full blur-2xl opacity-60 z-0" style="background: ${p.splashBg};"></div>
      <div class="relative z-10 w-[470px] h-[560px] rounded-3xl overflow-hidden product-shadow border-4 border-white bg-white p-2">
        <img src="http://localhost:8080${p.heroImg}" alt="Hero Mug" class="w-full h-full object-cover rounded-2xl" />
      </div>
    </div>
  </div>

  <!-- FOOTER & CTA -->
  <div class="relative z-10 w-full mt-2">
    <div class="flex items-center justify-between px-10 pb-3">
      <div class="flex items-center gap-3.5">
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-xl border-2 border-white transform -rotate-3" style="background: ${p.accentColor};">
          ${p.mascot}
        </div>
        <div>
          <p class="font-heavy text-3xl text-slate-900 tracking-wide uppercase leading-none">
            GRAB YOURS TODAY!
          </p>
          <p class="text-xs font-bold tracking-wide mt-0.5" style="color: ${p.darkColor};">
            ${p.desc}
          </p>
        </div>
      </div>
      <div class="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-heavy text-xs uppercase px-4 py-2 rounded-xl shadow-lg border border-amber-300">
        ⚡ LIMITED EDITION COLLECTIBLE
      </div>
    </div>

    <!-- Maroon / Dark Solid Footer -->
    <div class="text-white py-4 px-10 flex items-center justify-between text-xs font-bold tracking-wide shadow-2xl" style="background: ${p.darkColor};">
      <div class="flex items-center gap-2.5 max-w-[42%]">
        <div class="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-sm font-black flex-shrink-0 shadow">📍</div>
        <p class="leading-tight uppercase text-[11px]">
          UNIT 7, BENELY BLDG. J DE VEYRA ST.<br/>BRGY. CARRETA, CEBU CITY, PHILIPPINES
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-sm font-black flex-shrink-0 shadow">📞</div>
        <div>
          <p class="text-[9px] uppercase tracking-widest text-amber-200">Call / Inquire</p>
          <span class="text-base font-heavy text-amber-200 leading-none">09968 181 6093</span>
        </div>
      </div>

      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-black flex-shrink-0 shadow border border-white/40">f</div>
        <div>
          <p class="text-[9px] uppercase tracking-widest text-pink-200">Official Page</p>
          <span class="text-[11px] font-heavy text-white uppercase tracking-wide">SPOT AGRI CONSUMER GOODS TRADING OPC</span>
        </div>
      </div>
    </div>
  </div>

</body>
</html>
`;

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));

    const destPromo = path.join(promoDir, p.name);
    const destBrain = path.join(brainDir, p.name);

    await page.screenshot({ path: destPromo, type: 'png' });
    fs.copyFileSync(destPromo, destBrain);
    console.log('✅ Generated Poster Picture:', p.name);
  }

  await browser.close();
  console.log('🎉 All 5 standalone poster pictures generated successfully!');
}

buildPosters().catch(err => {
  console.error('Render error:', err);
  process.exit(1);
});
