// ====== 配置区 ======
// 容器固定高度 (px)，下同
const CONTAINER_HEIGHT = 600;
// 图像上下固定边距 (px)
const V_MARGIN        = 40;

function prepareMermaidSources() {
  document.querySelectorAll('pre > code.language-mermaid').forEach(codeBlock => {
    const code = codeBlock.textContent.trim();
    const pre  = codeBlock.parentElement;
    const box  = pre.parentElement;
    const div  = document.createElement('div');
    div.className   = 'mermaid';
    div.textContent = code;
    box.replaceChild(div, pre);
  });
}

function loadMermaid() {
  return new Promise(resolve => {
    const s = document.createElement('script');
    s.src    = 'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js';
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

function initMermaidInteractivity() {
  document.querySelectorAll('.mermaid[data-processed="true"]').forEach(el => {
    if (!el.hasAttribute('data-interactive-added')) {
      wrapAndEnhance(el);
      el.setAttribute('data-interactive-added','');
    }
  });
}

function wrapAndEnhance(el) {
  // 1) 创建固定高度容器
  const c = document.createElement('div');
  c.className = 'mermaid-interactive-container';
  el.parentNode.insertBefore(c, el);
  c.appendChild(el);

  // 2) 绝对定位，准备变换
  el.style.position = 'absolute';
  el.dataset.scale  = '1';

  // 3) 初始计算
  setTimeout(() => centerWithMargin(el, c), 0);

  // 4) 功能绑定
  makeDraggable(el);
  addZoomControls(el, c);
}

function centerWithMargin(el, container) {
  // 容器宽高
  const cW = container.clientWidth;
  const cH = CONTAINER_HEIGHT; // 固定高度

  // 图原始宽高（scale=1）
  const eW = el.offsetWidth;
  const eH = el.offsetHeight;

  // 计算缩放比：使得 eH * scale == (cH - 2*V_MARGIN)
  const targetH = cH - 2 * V_MARGIN;
  const scale   = targetH / eH;
  el.dataset.scale = scale.toFixed(3);

  // 缩放后尺寸
  const newW = eW * scale;
  const newH = eH * scale;

  // 计算居中偏移
  const tx = (cW - newW) / 2;
  const ty = V_MARGIN;

  el.dataset.tx = tx.toFixed(0);
  el.dataset.ty = ty.toFixed(0);
  updateTransform(el);
}

function updateTransform(el) {
  const s = el.dataset.scale;
  const x = el.dataset.tx;
  const y = el.dataset.ty;
  el.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
}

function makeDraggable(el) {
  let startX, startY, dragging=false;
  el.style.cursor = 'move';
  el.onmousedown = e => {
    if (e.target.tagName==='BUTTON') return;
    e.preventDefault();
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    document.onmousemove = onDrag;
    document.onmouseup   = onUp;
  };
  function onDrag(e) {
    if (!dragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    startX = e.clientX; startY = e.clientY;
    el.dataset.tx = (parseFloat(el.dataset.tx)+dx).toFixed(0);
    el.dataset.ty = (parseFloat(el.dataset.ty)+dy).toFixed(0);
    updateTransform(el);
  }
  function onUp() {
    dragging = false;
    document.onmousemove = null;
    document.onmouseup   = null;
  }
}

function addZoomControls(el, container) {
  const ctr = document.createElement('div');
  ctr.className = 'mermaid-controls';
  ctr.style.position = 'absolute';
  ctr.style.right    = '5px';
  ctr.style.bottom   = '5px';
  ctr.style.display  = 'flex';
  ctr.style.gap      = '5px';

  const plus  = document.createElement('button'); plus.textContent = '+';
  const minus = document.createElement('button'); minus.textContent = '-';
  const reset = document.createElement('button'); reset.textContent = '↻';

  plus.onclick = e => { e.stopPropagation(); zoom(el, +0.1); };
  minus.onclick= e => { e.stopPropagation(); zoom(el, -0.1); };
  reset.onclick= e => { e.stopPropagation(); centerWithMargin(el, container); };

  ctr.append(plus, minus, reset);
  container.appendChild(ctr);
}

function zoom(el, delta) {
  let s = parseFloat(el.dataset.scale) + delta;
  s = Math.max(0.1, Math.min(s, 5));
  el.dataset.scale = s.toFixed(3);
  updateTransform(el);
}

// ====== 启动 ======
(async function(){
  await loadMermaid();
  prepareMermaidSources();
  await mermaid.run();
  initMermaidInteractivity();
})();
