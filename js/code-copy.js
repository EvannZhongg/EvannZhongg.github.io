document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('figure.highlight').forEach((figure) => {
    let wrapper = figure.parentElement;
    if (!wrapper || !wrapper.classList.contains('code-copy-wrapper')) {
      wrapper = document.createElement('div');
      wrapper.className = 'code-copy-wrapper';
      figure.parentNode.insertBefore(wrapper, figure);
      wrapper.appendChild(figure);
    }

    if (wrapper.querySelector('.copy-btn')) return;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.title = '复制';
    copyBtn.type = 'button';
    copyBtn.setAttribute('aria-label', '复制代码');

    // 缩小后的复制图标（14*15）
    const copyIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" height="14" width="15" viewBox="0 0 24 24" fill="white">
        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 18H8V7h11v16z"/>
      </svg>
    `;

    // 成功后显示的勾（14*15）
    const checkIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" height="14" width="15" viewBox="0 0 24 24" fill="#00cc66">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    `;

    copyBtn.innerHTML = copyIcon;

    copyBtn.addEventListener('click', () => {
      const code = figure.querySelector('td.code') || figure.querySelector('pre code') || figure.querySelector('pre');
      const text = code ? code.innerText : '';
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.innerHTML = checkIcon;
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.innerHTML = copyIcon;
          copyBtn.classList.remove('copied');
        }, 1000);
      });
    });

    wrapper.appendChild(copyBtn);
  });
});
