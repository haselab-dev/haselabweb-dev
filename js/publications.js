(function () {
  'use strict';

  const PUBLICATIONS_TSV = './data/publications.tsv';

  const SECTION_ORDER = [
    '学術論文（査読有）',
    '解説・総説（査読無）',
    '国際会議発表論文（査読有）',
    '国内学会発表：学生（査読無）',
    '国内学会発表（査読無）',
    '招待講演',
    'その他講演',
    '受賞等',
    '学生の受賞',
    '外部資金獲得[代表]',
    '外部資金獲得[分担]',
    '学内予算獲得[代表]',
    '学内予算獲得[分担]',
    '外部資金獲得（学生）',
    '共同研究'
  ];

  function orderValue(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function createSection(title, rows) {
    const column = document.createElement('div');
    column.className = 'col-sm-12 sm-margin-b-50';

    const inner = document.createElement('div');

    const h3 = document.createElement('h3');
    h3.textContent = title;
    inner.appendChild(h3);

    const ol = document.createElement('ol');

    rows.forEach(item => {
      const li = document.createElement('li');
      li.className = 'pubs';
      li.appendChild(document.createTextNode(item.text));

      const href = TSV.safeHref(item.url);
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = ' [link]';
        li.appendChild(a);
      }

      ol.appendChild(li);
    });

    inner.appendChild(ol);
    column.appendChild(inner);
    return column;
  }

  function updateLastModified(headerValue) {
    const target = document.getElementById('publication-last-update');
    if (!target) return;

    if (!headerValue) {
      target.textContent = '';
      return;
    }

    const date = new Date(headerValue);
    if (Number.isNaN(date.getTime())) return;

    target.textContent = `Last Update: ${date.toLocaleString('ja-JP')}`;
  }

  async function renderPublications() {
    const root = document.getElementById('publications-root');
    if (!root) return;

    try {
      const { rows, lastModified } = await TSV.loadWithMeta(PUBLICATIONS_TSV);
      const data = rows.filter(row => row.section && row.text);
      const groups = new Map();

      data.forEach((row, index) => {
        if (!groups.has(row.section)) groups.set(row.section, []);
        groups.get(row.section).push({ ...row, _index: index });
      });

      groups.forEach(items => {
        items.sort((a, b) =>
          orderValue(a.order, a._index) - orderValue(b.order, b._index) ||
          a._index - b._index
        );
      });

      const known = SECTION_ORDER.filter(section => groups.has(section));
      const unknown = [...groups.keys()].filter(section => !SECTION_ORDER.includes(section));
      const sections = [...known, ...unknown];

      root.replaceChildren();

      if (sections.length === 0) {
        root.textContent = 'Publicationはまだ登録されていません。';
      } else {
        sections.forEach(section => {
          root.appendChild(createSection(section, groups.get(section)));
        });
      }

      updateLastModified(lastModified);
    } catch (error) {
      console.error(error);
      root.textContent = 'Publicationを読み込めませんでした。';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPublications);
  } else {
    renderPublications();
  }
})();
