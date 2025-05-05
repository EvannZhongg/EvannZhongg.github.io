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
  const c = document.createElement('div');
  c.className = 'mermaid-interactive-container';
  el.parentNode.insertBefore(c, el);
  c.appendChild(el);

  el.style.position = 'absolute';
  el.dataset.scale  = '1';

  setTimeout(() => centerWithMargin(el, c), 0);

  makeDraggable(el);
  addZoomControls(el, c);
  addFullscreenButton(el, c);
}

function centerWithMargin(el, container) {
  const cW = container.clientWidth;
  const cH = CONTAINER_HEIGHT;
  const eW = el.offsetWidth;
  const eH = el.offsetHeight;

  const scale = (cH - 2 * V_MARGIN) / eH;
  el.dataset.scale = scale.toFixed(3);

  const newW = eW * scale;
  container.style.height = `${cH}px`;

  el.dataset.tx = ((cW - newW) / 2).toFixed(0);
  el.dataset.ty = V_MARGIN.toFixed(0);
  updateTransform(el);
}

function centerFullscreen(el, container) {
  const cW = container.clientWidth;
  const cH = container.clientHeight;
  const eW = el.offsetWidth;
  const eH = el.offsetHeight;

  const scale = Math.min(cW / eW, cH / eH);
  el.dataset.scale = scale.toFixed(3);

  const newW = eW * scale;
  const newH = eH * scale;

  el.dataset.tx = ((cW - newW) / 2).toFixed(0);
  el.dataset.ty = ((cH - newH) / 2).toFixed(0);
  updateTransform(el);
}

function updateTransform(el) {
  const s = el.dataset.scale, x = el.dataset.tx, y = el.dataset.ty;
  el.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
}

function makeDraggable(el) {
  let sx, sy, dragging=false;
  el.style.cursor = 'move';
  el.onmousedown = e => {
    if (e.target.tagName==='BUTTON') return;
    e.preventDefault();
    dragging = true; sx = e.clientX; sy = e.clientY;
    document.onmousemove = onDrag;
    document.onmouseup   = onUp;
  };
  function onDrag(e) {
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
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
  Object.assign(ctr.style, { position:'absolute', right:'5px', bottom:'5px', display:'flex', gap:'5px' });

  const plus  = document.createElement('button'); plus.textContent  = '+';
  const minus = document.createElement('button'); minus.textContent = '-';
  const reset = document.createElement('button'); reset.textContent = '↻';

  plus.onclick  = e => { e.stopPropagation(); zoom(el, +0.1, container); };
  minus.onclick = e => { e.stopPropagation(); zoom(el, -0.1, container); };
  reset.onclick = e => {
    e.stopPropagation();
    if (container.classList.contains('fullscreen')) centerFullscreen(el, container);
    else centerWithMargin(el, container);
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
    position:'absolute',top:'5px',right:'5px',
    padding:'4px 6px',background:'#f5f5f5',
    border:'1px solid #ddd',borderRadius:'3px',
    cursor:'pointer',zIndex:1001,fontSize:'14px',lineHeight:'1'
  });

  let outsideHandler;
  btn.onclick = e => {
    e.stopPropagation();
    const isFs = container.classList.toggle('fullscreen');
    if (isFs) {
      // 进入全屏
      container.style.height = '';
      centerFullscreen(el, container);
      // 点击容器外任意处退出全屏
      outsideHandler = evt => {
        if (!container.contains(evt.target)) {
          container.classList.remove('fullscreen');
          container.style.height = `${CONTAINER_HEIGHT}px`;
          centerWithMargin(el, container);
          document.removeEventListener('mousedown', outsideHandler);
        }
      };
      document.addEventListener('mousedown', outsideHandler);
    } else {
      // 退出全屏
      container.style.height = `${CONTAINER_HEIGHT}px`;
      centerWithMargin(el, container);
      document.removeEventListener('mousedown', outsideHandler);
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
