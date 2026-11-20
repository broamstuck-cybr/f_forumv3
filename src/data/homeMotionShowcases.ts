export interface HomeMotionShowcaseFile {
  path: string;
  language: 'html' | 'css' | 'javascript';
  content: string;
}

export interface HomeMotionConfig {
  easing: string;
  durationMs: number;
  pattern: string;
  reducedFallback: string;
}

export interface HomeMotionShowcaseItem {
  id: string;
  title: string;
  category: string;
  source: 'motionsites' | 'sourceofknowledge';
  gifUrl: string;
  fallbackUrl: string;
  liveUrl: string;
  summaryVi: string;
  motionConfig: HomeMotionConfig;
  files: HomeMotionShowcaseFile[];
}

export const HOME_MOTION_SHOWCASES: HomeMotionShowcaseItem[] = [
  {
    id: 'hms-space-voyage',
    title: 'Space Voyage Hero',
    category: 'Tương tác chiều sâu',
    source: 'motionsites',
    gifUrl: 'https://motionsites.ai/assets/hero-space-voyage-preview-eECLH3Yc.gif',
    fallbackUrl:
      'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png',
    liveUrl: 'https://motionsites.ai/sections#space-voyage',
    summaryVi:
      'Bố cục hero phân lớp theo tọa độ con trỏ, chữ hiển thị rõ trên nền vũ trụ tối cùng nút khởi chạy có vòng sáng đáp ứng.',
    motionConfig: {
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      durationMs: 680,
      pattern: 'Pointer Parallax + Layer Depth',
      reducedFallback: 'Giữ nguyên lớp tĩnh ở trạng thái cân bằng trung tâm',
    },
    files: [
      {
        path: 'index.html',
        language: 'html',
        content:
          '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Space Voyage</title><link rel="stylesheet" href="styles.css"></head><body><main class="sv-stage"><div class="sv-orb" aria-hidden="true"></div><section class="sv-card"><p class="sv-kicker">CHƯƠNG 01 · QUỸ ĐẠO</p><h1>Hành trình vượt ngưỡng thị sai</h1><p class="sv-copy">Mỗi lớp giao diện dịch chuyển theo vector trỏ chuột nhưng vẫn khóa chặt khả năng đọc ở 390px và 1440px.</p><button class="sv-btn" type="button" id="svTrigger">Kích hoạt quỹ đạo</button></section></main><script src="app.js"></script></body></html>',
      },
      {
        path: 'styles.css',
        language: 'css',
        content:
          ":root{--sv-bg:#0a0b10;--sv-ink:#f4f1ea;--sv-gold:#c89b54}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--sv-bg);color:var(--sv-ink);font-family:'Be Vietnam Pro',system-ui,sans-serif;overflow:hidden}.sv-stage{position:relative;width:min(92vw,540px);padding:40px 32px;border-radius:24px;border:1px solid rgba(200,155,84,.28);background:rgba(20,23,32,.86)}.sv-orb{position:absolute;inset:-40% -20% auto auto;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(200,155,84,.36),transparent 70%);pointer-events:none;transition:transform .68s cubic-bezier(.22,1,.36,1)}.sv-kicker{margin:0 0 10px;font-size:11px;letter-spacing:.14em;color:var(--sv-gold)}.sv-card h1{margin:0 0 12px;font-size:clamp(24px,4vw,34px);line-height:1.15}.sv-copy{margin:0 0 22px;color:#adb3bf;font-size:14px;line-height:1.6}.sv-btn{padding:12px 22px;border-radius:999px;border:1px solid rgba(200,155,84,.5);background:transparent;color:var(--sv-ink);font-weight:600;cursor:pointer;transition:transform .24s ease,background .24s ease}.sv-btn:hover,.sv-btn.is-active{background:var(--sv-gold);color:#0a0b10}@media (prefers-reduced-motion:reduce){.sv-orb,.sv-btn{transition:none}}",
      },
      {
        path: 'app.js',
        language: 'javascript',
        content:
          "const stage=document.querySelector('.sv-stage');const orb=document.querySelector('.sv-orb');const btn=document.getElementById('svTrigger');const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(stage&&orb&&!reduced){stage.addEventListener('pointermove',(e)=>{const r=stage.getBoundingClientRect();const dx=(e.clientX-r.left-r.width/2)*0.08;const dy=(e.clientY-r.top-r.height/2)*0.08;orb.style.transform=`translate3d(${dx}px,${dy}px,0)`;});}if(btn){btn.addEventListener('click',()=>{btn.classList.toggle('is-active');btn.textContent=btn.classList.contains('is-active')?'Đang giữ quỹ đạo':'Kích hoạt quỹ đạo';});}",
      },
    ],
  },
  {
    id: 'hms-codenest',
    title: 'CodeNest Workspace Hero',
    category: 'Nền tảng lập trình',
    source: 'motionsites',
    gifUrl: 'https://motionsites.ai/assets/hero-codenest-preview-Cgppc2qV.gif',
    fallbackUrl:
      'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/codefronts-course-card.png',
    liveUrl: 'https://motionsites.ai/sections#codenest',
    summaryVi:
      'Thẻ trình bày mã nguồn theo nhịp gõ từng dòng với bộ chuyển tab giữa xem trước và cấu trúc tệp.',
    motionConfig: {
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      durationMs: 420,
      pattern: 'Tab Morph + Code Stream',
      reducedFallback: 'Hiển thị toàn văn khối mã không chạy hiệu ứng gõ',
    },
    files: [
      {
        path: 'index.html',
        language: 'html',
        content:
          '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CodeNest</title><link rel="stylesheet" href="styles.css"></head><body><main class="cn-wrap"><header class="cn-head"><span class="cn-tag">WORKSPACE</span><div class="cn-tabs" role="tablist"><button type="button" class="cn-tab is-on" data-tab="spec">Đặc tả</button><button type="button" class="cn-tab" data-tab="tokens">Token</button></div></header><pre class="cn-code" id="cnOutput"></pre></main><script src="app.js"></script></body></html>',
      },
      {
        path: 'styles.css',
        language: 'css',
        content:
          "body{margin:0;min-height:100vh;display:grid;place-items:center;background:#11131a;color:#f2efe9;font-family:'Be Vietnam Pro',system-ui,sans-serif;padding:20px;box-sizing:border-box}.cn-wrap{width:min(92vw,520px);border-radius:18px;border:1px solid rgba(255,255,255,.12);background:#171a24;overflow:hidden}.cn-head{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.08)}.cn-tag{font-size:11px;letter-spacing:.12em;color:#7da3bb}.cn-tabs{display:flex;gap:6px}.cn-tab{padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:transparent;color:#adb3bf;font-size:12px;cursor:pointer}.cn-tab.is-on{background:#f2efe9;color:#11131a;border-color:#f2efe9}.cn-code{margin:0;padding:20px;font-family:'IBM Plex Mono',monospace;font-size:13px;line-height:1.65;color:#bad9e6;white-space:pre-wrap}",
      },
      {
        path: 'app.js',
        language: 'javascript',
        content:
          "const views={spec:'layout: split-pane\\nbreakpoints: 390 | 768 | 1440\\nsandbox: allow-scripts',tokens:'--ink-dark: #121110;\\n--shell-bg: #F1ECEA;\\n--harbour: #7DA3BB;'};const out=document.getElementById('cnOutput');const tabs=document.querySelectorAll('.cn-tab');function show(k){if(out)out.textContent=views[k];tabs.forEach((b)=>b.classList.toggle('is-on',b.dataset.tab===k));}tabs.forEach((b)=>b.addEventListener('click',()=>show(b.dataset.tab||'spec')));show('spec');",
      },
    ],
  },
  {
    id: 'hms-stellar-ai-v2',
    title: 'Stellar AI v2',
    category: 'Điều phối tác tử',
    source: 'motionsites',
    gifUrl: 'https://motionsites.ai/assets/hero-stellar-ai-v2-preview-DjvxjG3C.gif',
    fallbackUrl:
      'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png',
    liveUrl: 'https://motionsites.ai/sections#stellar-ai-v2',
    summaryVi:
      'Bảng trạng thái luồng xử lý ba chặng với chuyển tiếp trạng thái mượt và nút kích hoạt thử nghiệm.',
    motionConfig: {
      easing: 'cubic-bezier(0.34, 1.35, 0.64, 1)',
      durationMs: 520,
      pattern: 'Staggered Pipeline Stepper',
      reducedFallback: 'Chuyển thẳng trạng thái hoàn tất không trễ theo từng bước',
    },
    files: [
      {
        path: 'index.html',
        language: 'html',
        content:
          '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stellar AI v2</title><link rel="stylesheet" href="styles.css"></head><body><section class="st-box"><div class="st-top"><h2>Chuỗi kiểm định trực tuyến</h2><button type="button" id="stRun">Chạy thử</button></div><ol class="st-list" id="stList"><li data-step="0">Đọc ngữ cảnh mã nguồn</li><li data-step="1">Đối chiếu Diff từng dòng</li><li data-step="2">Xác nhận Live View sạch</li></ol></section><script src="app.js"></script></body></html>',
      },
      {
        path: 'styles.css',
        language: 'css',
        content:
          "body{margin:0;min-height:100vh;display:grid;place-items:center;background:#121110;color:#f1ecea;font-family:'Be Vietnam Pro',system-ui,sans-serif;padding:20px;box-sizing:border-box}.st-box{width:min(92vw,460px);padding:24px;border-radius:20px;border:1px solid rgba(241,236,234,.14);background:#1a1917}.st-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.st-top h2{margin:0;font-size:18px}.st-top button{padding:8px 16px;border-radius:999px;border:0;background:#d63a27;color:#fff;font-weight:600;cursor:pointer}.st-list{margin:0;padding:0;list-style:none;display:grid;gap:10px}.st-list li{padding:12px 14px;border-radius:12px;border:1px solid rgba(241,236,234,.1);color:#a8a29e;transition:border-color .35s ease,color .35s ease,transform .35s cubic-bezier(.34,1.35,.64,1)}.st-list li.is-done{border-color:#7da3bb;color:#f1ecea;transform:translateX(4px)}@media (prefers-reduced-motion:reduce){.st-list li{transition:none;transform:none}}",
      },
      {
        path: 'app.js',
        language: 'javascript',
        content:
          "const btn=document.getElementById('stRun');const items=[...document.querySelectorAll('#stList li')];if(btn){btn.addEventListener('click',()=>{items.forEach((el)=>el.classList.remove('is-done'));items.forEach((el,i)=>setTimeout(()=>el.classList.add('is-done'),i*240));});}",
      },
    ],
  },
  {
    id: 'hms-transform-data',
    title: 'Transform Data Matrix',
    category: 'Trực quan hóa số liệu',
    source: 'motionsites',
    gifUrl: 'https://motionsites.ai/assets/hero-transform-data-preview-Cx5OU29N.gif',
    fallbackUrl:
      'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png',
    liveUrl: 'https://motionsites.ai/sections#transform-data',
    summaryVi:
      'Lưới cột số liệu tương tác đổi tập dữ liệu tại chỗ và giữ tỷ lệ thanh đo chính xác trên mọi khung nhìn.',
    motionConfig: {
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      durationMs: 480,
      pattern: 'Spring Bar Interpolation',
      reducedFallback: 'Cập nhật chiều cao cột ngay lập tức',
    },
    files: [
      {
        path: 'index.html',
        language: 'html',
        content:
          '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Transform Data</title><link rel="stylesheet" href="styles.css"></head><body><section class="td-card"><div class="td-head"><h2>Độ phủ kho mẫu</h2><button type="button" id="tdToggle">Đổi góc nhìn</button></div><div class="td-bars" id="tdBars"></div></section><script src="app.js"></script></body></html>',
      },
      {
        path: 'styles.css',
        language: 'css',
        content:
          "body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f1ecea;color:#121110;font-family:'Be Vietnam Pro',system-ui,sans-serif;padding:20px;box-sizing:border-box}.td-card{width:min(92vw,480px);padding:24px;border-radius:18px;border:1px solid rgba(18,17,16,.14);background:#fff}.td-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.td-head h2{margin:0;font-size:18px}.td-head button{padding:8px 14px;border-radius:999px;border:1px solid #121110;background:transparent;font-size:12px;font-weight:600;cursor:pointer}.td-bars{display:grid;gap:12px}.td-row{display:grid;grid-template-columns:96px 1fr 44px;align-items:center;gap:10px;font-size:13px}.td-track{height:10px;border-radius:999px;background:#ebe4df;overflow:hidden}.td-fill{height:100%;border-radius:999px;background:#7da3bb;transition:width .48s cubic-bezier(.16,1,.3,1)}@media (prefers-reduced-motion:reduce){.td-fill{transition:none}}",
      },
      {
        path: 'app.js',
        language: 'javascript',
        content:
          "const datasets=[[{name:'CodeFronts',pct:92},{name:'ThreeUI',pct:78},{name:'LucianLabs',pct:85},{name:'PinUI',pct:100}],[{name:'CodeFronts',pct:64},{name:'ThreeUI',pct:95},{name:'LucianLabs',pct:72},{name:'PinUI',pct:88}]];let idx=0;const root=document.getElementById('tdBars');function render(){if(!root)return;root.innerHTML=datasets[idx].map((d)=>`<div class='td-row'><span>${d.name}</span><div class='td-track'><div class='td-fill' style='width:${d.pct}%'></div></div><strong>${d.pct}%</strong></div>`).join('');}const btn=document.getElementById('tdToggle');if(btn)btn.addEventListener('click',()=>{idx=(idx+1)%datasets.length;render();});render();",
      },
    ],
  },
  {
    id: 'hms-orbit-web3',
    title: 'Orbit Web3 Stage',
    category: 'Vòng quỹ đạo CSS',
    source: 'motionsites',
    gifUrl: 'https://motionsites.ai/assets/hero-orbit-web3-preview-BXt4OttD.gif',
    fallbackUrl:
      'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-liquid-glass-button.png',
    liveUrl: 'https://motionsites.ai/sections#orbit-web3',
    summaryVi:
      'Quỹ đạo xoay thuần CSS có nút tạm dừng chuyển động tức thì và giữ bố cục cân tâm ở mọi kích thước.',
    motionConfig: {
      easing: 'linear',
      durationMs: 12000,
      pattern: 'Continuous Orbital Ring + Pause Control',
      reducedFallback: 'Dừng chuyển động xoay, giữ vị trí các nút trên vòng tròn',
    },
    files: [
      {
        path: 'index.html',
        language: 'html',
        content:
          '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Orbit Stage</title><link rel="stylesheet" href="styles.css"></head><body><main class="ob-stage"><div class="ob-ring" id="obRing"><span class="ob-node ob-a">HTML</span><span class="ob-node ob-b">CSS</span><span class="ob-node ob-c">JS</span></div><button type="button" class="ob-core" id="obToggle">Tạm dừng</button></main><script src="app.js"></script></body></html>',
      },
      {
        path: 'styles.css',
        language: 'css',
        content:
          "body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d0e14;color:#f1ecea;font-family:'Be Vietnam Pro',system-ui,sans-serif}.ob-stage{position:relative;width:280px;height:280px;display:grid;place-items:center}.ob-ring{position:absolute;inset:0;border-radius:50%;border:1px dashed rgba(125,163,187,.4);animation:ob-spin 12s linear infinite}.ob-ring.is-paused{animation-play-state:paused}.ob-node{position:absolute;padding:6px 10px;border-radius:999px;background:#1b202c;border:1px solid rgba(186,217,230,.35);font-size:11px;font-weight:600}.ob-a{top:-14px;left:50%;transform:translateX(-50%)}.ob-b{bottom:18px;left:6px}.ob-c{bottom:18px;right:6px}.ob-core{position:relative;z-index:2;padding:12px 20px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:#171a24;color:#fff;cursor:pointer}@keyframes ob-spin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.ob-ring{animation:none}}",
      },
      {
        path: 'app.js',
        language: 'javascript',
        content:
          "const ring=document.getElementById('obRing');const btn=document.getElementById('obToggle');if(ring&&btn){btn.addEventListener('click',()=>{const p=ring.classList.toggle('is-paused');btn.textContent=p?'Tiếp tục':'Tạm dừng';});}",
      },
    ],
  },
  {
    id: 'hms-planet-orbit',
    title: 'Planet Orbit Showcase',
    category: 'Không gian 3D',
    source: 'motionsites',
    gifUrl: 'https://motionsites.ai/assets/hero-planet-orbit-preview-DWAP8Z1P.gif',
    fallbackUrl:
      'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png',
    liveUrl: 'https://motionsites.ai/sections#planet-orbit',
    summaryVi:
      'Bề mặt hành tinh giả lập ánh sáng viền bằng gradient đa lớp kết hợp thanh điều chỉnh góc nghiêng.',
    motionConfig: {
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      durationMs: 360,
      pattern: 'Interactive Tilt Slider',
      reducedFallback: 'Giữ góc chiếu cố định theo thanh trượt người dùng chọn',
    },
    files: [
      {
        path: 'index.html',
        language: 'html',
        content:
          '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Planet Orbit</title><link rel="stylesheet" href="styles.css"></head><body><section class="po-wrap"><div class="po-planet" id="poPlanet"><div class="po-halo"></div></div><label class="po-ctl">Góc quỹ đạo <input type="range" id="poRange" min="-28" max="28" value="12"></label></section><script src="app.js"></script></body></html>',
      },
      {
        path: 'styles.css',
        language: 'css',
        content:
          "body{margin:0;min-height:100vh;display:grid;place-items:center;background:#090b10;color:#f1ecea;font-family:'Be Vietnam Pro',system-ui,sans-serif}.po-wrap{display:grid;justify-items:center;gap:28px}.po-planet{position:relative;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle at 32% 30%,#ddad95,#7da3bb 48%,#141824 85%);box-shadow:0 24px 60px rgba(125,163,187,.22)}.po-halo{position:absolute;inset:-22px -42px;border-radius:50%;border:2px solid rgba(221,173,149,.55);transform:rotate(12deg);transition:transform .24s ease}.po-ctl{display:flex;align-items:center;gap:12px;font-size:13px;color:#bad9e6}",
      },
      {
        path: 'app.js',
        language: 'javascript',
        content:
          "const range=document.getElementById('poRange');const halo=document.querySelector('.po-halo');if(range&&halo){range.addEventListener('input',()=>{halo.style.transform=`rotate(${range.value}deg)`;});}",
      },
    ],
  },
  {
    id: 'hms-aethera',
    title: 'Aethera Editorial Grid',
    category: 'Biên tập tạp chí',
    source: 'motionsites',
    gifUrl: 'https://motionsites.ai/assets/hero-aethera-preview-DknSlcTa.gif',
    fallbackUrl:
      'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-liquid-glass-button.png',
    liveUrl: 'https://motionsites.ai/sections#aethera',
    summaryVi:
      'Nhịp chữ biên tập kết hợp lưới chỉ mục hai cột trên nền giấy ấm và đường kẻ 1px sắc nét.',
    motionConfig: {
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      durationMs: 380,
      pattern: 'Hairline Accordion Reveal',
      reducedFallback: 'Mở đóng tức thì không kéo chiều cao',
    },
    files: [
      {
        path: 'index.html',
        language: 'html',
        content:
          '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aethera Editorial</title><link rel="stylesheet" href="styles.css"></head><body><main class="ae-sheet"><p class="ae-label">BẢN CHỈ MỤC · 2026</p><h1>Thiết kế bắt đầu từ cấu trúc chữ</h1><div class="ae-grid"><button type="button" class="ae-item" aria-expanded="true"><span>01 · Nhịp tỷ lệ 8px</span><small>Giữ khoảng thở đồng nhất trên mọi điểm gãy.</small></button><button type="button" class="ae-item" aria-expanded="false"><span>02 · Độ tương phản mực giấy</span><small>Đạt chuẩn AA trên cả hai nền sáng tối.</small></button></div></main><script src="app.js"></script></body></html>',
      },
      {
        path: 'styles.css',
        language: 'css',
        content:
          "body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f1ecea;color:#121110;font-family:'Be Vietnam Pro',system-ui,sans-serif;padding:24px;box-sizing:border-box}.ae-sheet{width:min(92vw,520px);padding:28px;border:1px solid rgba(18,17,16,.2);background:#faf7f4}.ae-label{margin:0 0 8px;font-size:11px;letter-spacing:.14em;color:#c42a18}.ae-sheet h1{margin:0 0 20px;font-size:26px;line-height:1.2}.ae-grid{display:grid;border-top:1px solid rgba(18,17,16,.16)}.ae-item{text-align:left;padding:14px 0;border:0;border-bottom:1px solid rgba(18,17,16,.16);background:transparent;color:inherit;cursor:pointer;display:grid;gap:6px;font:inherit}.ae-item span{font-weight:600}.ae-item small{color:#57534e;display:none}.ae-item[aria-expanded='true'] small{display:block}",
      },
      {
        path: 'app.js',
        language: 'javascript',
        content:
          "document.querySelectorAll('.ae-item').forEach((btn)=>{btn.addEventListener('click',()=>{const open=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',String(!open));});});",
      },
    ],
  },
  {
    id: 'hms-luminex',
    title: 'Luminex Surface Lighting',
    category: 'Hiệu ứng ánh sáng',
    source: 'motionsites',
    gifUrl: 'https://motionsites.ai/assets/hero-luminex-preview-CxOP7ce6.gif',
    fallbackUrl:
      'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-liquid-glass-button.png',
    liveUrl: 'https://motionsites.ai/sections#luminex',
    summaryVi:
      'Thẻ kính mờ quét điểm sáng theo vị trí con trỏ với viền bo khít không tràn góc.',
    motionConfig: {
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      durationMs: 320,
      pattern: 'Radial Spotlight Mask',
      reducedFallback: 'Giữ quầng sáng tĩnh ở góc trên bên phải',
    },
    files: [
      {
        path: 'index.html',
        language: 'html',
        content:
          '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Luminex Surface</title><link rel="stylesheet" href="styles.css"></head><body><article class="lx-card" id="lxCard"><div class="lx-spot" aria-hidden="true"></div><span class="lx-kicker">CHIẾU SÁNG BỀ MẶT</span><h2>Kính mờ bám góc chuẩn</h2><p>Di chuyển con trỏ qua thẻ để quan sát quầng sáng phản chiếu theo biến CSS --lx-x và --lx-y.</p></article><script src="app.js"></script></body></html>',
      },
      {
        path: 'styles.css',
        language: 'css',
        content:
          ":root{--lx-x:72%;--lx-y:24%}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#121110;color:#f1ecea;font-family:'Be Vietnam Pro',system-ui,sans-serif;padding:20px;box-sizing:border-box}.lx-card{position:relative;width:min(92vw,440px);padding:28px;border-radius:22px;overflow:hidden;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.04);backdrop-filter:blur(16px)}.lx-spot{position:absolute;inset:0;background:radial-gradient(240px circle at var(--lx-x) var(--lx-y),rgba(186,217,230,.24),transparent 70%);pointer-events:none}.lx-kicker{font-size:11px;letter-spacing:.12em;color:#ddad95}.lx-card h2{margin:10px 0 8px;font-size:22px}.lx-card p{margin:0;font-size:14px;line-height:1.6;color:#c7c1bc}",
      },
      {
        path: 'app.js',
        language: 'javascript',
        content:
          "const card=document.getElementById('lxCard');const rm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(card&&!rm){card.addEventListener('pointermove',(e)=>{const r=card.getBoundingClientRect();card.style.setProperty('--lx-x',`${((e.clientX-r.left)/r.width)*100}%`);card.style.setProperty('--lx-y',`${((e.clientY-r.top)/r.height)*100}%`);});}",
      },
    ],
  },
];
