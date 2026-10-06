(function () {
  'use strict';

  function parse(text) {
    const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const lines = normalized
      .split('\n')
      .filter(line => line.trim() !== '' && !line.trimStart().startsWith('#'));

    if (lines.length === 0) return [];

    const headers = lines[0].split('\t').map(h => h.trim());

    return lines.slice(1).map((line, rowIndex) => {
      const cells = line.split('\t');
      const row = { _row: rowIndex + 2 };

      headers.forEach((header, index) => {
        row[header] = (cells[index] ?? '').trim();
      });

      return row;
    });
  }

  async function loadWithMeta(url) {
    const response = await fetch(url, { cache: 'no-cache' });

    if (!response.ok) {
      throw new Error(`TSV load failed: ${response.status} ${response.statusText}`);
    }

    return {
      rows: parse(await response.text()),
      lastModified: response.headers.get('Last-Modified')
    };
  }

  async function load(url) {
    return (await loadWithMeta(url)).rows;
  }

  function safeHref(value) {
    if (!value) return '';
    const href = value.trim();
    if (/^(https?:\/\/|\.\.?\/|\/)/i.test(href)) return href;
    return '';
  }

  window.TSV = Object.freeze({ parse, load, loadWithMeta, safeHref });
})();
