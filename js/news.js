(function () {
  'use strict';

  const NEWS_TSV = './data/news.tsv';
  const ICONS = {
    'イベント': 'glyphicon-bell',
    '研究費': 'glyphicon-usd',
    '学術論文': 'glyphicon-edit',
    '学会発表': 'glyphicon-briefcase',
    '受賞等': 'glyphicon-star',
    'セミナー': 'glyphicon-briefcase',
    '講演': 'glyphicon-briefcase',
    '共同研究': 'glyphicon-transfer'
  };

  function dateKey(value) {
    return Number(String(value || '').replace(/\D/g, '')) || 0;
  }

  function appendMessage(parent, item) {
    const href = TSV.safeHref(item.url);

    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = item.message;
      parent.appendChild(a);
    } else {
      parent.appendChild(document.createTextNode(item.message));
    }
  }

  function renderItem(root, item) {
    const p = document.createElement('p');
    const icon = ICONS[item.category] || 'glyphicon-info-sign';
    p.className = `glyphicon ${icon}`;

    p.appendChild(
      document.createTextNode(` [${item.category}] ${item.date} `)
    );
    appendMessage(p, item);
    root.appendChild(p);

    const details = String(item.details || '')
      .split(/\s*\|\|\s*/)
      .map(s => s.trim())
      .filter(Boolean);

    if (details.length > 0) {
      const ul = document.createElement('ul');
      details.forEach(detail => {
        const li = document.createElement('li');
        li.textContent = detail;
        ul.appendChild(li);
      });
      root.appendChild(ul);
    }
  }

  async function renderNews() {
    const root = document.getElementById('news-list');
    if (!root) return;

    try {
      const rows = await TSV.load(NEWS_TSV);
      const items = rows
        .filter(row => row.date && row.category && row.message)
        .map((row, index) => ({ ...row, _index: index }))
        .sort((a, b) => dateKey(b.date) - dateKey(a.date) || a._index - b._index);

      root.replaceChildren();

      if (items.length === 0) {
        root.textContent = 'Newsはまだ登録されていません。';
        return;
      }

      items.forEach(item => renderItem(root, item));
    } catch (error) {
      console.error(error);
      root.textContent = 'Newsを読み込めませんでした。';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNews);
  } else {
    renderNews();
  }
})();
