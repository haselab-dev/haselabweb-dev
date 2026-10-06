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

  /*
   * 元の publication.html と同じ階層を生成する。
   *
   * <div class="col-sm-12 sm-margin-b-50">
   *   <div class="wow publication-wow fadeInLeft"
   *        data-wow-duration=".3"
   *        data-wow-delay=".3s">
   *     <h3>...</h3>
   *     <ol>...</ol>
   *   </div>
   * </div>
   */
  function createSection(title, rows) {
    const column = document.createElement('div');
    column.className = 'col-sm-12 sm-margin-b-50';

    const inner = document.createElement('div');
    inner.className = 'wow publication-wow fadeInLeft';
    inner.setAttribute('data-wow-duration', '.3');
    inner.setAttribute('data-wow-delay', '.3s');

    const h3 = document.createElement('h3');
    h3.textContent = title;
    inner.appendChild(h3);

    const ol = document.createElement('ol');

    rows.forEach(item => {
      const li = document.createElement('li');
      li.className = 'pubs';

      li.appendChild(
        document.createTextNode(item.text)
      );

      const href = TSV.safeHref(item.url);

      if (href) {
        li.appendChild(
          document.createTextNode(' ')
        );

        const a = document.createElement('a');
        a.href = href;
        a.target = 'new';
        a.rel = 'noopener noreferrer';
        a.textContent = '[link]';

        li.appendChild(a);
      }

      ol.appendChild(li);
    });

    inner.appendChild(ol);
    column.appendChild(inner);

    return column;
  }

  function updateLastModified(headerValue) {
    const target =
      document.getElementById(
        'publication-last-update'
      );

    if (!target) {
      return;
    }

    if (!headerValue) {
      target.textContent = '';
      return;
    }

    const date = new Date(headerValue);

    if (Number.isNaN(date.getTime())) {
      target.textContent = '';
      return;
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    target.textContent =
      `Last Update: ${year}年${month}月${day}日`;
  }

  /*
   * TSV版ではfetch後にPublication要素を
   * DOMへ追加するため、描画完了後に
   * Publication専用のWOWを初期化する。
   *
   * boxClassを publication-wow に限定して、
   * ページ内の既存 .wow 要素は再初期化しない。
   */
  function initPublicationWow() {
    const elements =
      document.querySelectorAll(
        '.publication-wow'
      );

    if (typeof window.WOW === 'function') {
      try {
        const publicationWow =
          new window.WOW({
            boxClass: 'publication-wow',
            animateClass: 'animated',
            offset: 0,
            mobile: true,
            live: false
          });

        publicationWow.init();
        return;

      } catch (error) {
        console.warn(
          'Publication WOW initialization failed.',
          error
        );
      }
    }

    /*
     * WOWが何らかの理由で使えない場合でも
     * Publicationそのものは非表示にしない。
     */
    elements.forEach(element => {
      element.style.visibility = 'visible';
    });
  }

  async function renderPublications() {
    const root =
      document.getElementById(
        'publications-root'
      );

    if (!root) {
      console.error(
        '#publications-root was not found.'
      );
      return;
    }

    try {
      const {
        rows,
        lastModified
      } = await TSV.loadWithMeta(
        PUBLICATIONS_TSV
      );

      const data = rows.filter(
        row => row.section && row.text
      );

      const groups = new Map();

      data.forEach((row, index) => {
        if (!groups.has(row.section)) {
          groups.set(
            row.section,
            []
          );
        }

        groups
          .get(row.section)
          .push({
            ...row,
            _index: index
          });
      });

      /*
       * 各セクション内部の表示順。
       * TSVのorder列を優先する。
       */
      groups.forEach(items => {
        items.sort(
          (a, b) =>
            orderValue(
              a.order,
              a._index
            ) -
              orderValue(
                b.order,
                b._index
              ) ||
            a._index - b._index
        );
      });

      /*
       * SECTION_ORDERに記載した順序を優先。
       * TSV側に新しい未知セクションがあれば
       * 最後に追加する。
       */
      const knownSections =
        SECTION_ORDER.filter(
          section =>
            groups.has(section)
        );

      const unknownSections =
        [...groups.keys()].filter(
          section =>
            !SECTION_ORDER.includes(
              section
            )
        );

      const sections = [
        ...knownSections,
        ...unknownSections
      ];

      root.replaceChildren();

      if (sections.length === 0) {
        const column =
          document.createElement('div');

        column.className =
          'col-sm-12 sm-margin-b-50';

        column.textContent =
          'Publicationはまだ登録されていません。';

        root.appendChild(column);

      } else {
        sections.forEach(section => {
          root.appendChild(
            createSection(
              section,
              groups.get(section)
            )
          );
        });
      }

      updateLastModified(
        lastModified
      );

      /*
       * 重要：
       * TSVからDOMを生成した後でWOWを初期化する。
       */
      initPublicationWow();

    } catch (error) {
      console.error(error);

      root.replaceChildren();

      const column =
        document.createElement('div');

      column.className =
        'col-sm-12 sm-margin-b-50';

      column.textContent =
        'Publicationを読み込めませんでした。';

      root.appendChild(column);
    }
  }

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      renderPublications
    );
  } else {
    renderPublications();
  }

})();