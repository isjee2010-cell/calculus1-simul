/* ===== 미적분Ⅰ 시뮬레이터 공통 UI (상단 바·글자 크기·발표 모드·기록 지우기·용어 툴팁·물결·축하·방울) =====
   shared/ui.js : 17개 앱이 <script id="pz-ui" src="../shared/ui.js"></script> 로 불러오는 단 하나의 공통 스크립트.
   앱 <head>에서 pz-meta(JSON) 바로 뒤, 앱 스크립트보다 앞에 둔다. 공통 UI를 고칠 때는 이 파일만 고친다.
   pz-meta 의 "store": [...] 에 적은 localStorage 키는 상단 바 '기록 지우기'가 지운다(글자 크기 설정은 남김).
   용어 사전의 수식은 \( … \) 안의 TeX로 쓰고 KaTeX로 그린다(앱에 KaTeX가 없으면 툴팁을 처음 열 때 불러온다).
   앱에서 쓸 수 있는 API:
     PastelUI.color('--pz-f')        → CSS 변수의 실제 색 문자열 (캔버스 그리기용)
     PastelUI.celebrate('tab3', '🎉 완료!') → 같은 key는 한 페이지에서 한 번만 컨페티
     PastelUI.toast('메시지')        → 아래쪽 작은 알림 (2.4초)
     PastelUI.fade(el)               → el을 부드럽게 나타나게 (탭 전환 때 호출)
     PastelUI.glossary               → 용어 툴팁 사전 (data-tip="키")
   이 스크립트는 <head>에서 실행되므로 앱 스크립트가 처음 그릴 때도 PastelUI.color를 쓸 수 있다(화면 꾸미기는 DOMContentLoaded에).
   CSS 변수 --pz-avail-h: #pz-main 안 기준으로 상단 바 아래 남은 화면 높이(글자 크기 배율 반영). 그래프 최대 높이에 사용.
   이벤트: 글자 크기를 바꾸면 window 'resize' 이벤트를 보내 앱이 그래프를 다시 그리게 한다. */
(function(){
  'use strict';
  if (window.PastelUI) return;
  var PREF_KEY = 'calc1Ui:prefs';
  var ZOOMS = [1, 1.15, 1.3];
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var glossary = {
    '극한값': 'x가 a가 아니면서 a에 한없이 가까워질 때 f(x)가 일정한 값 L에 한없이 가까워지면, L을 <b>극한값</b>이라 해요. 기호: \\(\\lim\\limits_{x\\to a} f(x)=L\\)',
    '좌극한': 'x가 a보다 <b>작은</b> 값을 가지면서 a에 한없이 가까워질 때 f(x)가 가까워지는 값. 기호: \\(\\lim\\limits_{x\\to a-} f(x)\\)',
    '우극한': 'x가 a보다 <b>큰</b> 값을 가지면서 a에 한없이 가까워질 때 f(x)가 가까워지는 값. 기호: \\(\\lim\\limits_{x\\to a+} f(x)\\)',
    '수렴': 'f(x)가 일정한 값에 한없이 가까워지는 것.',
    '발산': '수렴하지 않는 것. 한없이 커지거나(∞) 작아지거나(−∞), 어느 값에도 가까워지지 않는 경우예요.',
    '연속': 'x=a에서 ① f(a)가 정의되고 ② 극한값 \\(\\lim\\limits_{x\\to a} f(x)\\)가 존재하며 ③ 두 값이 같을 때, f(x)는 x=a에서 <b>연속</b>이에요.',
    '불연속': 'x=a에서 연속이 아닌 것. 연속의 세 조건 중 하나라도 성립하지 않아요.',
    '평균변화율': 'x가 a에서 b까지 변할 때 \\(\\dfrac{f(b)-f(a)}{b-a}\\). 두 점을 잇는 <b>할선의 기울기</b>와 같아요.',
    '미분계수': '\\(f\'(a)=\\lim\\limits_{h\\to 0}\\dfrac{f(a+h)-f(a)}{h}\\). x=a에서의 <b>순간변화율</b>이고, 그 점에서 그은 <b>접선의 기울기</b>예요.',
    '순간변화율': '평균변화율에서 구간의 길이를 0에 한없이 가깝게 할 때의 극한값. 미분계수와 같아요.',
    '미분가능': 'x=a에서 미분계수 f′(a)가 존재하는 것. 미분가능하면 그 점에서 연속이에요(역은 성립하지 않아요).',
    '도함수': '각 x에 그 점의 미분계수 f′(x)를 대응시킨 함수. \\(f\'(x)=\\lim\\limits_{h\\to 0}\\dfrac{f(x+h)-f(x)}{h}\\)',
    '할선': '곡선 위의 <b>두 점</b>을 지나는 직선.',
    '접선': '곡선 위의 한 점에서 곡선에 접하는 직선. 기울기는 그 점의 미분계수 f′(a)예요.',
    '증가': '어떤 구간의 임의의 x₁ < x₂에 대하여 f(x₁) < f(x₂)이면, f(x)는 그 구간에서 <b>증가</b>해요.',
    '감소': '어떤 구간의 임의의 x₁ < x₂에 대하여 f(x₁) > f(x₂)이면, f(x)는 그 구간에서 <b>감소</b>해요.',
    '극대': 'x=a를 포함하는 어떤 열린구간의 모든 x에서 f(x) ≤ f(a)이면 x=a에서 <b>극대</b>, f(a)를 <b>극댓값</b>이라 해요.',
    '극소': 'x=a를 포함하는 어떤 열린구간의 모든 x에서 f(x) ≥ f(a)이면 x=a에서 <b>극소</b>, f(a)를 <b>극솟값</b>이라 해요.',
    '극값': '극댓값과 극솟값을 통틀어 이르는 말.',
    '평균값 정리': 'f(x)가 닫힌구간 [a, b]에서 연속이고 열린구간 (a, b)에서 미분가능하면, \\(\\dfrac{f(b)-f(a)}{b-a}=f\'(c)\\)인 c가 (a, b)에 적어도 하나 있어요.',
    '롤의 정리': 'f(x)가 [a, b]에서 연속, (a, b)에서 미분가능하고 f(a) = f(b)이면, f′(c) = 0인 c가 (a, b)에 적어도 하나 있어요.',
    '속도': '위치 x(t)의 순간변화율 v(t) = x′(t). 부호가 운동 방향을 알려 줘요(+는 양의 방향, −는 음의 방향).',
    '속력': '속도의 절댓값 |v(t)|. 방향 없이 빠르기만 나타내요.',
    '가속도': '속도 v(t)의 순간변화율 a(t) = v′(t).',
    '부정적분': 'F′(x) = f(x)일 때 F(x)를 f(x)의 <b>부정적분</b>이라 하고 ∫ f(x) dx = F(x) + C로 나타내요.',
    '적분상수': '부정적분 F(x) + C의 상수 C. 도함수가 같은 함수들은 상수만큼만 차이가 나요.',
    '정적분': '[a, b]에서 곡선 y = f(x)와 x축 사이의 넓이를, x축 위는 <b>양의 넓이</b>, 아래는 <b>음의 넓이</b>로 하여 더한 값. 기호: \\(\\int_a^b f(x)\\,dx\\)',
    '넓이 함수': '\\(S(x)=\\int_a^x f(t)\\,dt\\)처럼 위끝 x에 따라 정해지는 정적분 값을 x의 함수로 본 것.',
    '미적분학 기본정리': 'f(t)가 연속일 때 \\(S(x)=\\int_a^x f(t)\\,dt\\)이면 \\(S\'(x)=f(x)\\)예요. 미분과 적분이 서로 거꾸로의 관계임을 알려 줘요.',
    '위치의 변화량': '시각 a에서 b까지 위치가 변한 양: \\(\\int_a^b v(t)\\,dt\\) (방향을 바꾸면 서로 상쇄돼요).',
    '움직인 거리': '시각 a에서 b까지 실제로 움직인 거리: \\(\\int_a^b |v(t)|\\,dt\\) (항상 0 이상).'
  };

  function css(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function color(name){
    var v = css(name), guard = 0;
    while (/^var\(/.test(v) && guard++ < 6){ v = css(v.replace(/^var\(\s*|\s*\)$/g,'')); }
    return v || '#888';
  }
  function loadPrefs(){ try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch(e){ return {}; } }
  function savePrefs(p){ try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch(e){} }
  function el(tag, attrs, html){ var e = document.createElement(tag); if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function bump(){ requestAnimationFrame(function(){ window.dispatchEvent(new Event('resize')); }); }

  var meta = {};
  var prefs = loadPrefs();
  var zoom = ZOOMS.indexOf(prefs.zoom) >= 0 ? prefs.zoom : 1;
  var zoomBeforePresent = null;

  function updateAvail(){
    var bar = document.querySelector('.pz-topbar');
    var h = (window.innerHeight - (bar ? bar.offsetHeight : 0)) / (zoom || 1);
    document.documentElement.style.setProperty('--pz-avail-h', Math.max(200, Math.round(h)) + 'px');
  }
  function setZoom(z, silent){
    zoom = z;
    document.documentElement.style.setProperty('--pz-zoom', String(z));
    updateAvail();
    document.querySelectorAll('.pz-zoomset button[data-z]').forEach(function(b){ b.setAttribute('aria-pressed', String(+b.dataset.z === z)); });
    if (!silent){ prefs.zoom = z; savePrefs(prefs); }
    bump();
  }

  function buildTopbar(){
    var bar = el('header', {'class':'pz-topbar', role:'banner'});
    var unit = meta.unit || meta.slug || '';
    var home = meta.home || '../index.html';
    var guide = meta.guide || ('../guides/' + (meta.slug || '') + '.html');
    bar.innerHTML =
      (unit ? '<span class="pz-badge">' + unit + '</span>' : '') +
      '<span class="pz-title">' + (meta.title || document.title || '') + '</span>' +
      '<span class="pz-sp"></span>' +
      '<div class="pz-tb-group">' +
        '<div class="pz-zoomset" role="group" aria-label="글자 크기"><span class="pz-zl">글자</span>' +
          ZOOMS.map(function(z){ return '<button type="button" data-z="' + z + '" aria-pressed="false" title="글자 크기 ' + Math.round(z*100) + '%">' + (z===1?'가':z===1.15?'가+':'가++') + '</button>'; }).join('') +
        '</div>' +
        '<button type="button" class="pz-tb-btn" data-pz="present" aria-pressed="false" title="전체 화면으로 크게 (Esc로 해제)">⛶<span class="pz-tx"> 발표 모드</span></button>' +
        '<button type="button" class="pz-tb-btn" data-pz="clear" title="이 앱에서 푼 기록을 모두 지우고 처음 화면으로">⟲<span class="pz-tx"> 기록 지우기</span></button>' +
        '<a class="pz-tb-btn" href="' + guide + '" target="_blank" rel="noopener" title="이 시뮬레이터 사용법 (새 탭)">📖<span class="pz-tx"> 사용법</span></a>' +
        '<a class="pz-tb-btn" href="' + home + '" title="전체 시뮬레이터 목록으로">⌂<span class="pz-tx"> 전체 목록</span></a>' +
      '</div>';
    return bar;
  }

  function togglePresent(){
    var on = !document.documentElement.classList.contains('pz-present');
    if (on){
      zoomBeforePresent = zoom;
      document.documentElement.classList.add('pz-present');
      setZoom(Math.max(zoom, 1.15), true);
      var r = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      if (r && r.catch) r.catch(function(){});
    } else {
      exitPresent();
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function(){});
    }
    syncPresentBtn();
  }
  function exitPresent(){
    document.documentElement.classList.remove('pz-present');
    if (zoomBeforePresent != null){ setZoom(zoomBeforePresent, true); zoomBeforePresent = null; }
    syncPresentBtn();
  }
  function syncPresentBtn(){
    var b = document.querySelector('.pz-tb-btn[data-pz="present"]');
    if (b) b.setAttribute('aria-pressed', String(document.documentElement.classList.contains('pz-present')));
  }

  /* --- 수식(KaTeX) : 용어 사전의 \( … \) 부분 --- */
  var KATEX = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/';
  var katexWait = null;
  function hasTex(s){ return /\\\(/.test(s); }
  function escHTML(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function plainTex(t){   // KaTeX를 불러오는 동안 잠깐 보일 글자 표기
    return t.replace(/\\lim\\limits_\{([^{}]*)\}/g, 'lim($1) ')
            .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '{$1}/($2)')
            .replace(/\\int_(\w)\^(\w)/g, '∫($1→$2) ')
            .replace(/\\to/g, '→').replace(/\\,/g, ' ').replace(/\\displaystyle|\\left|\\right/g, '')
            .replace(/\\([a-zA-Z]+)/g, '$1');
  }
  function renderTex(s){
    return String(s).replace(/\\\(([\s\S]+?)\\\)/g, function(m, t){
      if (window.katex){ try { return katex.renderToString(t, {throwOnError:false}); } catch(e){} }
      return escHTML(plainTex(t));
    });
  }
  function loadKatex(cb){
    if (window.katex){ cb(); return; }
    if (katexWait){ katexWait.push(cb); return; }
    katexWait = [cb];
    var link = el('link', {rel:'stylesheet', href: KATEX + 'katex.min.css'}); document.head.appendChild(link);
    var sc = el('script', {src: KATEX + 'katex.min.js'});
    sc.onload = function(){ var w = katexWait; katexWait = []; w.forEach(function(f){ f(); }); };
    document.head.appendChild(sc);
  }

  /* --- 기록 지우기: pz-meta "store" 키만 지우고 다시 연다 (글자 크기 설정 calc1Ui:prefs 는 남김) --- */
  function clearRecords(){
    var msg = '이 앱에서 푼 기록과 저장한 내용을 모두 지우고 처음 화면으로 돌아갈까요?\n(글자 크기 설정은 그대로 둡니다)';
    if (!window.confirm(msg)) return;
    (meta.store || []).forEach(function(k){ try { localStorage.removeItem(k); } catch(e){} });
    location.reload();
  }

  /* --- 툴팁 --- */
  var tipEl = null, tipFor = null;
  function showTip(t){
    var key = t.getAttribute('data-tip') || t.textContent.trim();
    var text = glossary[key] || t.getAttribute('data-tip-text');
    if (!text) return;
    if (!tipEl){ tipEl = el('div', {'class':'pz-tip', role:'tooltip'}); document.body.appendChild(tipEl); }
    if (hasTex(text) && !window.katex) loadKatex(function(){ if (tipFor === t) showTip(t); });
    tipEl.innerHTML = '<b>' + key + '</b> — ' + renderTex(text);
    tipFor = t;
    var r = t.getBoundingClientRect();
    tipEl.style.left = '0px'; tipEl.style.top = '0px'; tipEl.classList.add('show');
    var w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    var x = Math.min(Math.max(8, r.left + r.width/2 - w/2), window.innerWidth - w - 8);
    var y = r.top - h - 10; if (y < 8) y = r.bottom + 10;
    tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
  }
  function hideTip(){ if (tipEl) tipEl.classList.remove('show'); tipFor = null; }
  function tipTarget(e){ return e.target && e.target.closest ? e.target.closest('.pz-term,[data-tip]') : null; }

  /* --- 물결 --- */
  function ripple(e){
    if (reduceMotion) return;
    var b = e.target.closest && e.target.closest('button,.pz-btn,.pz-tab,.pz-chip');
    if (!b || b.disabled || b.closest('.pz-zoomset')) return;
    var cs = getComputedStyle(b);
    if (cs.position === 'static' || cs.overflow === 'visible') return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2;
    var z = parseFloat(css('--pz-zoom')) || 1;
    var inMain = !!b.closest('#pz-main');
    var k = inMain ? z : 1;
    var sp = el('span', {'class':'pz-ripple'});
    var m = (cs.backgroundColor.match(/\d+(\.\d+)?/g) || [255,255,255,1]).map(Number);
    var lum = (m[3] === 0) ? 255 : (0.299*m[0] + 0.587*m[1] + 0.114*m[2]);
    if (lum > 200) sp.classList.add('dark');
    sp.style.width = sp.style.height = (s / k) + 'px';
    sp.style.left = ((e.clientX - r.left) / k - s / k / 2) + 'px';
    sp.style.top = ((e.clientY - r.top) / k - s / k / 2) + 'px';
    b.appendChild(sp);
    setTimeout(function(){ sp.remove(); }, 600);
  }

  /* --- 축하 --- */
  var celebrated = {};
  function toast(msg, ms){
    var t = el('div', {'class':'pz-toast', role:'status'}, msg);
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add('show'); });
    setTimeout(function(){ t.classList.remove('show'); setTimeout(function(){ t.remove(); }, 300); }, ms || 2400);
  }
  function celebrate(key, msg){
    key = key || 'default';
    if (celebrated[key]) return false;
    celebrated[key] = true;
    if (msg) toast(msg);
    if (reduceMotion) return true;
    var cv = el('canvas', {'class':'pz-confetti'}); document.body.appendChild(cv);
    var dpr = window.devicePixelRatio || 1, W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    var cols = ['#F29478','#7EB8EE','#B49AF0','#8ED1A8','#FFD580','#FFB8C9'];
    var P = [];
    for (var i = 0; i < 130; i++){
      P.push({x: W/2 + (Math.random()-.5)*W*.35, y: H*.42, vx: (Math.random()-.5)*13, vy: -Math.random()*13 - 5,
        r: 4 + Math.random()*5, c: cols[i % cols.length], rot: Math.random()*6, vr: (Math.random()-.5)*.3, round: Math.random() < .5});
    }
    var t0 = performance.now();
    (function frame(now){
      var t = now - t0; ctx.clearRect(0, 0, W, H);
      P.forEach(function(p){
        p.vy += .38; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t/1700); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
        if (p.round){ ctx.beginPath(); ctx.arc(0, 0, p.r*.7, 0, 6.283); ctx.fill(); } else { ctx.fillRect(-p.r/2, -p.r/4, p.r, p.r/2); }
        ctx.restore();
      });
      if (t < 1700) requestAnimationFrame(frame); else cv.remove();
    })(t0);
    return true;
  }

  function fade(node){
    if (!node || reduceMotion) return;
    node.classList.remove('pz-fade-in'); void node.offsetWidth; node.classList.add('pz-fade-in');
  }

  /* --- 글자로 쓴 식의 줄바꿈: " = ", " + ", " − ", " < " 등은 기호 뒤 띄어쓰기를 줄바꿈 없는 공백으로 바꿔
     줄이 바뀔 때 기호가 윗줄 끝이 아니라 다음 줄 첫머리에 오게 한다 (교과서식). 수식(KaTeX)·입력 칸·코드·SVG는 건드리지 않는다 --- */
  /* 괄호 안이 짧으면(16자 이하) 띄어쓰기를 줄바꿈 없는 공백으로 → "−(8 − 2)", "(x축 위쪽 넓이)"가 갈라지지 않게 */
  var OP_RE = / ([=+−<>≤≥≠×÷]) /g, PAREN_RE = /\(([^()\n]{1,16})\)/g, OP_TEST = / [=+−<>≤≥≠×÷] |\([^()\n]{1,16}\)/;
  var OP_SKIP = 'script,style,textarea,pre,code,svg,option,.katex,[contenteditable]';
  function opFix(t){
    if (!OP_TEST.test(t.data)) return;
    var p = t.parentElement; if (!p || p.closest(OP_SKIP)) return;
    var d = t.data.replace(OP_RE, ' $1 ').replace(PAREN_RE, function(m){ return m.replace(/ /g, ' '); });
    if (d !== t.data) t.data = d;
  }
  /* 수식(KaTeX) 바로 뒤에 붙은 조사(와, 가, 의 …)가 다음 줄로 떨어지지 않게 수식과 한 덩어리로 묶음 */
  function glueKatex(root){
    if (!root || root.nodeType !== 1 || !root.querySelectorAll) return;
    root.querySelectorAll('.katex').forEach(function(k){
      if (k.closest('.katex-display') || (k.parentElement && k.parentElement.classList.contains('pz-nobr'))) return;
      var n = k.nextSibling; if (!n || n.nodeType !== 3) return;
      /* 수식에 바로 붙은 한글, 또는 한 칸 띄고 쓴 조사(예: "\(f\) 와") */
      var m = /^[가-힣]+/.exec(n.data) || /^ (와|과|가|이|의|는|은|을|를|에서|에|으로|로|도|만)(?=[\s.,)!?]|$)/.exec(n.data); if (!m) return;
      var w = document.createElement('span'); w.className = 'pz-nobr'; w.style.whiteSpace = 'nowrap';
      k.parentNode.insertBefore(w, k); w.appendChild(k);
      n.data = n.data.slice(m[0].length); w.appendChild(document.createTextNode(m[0].replace(' ', ' ')));
    });
  }
  function opBreak(root){
    if (!root) return;
    if (root.nodeType === 3){ opFix(root); return; }
    if (root.nodeType !== 1 || root.closest(OP_SKIP)) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [], n;
    while ((n = w.nextNode())) if (OP_TEST.test(n.data)) list.push(n);
    list.forEach(opFix);
  }

  function init(){
    if (document.getElementById('pz-main')) return;
    try { meta = JSON.parse((document.getElementById('pz-meta') || {}).textContent || '{}'); } catch(e){ meta = {}; }
    var body = document.body;
    var main = el('div', {id:'pz-main'});
    var keep = ['pz-meta'];
    Array.prototype.slice.call(body.childNodes).forEach(function(n){
      if (n.nodeType === 1 && (n.tagName === 'SCRIPT' || keep.indexOf(n.id) >= 0)) return;
      main.appendChild(n);
    });
    body.insertBefore(main, body.firstChild);
    var blobs = el('div', {'class':'pz-blobs', 'aria-hidden':'true'}, '<i></i><i></i><i></i>');
    body.insertBefore(blobs, main);
    if (!meta.noTopbar) body.insertBefore(buildTopbar(), main);
    setZoom(zoom, true);

    document.addEventListener('click', function(e){
      var zb = e.target.closest && e.target.closest('.pz-zoomset button[data-z]');
      if (zb){ setZoom(+zb.dataset.z); return; }
      var pb = e.target.closest && e.target.closest('[data-pz="present"]');
      if (pb){ togglePresent(); return; }
      var cr = e.target.closest && e.target.closest('[data-pz="clear"]');
      if (cr){ clearRecords(); return; }
      var t = tipTarget(e);
      if (t && e.pointerType !== 'mouse'){ if (tipFor === t) hideTip(); else showTip(t); }
      else if (!t) hideTip();
    });
    document.addEventListener('fullscreenchange', function(){ if (!document.fullscreenElement && document.documentElement.classList.contains('pz-present')) exitPresent(); });
    document.addEventListener('mouseover', function(e){ var t = tipTarget(e); if (t) showTip(t); });
    document.addEventListener('mouseout', function(e){ var t = tipTarget(e); if (t && !t.contains(e.relatedTarget)) hideTip(); });
    document.addEventListener('focusin', function(e){ var t = tipTarget(e); if (t) showTip(t); });
    document.addEventListener('focusout', function(e){ if (tipTarget(e)) hideTip(); });
    window.addEventListener('scroll', hideTip, {passive:true});
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') hideTip(); });
    document.addEventListener('pointerdown', ripple, true);
    var tabTerms = function(){ document.querySelectorAll('.pz-term:not([tabindex])').forEach(function(t){ t.setAttribute('tabindex', '0'); }); };
    tabTerms();
    opBreak(main); glueKatex(main);
    if (window.MutationObserver){ var mo, q = false; mo = new MutationObserver(function(recs){
      recs.forEach(function(r){ if (r.type === 'characterData') opFix(r.target); else { for (var i = 0; i < r.addedNodes.length; i++) opBreak(r.addedNodes[i]); if (r.addedNodes.length) glueKatex(r.target); } });
      if (q) return; q = true; requestAnimationFrame(function(){ q = false; tabTerms(); }); });
      mo.observe(document.body, {childList:true, subtree:true, characterData:true}); }
    window.addEventListener('resize', updateAvail);
    updateAvail();
    bump();
    openTabFromHash();
    window.addEventListener('hashchange', openTabFromHash);
  }

  /* --- 탭 바로 열기: 주소 끝이 #tab3 이면 3번 탭을 연다 (수업 슬라이드에서 앱을 넣을 때 사용) ---
     showTab(n) 함수가 있는 앱 → showTab(n), data-tab="tN" 버튼을 쓰는 앱 → 그 버튼을 누른다,
     단계형 앱(2-1·2-2) → 앱 영역의 단계 버튼(role="tablist" 안 role="tab") 중 N번째를 누른다. #tab 이 없으면 아무것도 하지 않는다 */
  function openTabFromHash(){
    var m = /^#tab-?(\d+)$/i.exec(location.hash || '');
    if (!m) return;
    var n = +m[1];
    setTimeout(function(){
      if (typeof window.showTab === 'function'){ try { window.showTab(n); return; } catch(e){} }
      var b = document.querySelector('[data-tab="t' + n + '"],[data-tab="tab' + n + '"],#tabBtn' + n);
      if (!b){
        var list = document.querySelector('#pz-main [role="tablist"]');
        if (list) b = list.querySelectorAll('[role="tab"]')[n - 1];
      }
      if (b) b.click();
    }, 0);
  }

  window.PastelUI = { init:init, color:color, celebrate:celebrate, toast:toast, fade:fade, setZoom:setZoom, glossary:glossary, tex:renderTex, clearRecords:clearRecords,
    get zoom(){ return zoom; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
