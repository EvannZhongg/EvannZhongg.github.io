// ====== 配置区 ======
const CONTAINER_HEIGHT = 600;  // 默认容器高度(px)
const V_MARGIN        = 40;   // 上下边距(px)

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
  // 1) 容器
  const c = document.createElement('div');
  c.className = 'mermaid-interactive-container';
  el.parentNode.insertBefore(c, el);
  c.appendChild(el);

  // 2) 绝对定位准备
  el.style.position = 'absolute';
  el.dataset.scale  = '1';

  // 3) 初始布局
  setTimeout(() => centerWithMargin(el, c), 0);

  // 4) 功能：拖拽 / 缩放 / 全屏
  makeDraggable(el);
  addZoomControls(el, c);
  addFullscreenButton(el, c);
}

function centerWithMargin(el, container) {
  // 固定高度布局
  const cW = container.clientWidth;
  const cH = CONTAINER_HEIGHT;
  const eW = el.offsetWidth;
  const eH = el.offsetHeight;

  // 按高度缩放到 (cH - 2*V_MARGIN)
  const scale = (cH - 2 * V_MARGIN) / eH;
  el.dataset.scale = scale.toFixed(3);

  const newW = eW * scale;
  // 设置容器高度
  container.style.height = `${cH}px`;

  // 水平居中 + 上边距 V_MARGIN
  el.dataset.tx = ((cW - newW) / 2).toFixed(0);
  el.dataset.ty = V_MARGIN.toFixed(0);
  updateTransform(el);
}

function centerFullscreen(el, container) {
  // 宽高双向等比放大并居中
  const cW = container.clientWidth;
  const cH = container.clientHeight;
  const eW = el.offsetWidth;
  const eH = el.offsetHeight;

  // 以容器宽高做等比缩放，不超出
  const scale = Math.min(cW / eW, cH / eH);
  el.dataset.scale = scale.toFixed(3);

  const newW = eW * scale;
  const newH = eH * scale;

  // 居中
  el.dataset.tx = ((cW - newW) / 2).toFixed(0);
  el.dataset.ty = ((cH - newH) / 2).toFixed(0);
  updateTransform(el);
}

function updateTransform(el) {
  const s = el.dataset.scale;
  const x = el.dataset.tx;
  const y = el.dataset.ty;
  el.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
}

function makeDraggable(el) {
  let sx, sy, dragging=false;
  el.style.cursor = 'move';
  el.onmousedown = e => {
    if (e.target.tagName==='BUTTON') return;
    e.preventDefault();
    dragging = true;
    sx = e.clientX; sy = e.clientY;
    document.onmousemove = onDrag;
    document.onmouseup   = onUp;
  };
  function onDrag(e) {
    if (!dragging) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    sx = e.clientX; sy = e.clientY;
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

  plus.onclick  = e => { e.stopPropagation(); zoom(el, +0.1); };
  minus.onclick = e => { e.stopPropagation(); zoom(el, -0.1); };
  reset.onclick = e => {
    e.stopPropagation();
    if (container.classList.contains('fullscreen')) {
      centerFullscreen(el, container);
    } else {
      centerWithMargin(el, container);
    }
  };

  ctr.append(plus, minus, reset);
  container.appendChild(ctr);
}

function zoom(el, delta) {
  let s = parseFloat(el.dataset.scale) + delta;
  s = Math.max(0.1, Math.min(s, 5));
  el.dataset.scale = s.toFixed(3);
  updateTransform(el);
}

function addFullscreenButton(el, container) {
  const btn = document.createElement('button');
  btn.className = 'mermaid-fullscreen-btn';
  btn.textContent = '🗖';
  btn.title       = '切换全屏';
  Object.assign(btn.style, {
    position: 'absolute', top: '5px', right: '5px',
    padding: '4px 6px', background: '#f5f5f5',
    border: '1px solid #ddd', borderRadius: '3px',
    cursor: 'pointer', zIndex: 1001, fontSize: '14px',
    lineHeight: '1'
  });

  btn.onclick = e => {
    e.stopPropagation();
    container.classList.toggle('fullscreen');
    if (container.classList.contains('fullscreen')) {
      // 进入全屏：去掉固定高度，等比全屏居中
      container.style.height = '';
      centerFullscreen(el, container);
    } else {
      // 退出全屏：恢复固定高度 + 边距
      container.style.height = `${CONTAINER_HEIGHT}px`;
      centerWithMargin(el, container);
    }
  };

  container.appendChild(btn);
}

// ====== 启动 ======
(async function(){
  await loadMermaid();
  prepareMermaidSources();
  await mermaid.run();
  initMermaidInteractivity();
})();
