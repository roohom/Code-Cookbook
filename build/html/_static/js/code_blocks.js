(function () {
  const MIN_COLLAPSE_HEIGHT = 520;
  const COLLAPSED_HEIGHT = 360;

  function createToggle(target) {
    const wrapper = document.createElement('div');
    const footer = document.createElement('div');
    const button = document.createElement('button');

    wrapper.className = 'cc-code-block';
    footer.className = 'cc-code-footer';
    button.className = 'cc-code-toggle';
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    button.textContent = '展开代码';

    target.parentNode.insertBefore(wrapper, target);
    wrapper.appendChild(target);
    footer.appendChild(button);
    wrapper.appendChild(footer);

    target.classList.add('cc-code-collapsible', 'is-collapsed');
    wrapper.classList.add('is-collapsed');
    target.style.setProperty('--cc-code-collapsed-height', `${COLLAPSED_HEIGHT}px`);

    button.addEventListener('click', function () {
      const isCollapsed = target.classList.toggle('is-collapsed');
      wrapper.classList.toggle('is-collapsed', isCollapsed);
      button.setAttribute('aria-expanded', String(!isCollapsed));
      button.textContent = isCollapsed ? '展开代码' : '收起代码';
    });
  }

  function addCopyButton(block) {
    const btn = document.createElement('button');
    btn.className = 'cc-code-copy';
    btn.type = 'button';
    btn.setAttribute('aria-label', '复制代码');
    btn.textContent = '复制';

    btn.addEventListener('click', function () {
      const code = block.querySelector('code') || block.querySelector('pre');
      if (!code) return;
      navigator.clipboard.writeText(code.textContent).then(function () {
        btn.textContent = '已复制';
        btn.classList.add('cc-code-copy--done');
        setTimeout(function () {
          btn.textContent = '复制';
          btn.classList.remove('cc-code-copy--done');
        }, 1500);
      });
    });

    block.style.position = 'relative';
    block.appendChild(btn);
  }

  function initCodeBlocks() {
    const blocks = document.querySelectorAll(
      '.rst-content div[class^="highlight-"], .rst-content pre.literal-block'
    );

    blocks.forEach(function (block) {
      if (block.closest('.cc-code-block')) {
        return;
      }

      addCopyButton(block);

      if (block.scrollHeight > MIN_COLLAPSE_HEIGHT) {
        createToggle(block);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.requestAnimationFrame(initCodeBlocks);
    });
  } else {
    window.requestAnimationFrame(initCodeBlocks);
  }
})();
