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

  const SECTION_MAP = {
    '学術論文（査読有）': {
      list: 'pub-journal',
      section: 'section-journal'
    },

    '解説・総説（査読無）': {
      list: 'pub-review',
      section: 'section-review'
    },

    '国際会議発表論文（査読有）': {
      list: 'pub-international',
      section: 'section-international'
    },

    '国内学会発表：学生（査読無）': {
      list: 'pub-domestic-student',
      section: 'section-domestic-student'
    },

    '国内学会発表（査読無）': {
      list: 'pub-domestic',
      section: 'section-domestic'
    },

    '招待講演': {
      list: 'pub-invited',
      section: 'section-invited'
    },

    'その他講演': {
      list: 'pub-other-talk',
      section: 'section-other-talk'
    },

    '受賞等': {
      list: 'pub-award',
      section: 'section-award'
    },

    '学生の受賞': {
      list: 'pub-student-award',
      section: 'section-student-award'
    },

    '外部資金獲得[代表]': {
      list: 'pub-external-main',
      section: 'section-external-main'
    },

    '外部資金獲得[分担]': {
      list: 'pub-external-sub',
      section: 'section-external-sub'
    },

    '学内予算獲得[代表]': {
      list: 'pub-internal-main',
      section: 'section-internal-main'
    },

    '学内予算獲得[分担]': {
      list: 'pub-internal-sub',
      section: 'section-internal-sub'
    },

    '外部資金獲得（学生）': {
      list: 'pub-student-fund',
      section: 'section-student-fund'
    },

    '共同研究': {
      list: 'pub-collaboration',
      section: 'section-collaboration'
    }
  };


  function orderValue(value, fallback) {
    const n = Number(value);

    return Number.isFinite(n)
      ? n
      : fallback;
  }


  function createPublicationItem(item) {

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

      const a =
        document.createElement('a');

      a.href = href;
      a.target = 'new';
      a.rel = 'noopener noreferrer';

      a.textContent = '[link]';

      li.appendChild(a);
    }

    return li;
  }


  function updateLastModified(headerValue) {

    const target =
      document.getElementById(
        'publication-last-update'
      );

    if (!target || !headerValue) {
      return;
    }


    const date =
      new Date(headerValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return;
    }


    const y =
      date.getFullYear();

    const m =
      date.getMonth() + 1;

    const d =
      date.getDate();


    target.textContent =
      `Last Update: ${y}年${m}月${d}日`;
  }


  /*
   * Publicationを挿入した後は、
   * ページ全体の高さが大きく変わる。
   *
   * parallax.js は初期化時のレイアウトを
   * 基準にするため、resize/scrollを発火して
   * レイアウトを再計算させる。
   */
  function refreshParallax() {

    if (!window.jQuery) {
      return;
    }

    window.requestAnimationFrame(
      function () {

        jQuery(window)
          .trigger('resize')
          .trigger('scroll');

      }
    );


    /*
     * ブラウザや画像読み込みタイミングによって
     * 1回では再計算されないことがあるので
     * 念のため少し後でもう一度。
     */
    window.setTimeout(
      function () {

        jQuery(window)
          .trigger('resize')
          .trigger('scroll');

      },
      100
    );
  }


  function initializeWow() {

    if (
      typeof window.WOW !==
      'function'
    ) {
      return;
    }

    try {

      const wow =
        new window.WOW({
          boxClass: 'wow',
          animateClass: 'animated',
          offset: 0,
          mobile: true,
          live: false
        });

      wow.init();

    } catch (error) {

      console.warn(
        'WOW initialization failed.',
        error
      );

      /*
       * WOWに失敗しても
       * Publication自体は表示する。
       */
      document
        .querySelectorAll('.wow')
        .forEach(function (element) {
          element.style.visibility =
            'visible';
        });
    }
  }


  async function renderPublications() {

    try {

      const result =
        await TSV.loadWithMeta(
          PUBLICATIONS_TSV
        );

      const rows =
        result.rows;

      const groups =
        new Map();


      /*
       * セクションごとに分類
       */
      rows.forEach(
        function (row, index) {

          if (
            !row.section ||
            !row.text
          ) {
            return;
          }


          if (
            !groups.has(
              row.section
            )
          ) {
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
        }
      );


      /*
       * セクション内部を
       * TSVのorderで並べる
       */
      groups.forEach(
        function (items) {

          items.sort(
            function (a, b) {

              return (
                orderValue(
                  a.order,
                  a._index
                )
                -
                orderValue(
                  b.order,
                  b._index
                )
                ||
                a._index -
                b._index
              );
            }
          );
        }
      );


      /*
       * 元HTMLに最初から存在する
       * 各 <ol> に li だけ追加する。
       */
      SECTION_ORDER.forEach(
        function (sectionName) {

          const config =
            SECTION_MAP[
              sectionName
            ];

          if (!config) {
            return;
          }


          const ol =
            document.getElementById(
              config.list
            );

          const section =
            document.getElementById(
              config.section
            );


          if (
            !ol ||
            !section
          ) {
            console.warn(
              'Publication section not found:',
              sectionName
            );
            return;
          }


          ol.replaceChildren();


          const items =
            groups.get(
              sectionName
            ) || [];


          /*
           * TSVにデータが無いセクションは
           * セクションごと隠す。
           */
          if (
            items.length === 0
          ) {

            section.style.display =
              'none';

            return;
          }


          section.style.display =
            'block';


          items.forEach(
            function (item) {

              ol.appendChild(
                createPublicationItem(
                  item
                )
              );

            }
          );
        }
      );


      /*
       * TSVにあるがSECTION_ORDERにない
       * セクションがあればConsoleに警告。
       */
      groups.forEach(
        function (_, sectionName) {

          if (
            !SECTION_ORDER.includes(
              sectionName
            )
          ) {

            console.warn(
              'Unknown publication section:',
              sectionName
            );

          }
        }
      );


      updateLastModified(
        result.lastModified
      );


      /*
       * 全Publication挿入後に
       * WOWを初期化。
       */
      initializeWow();


      /*
       * ページ高さ変更後に
       * parallaxを再計算。
       */
      refreshParallax();


    } catch (error) {

      console.error(
        'Failed to load publications:',
        error
      );

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