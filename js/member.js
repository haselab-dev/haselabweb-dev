(function () {
  'use strict';

  const MEMBERS_TSV =
    './data/members.tsv';


  const SECTION_ORDER = [
    'Doctor',
    'Master',
    'Bachelor',
    'Research Student',
    'OB/OG'
  ];


  const SECTION_MAP = {

    'Doctor': {
      row: 'members-doctor',
      heading: 'heading-doctor'
    },

    'Master': {
      row: 'members-master',
      heading: 'heading-master'
    },

    'Bachelor': {
      row: 'members-bachelor',
      heading: 'heading-bachelor'
    },

    'Research Student': {
      row:
        'members-research-student',

      heading:
        'heading-research-student'
    },

    'OB/OG': {
      row: 'members-obog',
      heading: 'heading-obog'
    }

  };


  function orderValue(
    value,
    fallback
  ) {

    const n =
      Number(value);

    return Number.isFinite(n)
      ? n
      : fallback;
  }


  function createParagraph(
    className,
    text
  ) {

    const p =
      document.createElement('p');

    p.className =
      className;

    p.textContent =
      text;

    return p;
  }


  function createMemberCard(item) {

    /*
     * 元HTMLと同じBootstrap階層
     *
     * col-sm-4
     *   wow fadeInLeft
     *     service
     *       service-element
     *       service-info
     */

    const column =
      document.createElement('div');

    column.className =
      'col-sm-4 sm-margin-b-2';


    const wow =
      document.createElement('div');

    wow.className =
      'wow member-wow fadeInLeft';

    wow.setAttribute(
      'data-wow-duration',
      '.3'
    );

    wow.setAttribute(
      'data-wow-delay',
      '.2s'
    );


    const service =
      document.createElement('div');

    service.className =
      'service';

    service.setAttribute(
      'data-height',
      'height'
    );


    /*
     * 上部キャッチフレーズ
     */
    const serviceElement =
      document.createElement('div');

    serviceElement.className =
      'service-element';


    const catchphrase =
      createParagraph(
        'margin-b-0',
        item.catchphrase || ''
      );


    serviceElement.appendChild(
      catchphrase
    );


    /*
     * Member情報
     */
    const serviceInfo =
      document.createElement('div');

    serviceInfo.className =
      'service-info';


    const h3 =
      document.createElement('h3');

    h3.textContent =
      item.name || '';

    serviceInfo.appendChild(h3);


    /*
     * OB/OGの卒業年度等
     */
    if (item.note) {

      serviceInfo.appendChild(
        createParagraph(
          'margin-b-2',
          item.note
        )
      );

    }


    serviceInfo.appendChild(
      createParagraph(
        'margin-b-5',
        '研究テーマ：' +
          (item.theme || '')
      )
    );


    serviceInfo.appendChild(
      createParagraph(
        'margin-b-5',
        '出身：' +
          (item.hometown || '')
      )
    );


    serviceInfo.appendChild(
      createParagraph(
        'margin-b-5',
        '一言：' +
          (item.comment || '')
      )
    );


    service.appendChild(
      serviceElement
    );

    service.appendChild(
      serviceInfo
    );


    /*
     * 個人ページ等へのカードリンク
     */
    const href =
      TSV.safeHref(item.url);


    if (href) {

      const a =
        document.createElement('a');

      a.href =
        href;

      a.className =
        'content-wrapper-link';

      a.target =
        '_blank';

      a.rel =
        'noopener noreferrer';


      service.appendChild(a);
    }


    wow.appendChild(
      service
    );

    column.appendChild(
      wow
    );


    return column;
  }


  /*
   * 元テンプレートの
   * data-auto-height処理を
   * TSV挿入後に再実行する。
   */
  function refreshAutoHeight() {

    if (!window.jQuery) {
      return;
    }


    jQuery(
      '[data-auto-height]'
    ).each(function () {

      const container =
        jQuery(this);

      const elements =
        jQuery(
          '[data-height]',
          container
        );


      let maxHeight = 0;


      elements.each(
        function () {

          const element =
            jQuery(this);


          if (
            element.attr(
              'data-height'
            ) === 'height'
          ) {

            element.css(
              'height',
              ''
            );

          } else {

            element.css(
              'min-height',
              ''
            );

          }


          const height =
            element.outerHeight(true);


          if (
            height >
            maxHeight
          ) {

            maxHeight =
              height;

          }

        }
      );


      elements.each(
        function () {

          const element =
            jQuery(this);


          if (
            element.attr(
              'data-height'
            ) === 'height'
          ) {

            element.css(
              'height',
              maxHeight
            );

          } else {

            element.css(
              'min-height',
              maxHeight
            );

          }

        }
      );

    });

  }


  function initializeMemberWow() {

    const elements =
      document.querySelectorAll(
        '.member-wow'
      );


    if (
      typeof window.WOW ===
      'function'
    ) {

      try {

        const wow =
          new window.WOW({
            boxClass:
              'member-wow',

            animateClass:
              'animated',

            offset: 0,

            mobile: true,

            live: false
          });


        wow.init();

        return;

      } catch (error) {

        console.warn(
          'Member WOW initialization failed.',
          error
        );

      }

    }


    /*
     * WOWが動かなかった場合も
     * Member自体は表示する。
     */
    elements.forEach(
      function (element) {

        element.style.visibility =
          'visible';

      }
    );

  }


  /*
   * Publicationで発生した
   * Parallaxのレイアウト問題への対策。
   */
  function refreshLayout() {

    const refresh =
      function () {

        refreshAutoHeight();


        if (
          window.jQuery
        ) {

          jQuery(window)
            .trigger('resize')
            .trigger('scroll');

        } else {

          window.dispatchEvent(
            new Event('resize')
          );

          window.dispatchEvent(
            new Event('scroll')
          );

        }

      };


    window.requestAnimationFrame(
      refresh
    );


    window.setTimeout(
      refresh,
      100
    );


    window.setTimeout(
      refresh,
      500
    );

  }


  async function renderMembers() {

    try {

      const result =
        await TSV.loadWithMeta(
          MEMBERS_TSV
        );


      const groups =
        new Map();


      result.rows.forEach(
        function (row, index) {

          if (
            !row.section ||
            !row.name
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
       * 各カテゴリ内の表示順
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


      SECTION_ORDER.forEach(
        function (sectionName) {

          const config =
            SECTION_MAP[
              sectionName
            ];


          const row =
            document.getElementById(
              config.row
            );


          const heading =
            document.getElementById(
              config.heading
            );


          if (
            !row ||
            !heading
          ) {

            console.warn(
              'Member section not found:',
              sectionName
            );

            return;
          }


          row.replaceChildren();


          const items =
            groups.get(
              sectionName
            ) || [];


          /*
           * データがないカテゴリは
           * 見出しごと隠す。
           */
          if (
            items.length === 0
          ) {

            heading.style.display =
              'none';

            row.style.display =
              'none';

            return;
          }


          heading.style.display =
            '';

          row.style.display =
            '';


          items.forEach(
            function (item) {

              row.appendChild(
                createMemberCard(
                  item
                )
              );

            }
          );

        }
      );


      /*
       * TSV上のタイプミスを検出
       */
      groups.forEach(
        function (_, sectionName) {

          if (
            !SECTION_ORDER.includes(
              sectionName
            )
          ) {

            console.warn(
              'Unknown member section:',
              sectionName
            );

          }

        }
      );


      /*
       * カード生成後に
       * WOW → 高さ → Parallax
       */
      initializeMemberWow();

      refreshLayout();


    } catch (error) {

      console.error(
        'Failed to load members:',
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
      renderMembers
    );

  } else {

    renderMembers();

  }

})();