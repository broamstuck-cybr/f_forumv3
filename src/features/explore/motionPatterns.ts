/**
 * Thư viện chuyển động thật cho nhóm "Chuyển động" của Bàn soi.
 *
 * Mỗi mẫu dưới đây là một tài liệu HTML/CSS/JS độc lập chạy trong iframe
 * sandbox — không ảnh, không video, không liên kết ra ngoài. Người dùng kéo,
 * bấm, gõ thử được đúng như bản gốc; mã nguồn hiển thị trong ngăn bên cạnh
 * chính là mã đang chạy, không phải bản mô tả.
 */

export type MotionPatternId =
  | 'pointer-parallax'
  | 'stagger-reveal'
  | 'magnetic-cta'
  | 'marquee-loop'
  | 'split-headline'
  | 'cursor-spotlight'
  | 'tilt-card'
  | 'progress-rail';

export interface MotionPattern {
  id: MotionPatternId;
  label: string;
  hint: string;
  keyboard: string;
}

export const MOTION_PATTERNS: MotionPattern[] = [
  {
    id: 'pointer-parallax',
    label: 'Lớp nổi theo con trỏ',
    hint: 'Rê chuột hoặc nghiêng điện thoại để thấy các lớp tách nhau.',
    keyboard: 'Dùng phím mũi tên để nghiêng khung.',
  },
  {
    id: 'stagger-reveal',
    label: 'Hiện lần lượt',
    hint: 'Bấm để phát lại nhịp xuất hiện của từng dòng.',
    keyboard: 'Enter để phát lại.',
  },
  {
    id: 'magnetic-cta',
    label: 'Nút hút theo tay',
    hint: 'Đưa con trỏ lại gần nút, nút tự nghiêng về phía tay bạn.',
    keyboard: 'Focus nút rồi bấm Enter.',
  },
  {
    id: 'marquee-loop',
    label: 'Dải chạy vô tận',
    hint: 'Rê vào để dải chậm lại, rê ra để chạy tiếp.',
    keyboard: 'Space để tạm dừng.',
  },
  {
    id: 'split-headline',
    label: 'Tiêu đề tách lớp',
    hint: 'Bấm để chữ tách thành hai lớp rồi khớp lại.',
    keyboard: 'Enter để phát lại.',
  },
  {
    id: 'cursor-spotlight',
    label: 'Đèn rọi con trỏ',
    hint: 'Di chuyển để soi từng vùng tối.',
    keyboard: 'Phím mũi tên để dịch đèn.',
  },
  {
    id: 'tilt-card',
    label: 'Thẻ nghiêng ba chiều',
    hint: 'Kéo trên thẻ để nghiêng theo hướng tay.',
    keyboard: 'Phím mũi tên để nghiêng.',
  },
  {
    id: 'progress-rail',
    label: 'Thanh tiến trình có nhịp',
    hint: 'Cuộn trong khung để thấy thanh chạy theo.',
    keyboard: 'PageDown để cuộn.',
  },
];

const BASE_CSS = `
:root{--ink:#f4f1ea;--muted:#a9ada8;--bg:#0e0f0d;--raised:#181a17;--accent:#e2703f;--line:rgba(244,241,234,.14)}
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
 display:flex;align-items:center;justify-content:center;padding:24px;overflow:hidden}
.stage{width:100%;max-width:560px;position:relative}
.kicker{margin:0 0 14px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
h1{margin:0 0 12px;font-size:clamp(22px,4.4vw,32px);line-height:1.18;letter-spacing:-.02em}
p{margin:0 0 18px;font-size:14px;line-height:1.65;color:var(--muted)}
.btn{appearance:none;border:1px solid var(--line);background:transparent;color:var(--ink);
 padding:12px 20px;border-radius:999px;font:inherit;font-weight:600;font-size:14px;cursor:pointer;
 transition:transform .22s cubic-bezier(.2,.9,.2,1),background-color .22s ease,color .22s ease}
.btn:hover,.btn:focus-visible{background:var(--accent);border-color:var(--accent);color:#17130f}
.btn:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
.panel{border:1px solid var(--line);border-radius:16px;background:var(--raised);padding:18px}
.hintbar{margin-top:14px;font-size:12px;color:var(--muted);display:flex;gap:8px;align-items:center}
.dot{width:6px;height:6px;border-radius:50%;background:var(--accent);flex:none}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

interface PatternDoc {
  html: string;
  css: string;
  js: string;
}

function doc(html: string, css: string, js: string): string {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${BASE_CSS}${css}</style></head><body>${html}
<script>${js}<\/script></body></html>`;
}

/* ── 01 · Pointer parallax: ba lớp dịch theo quỹ đạo con trỏ ── */
function pointerParallax(): string {
  return doc(
    `<main class="stage px" id="stage">
  <div class="px-layer px-l3" aria-hidden="true"></div>
  <div class="px-layer px-l2" aria-hidden="true"></div>
  <div class="px-layer px-l1" aria-hidden="true"></div>
  <div class="px-content">
    <p class="kicker">Chương 01 · Quỹ đạo</p>
    <h1>Ba lớp, một hướng tay</h1>
    <p id="pxCopy">Rê con trỏ trong khung: lớp xa nhất gần như đứng yên, lớp gần đi theo tay bạn.</p>
    <button class="btn" type="button" id="pxReset">Về giữa</button>
  </div>
</main>`,
    `.px{min-height:300px;display:grid;place-items:center}
.px-layer{position:absolute;border-radius:50%;filter:blur(22px);will-change:transform}
.px-l1{width:190px;height:190px;left:4%;top:8%;background:radial-gradient(circle,rgba(226,112,63,.55),transparent 70%)}
.px-l2{width:240px;height:240px;right:2%;bottom:-6%;background:radial-gradient(circle,rgba(122,164,196,.42),transparent 70%)}
.px-l3{width:300px;height:300px;left:22%;top:-14%;background:radial-gradient(circle,rgba(244,241,234,.14),transparent 72%)}
.px-content{position:relative;z-index:2;text-align:center;max-width:420px}`,
    `(function(){
  var stage=document.getElementById('stage');
  var layers=[[document.querySelector('.px-l3'),8],[document.querySelector('.px-l2'),18],[document.querySelector('.px-l1'),34]];
  var tx=0,ty=0,cx=0,cy=0,raf=0;
  function tick(){
    cx+=(tx-cx)*0.08; cy+=(ty-cy)*0.08;
    layers.forEach(function(pair){ var el=pair[0],d=pair[1];
      if(el) el.style.transform='translate3d('+(cx*d).toFixed(2)+'px,'+(cy*d).toFixed(2)+'px,0)'; });
    raf=requestAnimationFrame(tick);
  }
  function onMove(e){
    var r=stage.getBoundingClientRect();
    var px=(e.clientX-r.left)/r.width-0.5, py=(e.clientY-r.top)/r.height-0.5;
    tx=px*22; ty=py*22;
  }
  stage.addEventListener('pointermove',onMove);
  stage.addEventListener('pointerleave',function(){tx=0;ty=0;});
  stage.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft')tx-=4; if(e.key==='ArrowRight')tx+=4;
    if(e.key==='ArrowUp')ty-=4; if(e.key==='ArrowDown')ty+=4;
  });
  stage.setAttribute('tabindex','0');
  document.getElementById('pxReset').addEventListener('click',function(){tx=0;ty=0;});
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches) raf=requestAnimationFrame(tick);
})();`
  );
}

/* ── 02 · Stagger reveal: từng dòng hiện lệch nhịp ── */
function staggerReveal(): string {
  return doc(
    `<main class="stage">
  <p class="kicker">Chương 02 · Nhịp đọc</p>
  <h1>Đừng đổ hết một lúc</h1>
  <div class="panel">
    <ul class="st-list" id="stList">
      <li style="--i:0">Dòng đầu đặt đúng chỗ để mắt dừng lại.</li>
      <li style="--i:1">Dòng sau lệch một nhịp ngắn — vừa đủ để đọc kịp.</li>
      <li style="--i:2">Dòng cuối dẫn tới hành động, không phải trang trí.</li>
    </ul>
  </div>
  <div class="hintbar"><span class="dot" aria-hidden="true"></span><span id="stState">Đang chạy nhịp 1 · 2 · 3</span></div>
  <button class="btn" type="button" id="stReplay" style="margin-top:14px">Phát lại</button>
</main>`,
    `.st-list{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.st-list li{border-left:2px solid var(--accent);padding:10px 0 10px 14px;font-size:14px;line-height:1.6;
 opacity:0;transform:translateY(12px);animation:stIn .52s cubic-bezier(.2,.9,.2,1) forwards;
 animation-delay:calc(var(--i) * 140ms)}
@keyframes stIn{to{opacity:1;transform:none}}`,
    `(function(){
  var list=document.getElementById('stList'), btn=document.getElementById('stReplay'), state=document.getElementById('stState');
  function play(){
    list.classList.remove('is-play');
    void list.offsetWidth;
    Array.prototype.forEach.call(list.children,function(li,idx){
      li.style.animation='none';
      void li.offsetWidth;
      li.style.animation='';
      li.style.animationDelay=(idx*140)+'ms';
    });
    state.textContent='Đang chạy nhịp 1 · 2 · 3';
    setTimeout(function(){state.textContent='Xong — bấm để xem lại';},900);
  }
  btn.addEventListener('click',play);
  window.addEventListener('keydown',function(e){ if(e.key==='Enter') play(); });
})();`
  );
}

/* ── 03 · Magnetic CTA: nút bị hút về phía con trỏ ── */
function magneticCta(): string {
  return doc(
    `<main class="stage" style="text-align:center">
  <p class="kicker">Chương 03 · Điểm chạm</p>
  <h1>Nút nghiêng về phía tay bạn</h1>
  <p>Đưa con trỏ lại gần — nút tự dịch một chút rồi trả về khi bạn rời đi.</p>
  <div class="mag-wrap">
    <button class="btn mag" type="button" id="magBtn">Bắt đầu thử</button>
  </div>
  <div class="hintbar" style="justify-content:center"><span class="dot" aria-hidden="true"></span><span id="magState">Chưa tương tác</span></div>
</main>`,
    `.mag-wrap{display:grid;place-items:center;padding:26px 0 8px}
.mag{min-width:176px;will-change:transform}
.mag.is-hot{background:var(--accent);border-color:var(--accent);color:#17130f}`,
    `(function(){
  var btn=document.getElementById('magBtn'), state=document.getElementById('magState');
  var R=110, tx=0, ty=0, cx=0, cy=0;
  function loop(){ cx+=(tx-cx)*0.18; cy+=(ty-cy)*0.18;
    btn.style.transform='translate3d('+cx.toFixed(2)+'px,'+cy.toFixed(2)+'px,0)';
    requestAnimationFrame(loop); }
  document.addEventListener('pointermove',function(e){
    var r=btn.getBoundingClientRect();
    var mx=r.left+r.width/2, my=r.top+r.height/2;
    var dx=e.clientX-mx, dy=e.clientY-my, dist=Math.hypot(dx,dy);
    if(dist<R){ var pull=(1-dist/R); tx=dx*pull*0.42; ty=dy*pull*0.42; btn.classList.add('is-hot');
      state.textContent='Trong vùng hút · '+Math.round(dist)+'px'; }
    else { tx=0; ty=0; btn.classList.remove('is-hot'); state.textContent='Ngoài vùng hút'; }
  });
  document.addEventListener('pointerleave',function(){tx=0;ty=0;});
  btn.addEventListener('focus',function(){state.textContent='Đang focus bằng bàn phím';});
  btn.addEventListener('blur',function(){state.textContent='Chưa tương tác';});
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(loop);
})();`
  );
}

/* ── 04 · Marquee loop: dải chạy vô tận, rê vào thì chậm ── */
function marqueeLoop(): string {
  const items = ['Bàn soi', 'Workspace', 'Thư viện', 'Tủ hồ sơ', 'Bàn soi', 'Workspace', 'Thư viện', 'Tủ hồ sơ'];
  const row = items.map((t) => `<span class="mq-item">${t}</span>`).join('');
  return doc(
    `<main class="stage">
  <p class="kicker">Chương 04 · Dải chạy</p>
  <h1>Chạy mãi mà không giật</h1>
  <p>Hai bản sao nối tiếp nhau nên không có điểm nối. Rê vào để giảm tốc, bấm Space để dừng.</p>
  <div class="mq" id="mq" tabindex="0" aria-label="Dải chạy, rê vào để giảm tốc">
    <div class="mq-track">${row}${row}</div>
  </div>
  <div class="hintbar"><span class="dot" aria-hidden="true"></span><span id="mqState">Tốc độ 1×</span></div>
</main>`,
    `.mq{overflow:hidden;border-block:1px solid var(--line);padding:14px 0;cursor:ew-resize}
.mq-track{display:flex;gap:34px;width:max-content;animation:mqRun 16s linear infinite}
.mq:hover .mq-track,.mq:focus-visible .mq-track{animation-duration:34s}
.mq.is-paused .mq-track{animation-play-state:paused}
.mq-item{font-size:20px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;color:var(--ink)}
.mq-item:nth-child(even){color:var(--muted)}
@keyframes mqRun{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}`,
    `(function(){
  var mq=document.getElementById('mq'), state=document.getElementById('mqState');
  mq.addEventListener('pointerenter',function(){state.textContent='Đang giảm tốc';});
  mq.addEventListener('pointerleave',function(){state.textContent='Tốc độ 1×';});
  window.addEventListener('keydown',function(e){
    if(e.code==='Space' && document.activeElement===mq){ e.preventDefault();
      mq.classList.toggle('is-paused');
      state.textContent=mq.classList.contains('is-paused')?'Đã tạm dừng':'Tốc độ 1×'; }
  });
})();`
  );
}

/* ── 05 · Split headline: chữ tách hai lớp rồi khớp ── */
function splitHeadline(): string {
  return doc(
    `<main class="stage">
  <p class="kicker">Chương 05 · Chữ tách lớp</p>
  <h1 class="split" id="splitHead">
    <span class="split-a" data-txt="Ý tưởng thành">Ý tưởng thành</span>
    <span class="split-b" data-txt="giao diện thật">giao diện thật</span>
  </h1>
  <p>Hai lớp chữ lệch màu chạy ngược nhau rồi khớp lại đúng vị trí đọc.</p>
  <button class="btn" type="button" id="splitPlay">Tách lớp</button>
</main>`,
    `.split{display:grid;gap:2px;font-size:clamp(26px,5.4vw,40px);line-height:1.1}
.split-a,.split-b{position:relative;display:inline-block;transition:transform .5s cubic-bezier(.2,.9,.2,1),color .5s ease}
.split-a::after,.split-b::after{content:attr(data-txt);position:absolute;inset:0;pointer-events:none;
 opacity:.0;transition:opacity .5s ease,transform .5s cubic-bezier(.2,.9,.2,1)}
.split-a::after{color:var(--accent);transform:translate(5px,-4px)}
.split-b::after{color:#7aa4c4;transform:translate(-5px,4px)}
.split.is-open .split-a{transform:translate(-4px,0)}
.split.is-open .split-b{transform:translate(4px,0)}
.split.is-open .split-a::after,.split.is-open .split-b::after{opacity:.9}`,
    `(function(){
  var head=document.getElementById('splitHead'), btn=document.getElementById('splitPlay');
  function toggle(){
    head.classList.add('is-open');
    setTimeout(function(){head.classList.remove('is-open');},760);
  }
  btn.addEventListener('click',toggle);
  window.addEventListener('keydown',function(e){if(e.key==='Enter')toggle();});
})();`
  );
}

/* ── 06 · Cursor spotlight: đèn rọi theo con trỏ ── */
function cursorSpotlight(): string {
  return doc(
    `<main class="stage sp" id="sp" tabindex="0">
  <div class="sp-dark" aria-hidden="true"></div>
  <div class="sp-lamp" id="spLamp" aria-hidden="true"></div>
  <div class="sp-content">
    <p class="kicker">Chương 06 · Ánh sáng</p>
    <h1>Soi đúng chỗ cần đọc</h1>
    <p>Vùng tối không che nội dung — nó chỉ dồn sự chú ý về nơi con trỏ đang đứng.</p>
    <button class="btn" type="button" id="spButton">Nút vẫn bấm được</button>
  </div>
</main>`,
    `.sp{min-height:300px;display:grid;place-items:center;overflow:hidden;cursor:crosshair}
.sp-dark{position:absolute;inset:0;background:radial-gradient(circle 170px at var(--x,50%) var(--y,50%),transparent 0%,rgba(6,7,6,.86) 62%,rgba(6,7,6,.96) 100%)}
.sp-lamp{position:absolute;left:var(--x,50%);top:var(--y,50%);width:220px;height:220px;transform:translate(-50%,-50%);
 border-radius:50%;border:1px solid rgba(226,112,63,.5);pointer-events:none;opacity:.7}
.sp-content{position:relative;z-index:2;text-align:center;max-width:400px}`,
    `(function(){
  var sp=document.getElementById('sp');
  function set(x,y){ sp.style.setProperty('--x',x+'px'); sp.style.setProperty('--y',y+'px'); }
  sp.addEventListener('pointermove',function(e){ var r=sp.getBoundingClientRect(); set(e.clientX-r.left,e.clientY-r.top); });
  sp.addEventListener('keydown',function(e){
    var x=parseFloat(sp.style.getPropertyValue('--x'))||sp.clientWidth/2;
    var y=parseFloat(sp.style.getPropertyValue('--y'))||sp.clientHeight/2;
    if(e.key==='ArrowLeft')x-=16; if(e.key==='ArrowRight')x+=16;
    if(e.key==='ArrowUp')y-=16; if(e.key==='ArrowDown')y+=16;
    set(x,y);
  });
  var r=sp.getBoundingClientRect(); set(r.width/2,r.height/2);
})();`
  );
}

/* ── 07 · Tilt card: thẻ nghiêng theo hướng kéo ── */
function tiltCard(): string {
  return doc(
    `<main class="stage" style="text-align:center">
  <p class="kicker">Chương 07 · Bề mặt</p>
  <h1>Thẻ nghiêng theo tay</h1>
  <div class="tc-wrap">
    <article class="tc" id="tc" tabindex="0" aria-label="Thẻ nghiêng, kéo để xoay">
      <span class="tc-tag">Bản dựng</span>
      <strong class="tc-title">Mặt phẳng có chiều sâu</strong>
      <span class="tc-note">Góc nghiêng bám theo con trỏ, ánh sáng trượt theo cùng hướng.</span>
    </article>
  </div>
  <div class="hintbar" style="justify-content:center"><span class="dot" aria-hidden="true"></span><span id="tcState">0° · 0°</span></div>
</main>`,
    `.tc-wrap{perspective:900px;display:grid;place-items:center;padding:18px 0}
.tc{position:relative;width:min(340px,86vw);padding:22px;border-radius:16px;border:1px solid var(--line);
 background:linear-gradient(150deg,rgba(226,112,63,.16),rgba(24,26,23,.96) 55%);
 transform-style:preserve-3d;transition:transform .16s ease-out;text-align:left}
.tc::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
 background:radial-gradient(circle at var(--mx,50%) var(--my,20%),rgba(244,241,234,.16),transparent 60%)}
.tc-tag{display:block;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin-bottom:10px}
.tc-title{display:block;font-size:19px;margin-bottom:8px}
.tc-note{display:block;font-size:13px;line-height:1.6;color:var(--muted)}`,
    `(function(){
  var card=document.getElementById('tc'), state=document.getElementById('tcState');
  var rx=0,ry=0;
  function apply(){
    card.style.transform='rotateX('+rx.toFixed(1)+'deg) rotateY('+ry.toFixed(1)+'deg) translateZ(0)';
    state.textContent=rx.toFixed(0)+'° · '+ry.toFixed(0)+'°';
  }
  card.addEventListener('pointermove',function(e){
    var r=card.getBoundingClientRect();
    var px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
    ry=(px-0.5)*18; rx=(0.5-py)*14;
    card.style.setProperty('--mx',(px*100).toFixed(1)+'%');
    card.style.setProperty('--my',(py*100).toFixed(1)+'%');
    apply();
  });
  card.addEventListener('pointerleave',function(){rx=0;ry=0;apply();});
  card.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft')ry-=3; if(e.key==='ArrowRight')ry+=3;
    if(e.key==='ArrowUp')rx-=3; if(e.key==='ArrowDown')rx+=3;
    if(e.key.indexOf('Arrow')===0){e.preventDefault();apply();}
  });
  card.addEventListener('blur',function(){rx=0;ry=0;apply();});
  apply();
})();`
  );
}

/* ── 08 · Progress rail: thanh tiến trình theo cuộn ── */
function progressRail(): string {
  return doc(
    `<main class="stage">
  <div class="pr-head">
    <p class="kicker" style="margin:0">Chương 08 · Tiến trình</p>
    <span class="pr-num" id="prNum">0%</span>
  </div>
  <div class="pr-rail" aria-hidden="true"><span class="pr-fill" id="prFill"></span></div>
  <div class="pr-scroll" id="prScroll" tabindex="0" aria-label="Cuộn để xem thanh tiến trình">
    <h2>Đọc theo nhịp</h2>
    <p>Thanh trên đầu chạy theo đúng phần bạn đã đọc, không phải theo thời gian.</p>
    <p>Cuộn tiếp trong khung. Mỗi đoạn một ý, để mắt không phải quay lại tìm chỗ cũ.</p>
    <p>Khi chạm đáy, thanh đầy và con số dừng ở 100%.</p>
    <p>Đây là cùng một cơ chế dùng cho trang dài: người đọc biết mình đang ở đâu.</p>
  </div>
</main>`,
    `.pr-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.pr-num{font-variant-numeric:tabular-nums;font-size:12px;color:var(--accent)}
.pr-rail{height:4px;border-radius:999px;background:rgba(244,241,234,.12);overflow:hidden;margin-bottom:14px}
.pr-fill{display:block;height:100%;width:0;background:var(--accent);transition:width .12s linear}
.pr-scroll{max-height:190px;overflow-y:auto;border:1px solid var(--line);border-radius:14px;padding:16px;background:var(--raised)}
.pr-scroll h2{margin:0 0 10px;font-size:17px}
.pr-scroll p{margin:0 0 12px;font-size:13.5px;line-height:1.65;color:var(--muted)}`,
    `(function(){
  var box=document.getElementById('prScroll'), fill=document.getElementById('prFill'), num=document.getElementById('prNum');
  function paint(){
    var max=box.scrollHeight-box.clientHeight;
    var p=max>0?Math.min(1,Math.max(0,box.scrollTop/max)):0;
    fill.style.width=(p*100).toFixed(1)+'%';
    num.textContent=Math.round(p*100)+'%';
  }
  box.addEventListener('scroll',paint,{passive:true});
  paint();
  box.addEventListener('keydown',function(e){ if(e.key==='PageDown'){ e.preventDefault(); box.scrollTop+=60; }});
})();`
  );
}

const BUILDERS: Record<MotionPatternId, () => string> = {
  'pointer-parallax': pointerParallax,
  'stagger-reveal': staggerReveal,
  'magnetic-cta': magneticCta,
  'marquee-loop': marqueeLoop,
  'split-headline': splitHeadline,
  'cursor-spotlight': cursorSpotlight,
  'tilt-card': tiltCard,
  'progress-rail': progressRail,
};

const cache = new Map<MotionPatternId, PatternDoc>();

/** Mã nguồn thật của một pattern, tách ba ngăn để hiển thị cạnh khung chạy. */
export function getMotionPatternDoc(id: MotionPatternId): PatternDoc {
  const existing = cache.get(id);
  if (existing) return existing;
  const full = BUILDERS[id]();
  const headEnd = full.indexOf('</style>');
  const css = full.slice(full.indexOf('<style>') + 7, headEnd);
  const bodyStart = full.indexOf('</head><body>') + '</head><body>'.length;
  const bodyEnd = full.lastIndexOf('<script>');
  const html = full.slice(bodyStart, bodyEnd);
  const js = full.slice(bodyEnd + 8, full.lastIndexOf('</script>'));
  const out = { html: html.trim(), css: css.replace(BASE_CSS, '').trim(), js: js.replace(/<\/script>$/, '').trim() };
  cache.set(id, out);
  return out;
}

/** Tài liệu hoàn chỉnh để đổ vào iframe sandbox. */
export function buildMotionPatternDocument(id: MotionPatternId, theme: 'dark' | 'light'): string {
  const base = BUILDERS[id]();
  if (theme === 'dark') return base;
  /* Chế độ sáng: đổi bảng màu gốc, giữ nguyên toàn bộ chuyển động. */
  return base
    .replace('--ink:#f4f1ea', '--ink:#151412')
    .replace('--muted:#a9ada8', '--muted:#5c5a54')
    .replace('--bg:#0e0f0d', '--bg:#f7f4ed')
    .replace('--raised:#181a17', '--raised:#fffdf8')
    .replace('--line:rgba(244,241,234,.14)', '--line:rgba(21,20,18,.14)')
    .replace('rgba(244,241,234,.12)', 'rgba(21,20,18,.12)')
    .replace('rgba(24,26,23,.96)', 'rgba(255,253,248,.96)')
    .replace('rgba(6,7,6,.86)', 'rgba(247,244,237,.86)')
    .replace('rgba(6,7,6,.96)', 'rgba(247,244,237,.96)')
    .replace('rgba(244,241,234,.16)', 'rgba(21,20,18,.16)')
    .replace('rgba(244,241,234,.14)', 'rgba(21,20,18,.14)')
    .replace('color:#17130f', 'color:#fffaf4')
    .replace("'#17130f'", "'#fffaf4'");
}

/**
 * Gợi ý pattern sát nhất với một mục trong catalog.
 *
 * Phần lớn mục "Chuyển động" dùng chung bộ nhãn (motion/layout/landing-page),
 * nên nếu chỉ dựa vào nhãn thì 33/35 mục rơi vào cùng một pattern. Vì vậy luật
 * ở đây ưu tiên đọc *tên và danh mục thật* trước, nhãn chỉ là lớp phụ — mỗi
 * tên mục phải phân biệt được với tên khác, không dùng ngẫu nhiên.
 */
export function suggestPatternFor(tags: string[], category: string, title: string): MotionPatternId {
  const name = `${title} ${category}`.toLowerCase();
  const tagline = tags.join(' ').toLowerCase();

  /* Luật theo tên/danh mục — dấu hiệu mạnh nhất. */
  if (/spotlight|glow|cyber|cybersecur|retro|portal|epoch|reveal/.test(name)) return 'cursor-spotlight';
  if (/marquee|logo|strip|ticker|ocean|odyssey|voyage|network/.test(name)) return 'marquee-loop';
  if (/tilt|card|3d|vertex|datacore|booking|control|builder|platform|dashboard/.test(name)) return 'tilt-card';
  if (/scroll|progress|story|stillmind|equilibrium|calculator/.test(name)) return 'progress-rail';
  if (/split|headline|portfolio|bold studio|velorah|agency|type|creative/.test(name)) return 'split-headline';
  if (/cta|button|magnetic|pricing|benefit|impact|ventures/.test(name)) return 'magnetic-cta';
  if (/benefit|list|feature|taskly|nexacore|guardnet|email/.test(name)) return 'stagger-reveal';
  if (/hero|landing|ecommerce|organic|bloom|intelligent|prosthetics|audio|camper|cozypaws/.test(name)) {
    return 'pointer-parallax';
  }

  /* Lớp phụ: nhãn chi tiết hơn, dùng khi tên không đủ gợi ý. */
  if (/cursor|spotlight/.test(tagline)) return 'cursor-spotlight';
  if (/marquee|logo|loop/.test(tagline)) return 'marquee-loop';
  if (/tilt|perspective|3d/.test(tagline)) return 'tilt-card';
  if (/scroll|progress/.test(tagline)) return 'progress-rail';
  if (/split|type/.test(tagline)) return 'split-headline';
  if (/pricing|button/.test(tagline)) return 'magnetic-cta';
  if (/benefits|features/.test(tagline)) return 'stagger-reveal';
  return 'pointer-parallax';
}
