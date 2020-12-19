/* global Swal, CodeMirror, Qieyun, Yitizi */

/* 1. 顯示會話窗口的工具 */

/**
 * 將字串轉義為 HTML 格式。
 * @param {string} s 待轉義的字串
 */
function HTMLEscape(s) {
  const pre = document.createElement('pre');
  pre.innerText = s;
  return pre.innerHTML;
}

/**
 * 創建一個帶確定按鈕的會話窗口，內容為字串 `msg`。
 * @param {string} msg 會話窗口的內容
 */
function notify(msg) {
  Swal.fire({ animation: false, text: msg, confirmButtonText: '確定' });
}

/**
 * 創建一個帶確定按鈕的會話窗口，內容為 HTML 格式的 `msg`。
 * @param {string} msg 會話窗口的內容，以 HTML 格式
 */
function notifyHTML(msg) {
  Swal.fire({ animation: false, html: msg, confirmButtonText: '確定' });
}

/**
 * 創建一個帶確定按鈕的錯誤窗口，內容為錯誤 `err`。窗口中不顯示錯誤產生時的堆棧信息。
 * @param {Error} err 待顯示的錯誤
 */
function notifyErrorWithoutStack(err) {
  const msg = `<p lang="en-HK">Error: ${HTMLEscape(err.message)}</p>`;
  Swal.fire({ animation: false, icon: 'error', html: msg, confirmButtonText: '確定' });
}

/**
 * 創建一個帶確定按鈕的錯誤窗口，內容為錯誤 `err`。窗口中會顯示錯誤產生時的堆棧信息。
 * @param {Error} err 待顯示的錯誤
 */
function notifyError(err) {
  let msg = `<p lang="en-HK">Error: ${HTMLEscape(err.message)}</p>`;
  if (err.stack) msg += `<pre lang="en-HK" style="text-align: left;">${HTMLEscape(err.stack)}</pre>`;
  Swal.fire({ animation: false, icon: 'error', html: msg, confirmButtonText: '確定' });
}

/**
 * 創建一個帶確定按鈕的錯誤窗口，內容為錯誤 `err` 與出現錯誤的音韻地位。
 * 窗口中會顯示錯誤產生時的堆棧信息。
 * @param {string} 音韻描述 音韻地位的音韻描述
 * @param {Error} err 待顯示的錯誤
 */
function notifyErrorWithError(音韻描述, err) {
  let msg = `<p>音韻地位：<span lang="en-HK">${音韻描述}, Error: ${HTMLEscape(err.message)}</span></p>`;
  if (err.stack) msg += `<pre lang="en-HK" style="text-align: left;">${HTMLEscape(err.stack)}</pre>`;
  Swal.fire({ animation: false, icon: 'error', html: msg, confirmButtonText: '確定' });
}

/* 2. 匯出至剪貼簿的工具 */

/**
 * 將字串匯出至剪貼簿。
 * @param {string} txt 待匯出至剪貼簿的字串
 */
function copyTextToClipboard(txt) {
  // taken from https://stackoverflow.com/a/30810322
  if (navigator.clipboard == null) {
    const textArea = document.createElement('textarea');
    textArea.value = txt;
    textArea.style.position = 'fixed'; // avoid scrolling to bottom
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const success = document.execCommand('copy');
      if (success) notify('已成功匯出至剪貼簿');
      else notifyErrorWithoutStack(new Error('匯出至剪貼簿失敗'));
    } catch (err) {
      notifyError(err);
    }
    document.body.removeChild(textArea);
  } else {
    navigator.clipboard.writeText(txt).then(() => notify('已成功匯出至剪貼簿'), (err) => notifyError(err));
  }
}

/* 3. 初始化頁面 */

let schemaInputArea;

function handleLoadSchema(schema) {
  fetch(`https://cdn.jsdelivr.net/gh/nk2028/qieyun-examples@9ce4823/${schema}.js`)
  .then((response) => response.text())
  .then((txt) => schemaInputArea.setValue(txt))
  .catch((err) => notifyError(err));
}

document.addEventListener('DOMContentLoaded', () => {
  /* 初始化 Codemirror */
  const schemaInput = document.getElementById('schemaInput');
  schemaInputArea = CodeMirror(schemaInput, {
    mode: 'javascript',
    lineNumbers: true,
  });

  /* 載入被選擇的推導方案 */
  const schema = document.forms.schemaSelect.schema.value;
  handleLoadSchema(schema);
});

/* 4. 處理音韻地位物件的工具 */

/**
 * 將音韻描述轉換為音韻地位物件。
 * @param {string} 音韻描述 音韻地位的音韻描述
 */
function 音韻描述2音韻地位(音韻描述) {
  const pattern = /(.)(.)(.)([AB]?)(.)(.)/gu; // 根據音韻描述的格式解析出音韻地位
  const arr = pattern.exec(音韻描述);
  return new Qieyun.音韻地位(arr[1], arr[2], arr[3], arr[4] || null, arr[5], arr[6]);
}

/* 5. 推導函數 */

let userInput;

function loadSchema() {
  try {
    userInput = new Function('音韻地位', '小韻號', '字頭', schemaInputArea.getValue());
  } catch (err) {
    notifyError(err);
    throw err;
  }
}

function 推導(音韻地位, 小韻號, 字頭) {
  try {
    const res = userInput(音韻地位, 小韻號, 字頭);
    if (res == null) {
      throw new Error('Result is null');
    }
    return res;
  } catch (err) {
    notifyErrorWithError(音韻地位.音韻描述, err);
    throw err;
  }
}

/* 6. 處理「從輸入框中讀取文章，並注音」的輔助函數 */

function makeTooltip(pronunciation, ress) {
  const span = document.createElement('span');
  span.classList.add('tooltip-item');

  const spanPronunciation = document.createElement('span');
  spanPronunciation.lang = 'och-Latn-fonipa';
  spanPronunciation.innerText = pronunciation;
  span.appendChild(spanPronunciation);
  span.appendChild(document.createTextNode(' '));

  for (const [i, { 字頭, 小韻號, 解釋, 音韻地位 }] of ress.entries()) {
    if (i !== 0) span.appendChild(document.createElement('br'));

    let 反切 = Qieyun.get反切(小韻號);
    反切 = 反切 == null ? '' : `${反切} `;

    const spanCh = document.createElement('span');
    spanCh.classList.add('tooltip-ch');
    spanCh.innerText = 字頭;
    span.appendChild(spanCh);
    span.appendChild(document.createTextNode(' '));

    span.appendChild(document.createTextNode(`${音韻地位.音韻描述} ${反切}${解釋}`));
  }

  return span;
}

function makeNoneEntry(ch) {
  const outerContainer = document.createElement('span');
  outerContainer.classList.add('entry');
  outerContainer.classList.add('entry-none');
  outerContainer.appendChild(document.createTextNode(ch));
  outerContainer.handleExport = () => ch;
  outerContainer.handleRuby = () => ch;
  return outerContainer;
}

function makeSingleEntry(ch, pronunciationMap) {
  const [pronunciation, ress] = [...pronunciationMap][0];

  const outerContainer = document.createElement('span');
  outerContainer.classList.add('entry');
  outerContainer.classList.add('entry-single');

  const ruby = document.createElement('ruby');
  ruby.appendChild(document.createTextNode(ch));

  const tooltipContainer = document.createElement('span');
  tooltipContainer.classList.add('tooltip-container');

  const rpLeft = document.createElement('rp');
  rpLeft.appendChild(document.createTextNode('('));
  ruby.appendChild(rpLeft);

  const rt = document.createElement('rt');
  rt.lang = 'och-Latn-fonipa';
  rt.innerText = pronunciation;
  ruby.appendChild(rt);

  const rpRight = document.createElement('rp');
  rpRight.appendChild(document.createTextNode(')'));
  ruby.appendChild(rpRight);

  const tooltip = makeTooltip(pronunciation, ress);
  tooltipContainer.appendChild(tooltip);

  outerContainer.appendChild(ruby);
  outerContainer.appendChild(tooltipContainer);
  const exportText = `${ch}(${pronunciation})`;
  outerContainer.handleExport = () => exportText;
  const rubyText = `<ruby>${ch}<rp>(</rp><rt lang="zh-Latn">${pronunciation}</rt><rp>)</rp></ruby>`;
  outerContainer.handleRuby = () => rubyText;

  return outerContainer;
}

function makeMultipleEntry(ch, pronunciationMap) {
  const outerContainer = document.createElement('span');
  outerContainer.classList.add('entry');
  outerContainer.classList.add('entry-multiple');
  outerContainer.classList.add('unresolved');

  const ruby = document.createElement('ruby');
  ruby.appendChild(document.createTextNode(ch));

  const tooltipContainer = document.createElement('span');
  tooltipContainer.classList.add('tooltip-container');

  const rpLeft = document.createElement('rp');
  rpLeft.appendChild(document.createTextNode('('));
  ruby.appendChild(rpLeft);

  const rt = document.createElement('rt');
  rt.lang = 'och-Latn-fonipa';
  ruby.appendChild(rt);

  const rpRight = document.createElement('rp');
  rpRight.appendChild(document.createTextNode(')'));
  ruby.appendChild(rpRight);

  const rtSpanArray = [];
  const tooltipArray = [];

  for (const [i, [pronunciation, ress]] of [...pronunciationMap].entries()) {
    const rtSpan = document.createElement('span');
    rtSpan.innerText = pronunciation;
    rt.appendChild(rtSpan);
    rtSpanArray.push(rtSpan);

    const tooltip = makeTooltip(pronunciation, ress);
    tooltip.addEventListener('click', () => {
      rtSpanArray.map((rtSpanItem) => rtSpanItem.classList.add('hidden'));
      rtSpan.classList.remove('hidden');

      outerContainer.currentSelection = pronunciation;
      outerContainer.classList.remove('unresolved');

      tooltipArray.map((tooltipItem) => tooltipItem.classList.remove('selected'));
      tooltip.classList.add('selected');
    });
    tooltipContainer.appendChild(tooltip);
    tooltipArray.push(tooltip);

    if (i === 0) { // Select the first item by default
      outerContainer.currentSelection = pronunciation;
      tooltip.classList.add('selected');
    } else { // Hide other items
      rtSpan.classList.add('hidden');
    }
  }

  outerContainer.appendChild(ruby);
  outerContainer.appendChild(tooltipContainer);
  outerContainer.handleExport = () => `${ch}(${outerContainer.currentSelection})`;
  outerContainer.handleRuby = () => `<ruby>${ch}<rt>${outerContainer.currentSelection}</rt></ruby>`;

  return outerContainer;
}

function makeConversion(ch) {
  const 所有異體字 = Yitizi.get(ch);
  所有異體字.unshift(ch); // include ch itself

  const pronunciationMap = new Map(); // { 擬音: [{ 字頭, 小韻號, 解釋, 音韻地位 }] }

  for (const 字頭 of 所有異體字) {
    for (const { 小韻號, 解釋 } of Qieyun.query漢字(字頭)) {
      const 音韻地位 = Qieyun.get音韻地位(小韻號);
      const 擬音 = 推導(音韻地位, 小韻號, 字頭);
      if (pronunciationMap.get(擬音) == null) pronunciationMap.set(擬音, []);
      pronunciationMap.get(擬音).push({ 字頭, 小韻號, 解釋, 音韻地位 });
    }
  }

  switch (pronunciationMap.size) {
    case 0: return makeNoneEntry(ch);
    case 1: return makeSingleEntry(ch, pronunciationMap);
    default: return makeMultipleEntry(ch, pronunciationMap);
  }
}

/* 7. 處理用户選擇的函數 */

function handleConvertArticle() {
  const outputArea = document.getElementById('outputArea');
  const articleInput = document.getElementById('articleInput');

  outputArea.innerHTML = ''; // 清除舊資料

  const fragment = document.createDocumentFragment();
  for (const ch of articleInput.value) {
    fragment.appendChild(makeConversion(ch));
  }
  outputArea.appendChild(fragment);

  outputArea.handleExport = () => [...outputArea.childNodes].map((node) => node.handleExport()).join('');
  outputArea.handleRuby = () => [...outputArea.childNodes].map((node) => node.handleRuby()).join('');
}

function handleConvertPresetArticle() {
  function inner(txt) {
    const outputArea = document.getElementById('outputArea');
    outputArea.innerHTML = '';

    // Load
    const { body } = (new DOMParser()).parseFromString(txt, 'text/html');

    // Convert
    body.querySelectorAll('ruby').forEach((ruby) => {
      const rt = ruby.querySelector('rt');
      const 漢字 = ruby.childNodes[0].textContent;
      const 音韻描述 = rt.innerText;
      const 音韻地位 = 音韻描述2音韻地位(音韻描述);
      const 小韻號 = null; // TODO FIXME: Get 小韻號 from 音韻描述
      const 擬音 = 推導(音韻地位, 小韻號, 漢字);
      rt.lang = 'och-Latn-fonipa';
      rt.innerText = 擬音;
    });

    // Change h1 to h3
    body.querySelectorAll('h1').forEach((el) => {
      const dummy = document.createElement('h3');
      dummy.innerHTML = el.innerHTML;
      el.parentNode.replaceChild(dummy, el);
    });

    // Push
    const fragment = document.createDocumentFragment();
    body.childNodes.forEach((node) => {
      fragment.appendChild(node);
    });
    outputArea.appendChild(fragment);

    outputArea.handleExport = null;
    outputArea.handleRuby = null;
  }

  fetch('https://cdn.jsdelivr.net/gh/nk2028/qieyun-text-label@7350432/index.html')
  .then((response) => response.text())
  .then((txt) => inner(txt))
  .catch((err) => notifyError(err));
}

function handleExportAllSmallRhymes() {
  const outputArea = document.getElementById('outputArea');
  outputArea.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (let sr = 1; sr <= 3874; sr++) {
    fragment.appendChild(document.createTextNode(`${Qieyun.get音韻地位(sr).音韻描述} `));

    const span = document.createElement('span');
    span.lang = 'och-Latn-fonipa';
    span.appendChild(document.createTextNode(推導(Qieyun.get音韻地位(sr), sr)));
    fragment.appendChild(span);

    fragment.appendChild(document.createElement('br'));
  }
  outputArea.appendChild(fragment);

  outputArea.handleExport = null;
  outputArea.handleRuby = null;
}

function handleExportAllSyllables() {
  const outputArea = document.getElementById('outputArea');

  const s = new Set();
  for (let sr = 1; sr <= 3874; sr++) {
    const res = 推導(Qieyun.get音韻地位(sr), sr);
    s.add(res);
  }
  document.getElementById('outputArea').innerText = [...s].join(', ');

  outputArea.handleExport = null;
  outputArea.handleRuby = null;
}

function handleExportAllSyllablesWithCount() {
  const outputArea = document.getElementById('outputArea');

  const counter = new Map();
  for (let sr = 1; sr <= 3874; sr++) {
    const res = 推導(Qieyun.get音韻地位(sr), sr);
    const v = counter.get(res);
    counter.set(res, v == null ? 1 : v + 1);
  }
  const arr = [...counter];
  arr.sort((a, b) => b[1] - a[1]);
  document.getElementById('outputArea').innerText = arr.map(([x, y]) => `${x} (${y})`).join(', ');

  outputArea.handleExport = null;
  outputArea.handleRuby = null;
}

function handlePredefinedOptions() {
  loadSchema();
  switch (document.getElementById('predefinedOptions').value) {
    case 'convertArticle': handleConvertArticle(); break;
    case 'convertPresetArticle': handleConvertPresetArticle(); break;
    case 'exportAllSmallRhymes': handleExportAllSmallRhymes(); break;
    case 'exportAllSyllables': handleExportAllSyllables(); break;
    case 'exportAllSyllablesWithCount': handleExportAllSyllablesWithCount(); break;
    default: break;
  }
}

/* 8. 處理匯出的函數 */

function handleCopy() {
  const outputArea = document.getElementById('outputArea');
  const txt = !outputArea.handleExport
    ? outputArea.innerText
    : outputArea.handleExport(); // A user-defined attribute

  if (!txt) {
    notifyErrorWithoutStack(new Error('請先進行操作，再匯出結果'));
  } else {
    copyTextToClipboard(txt);
  }
}

/* 9. 處理匯出為 HTML 程式碼的函數 */

function handleRuby() {
  const outputArea = document.getElementById('outputArea');
  const txt = !outputArea.handleRuby
    ? outputArea.innerText
    : outputArea.handleRuby(); // A user-defined attribute

  if (!txt) {
    notifyErrorWithoutStack(new Error('請先進行操作，再匯出結果'));
  } else {
    copyTextToClipboard(txt);
  }
}

/* 10. 顯示私隱權政策 */

function showPrivacy() {
  notifyHTML(`<div style="text-align: initial;">
<h1>私隱權政策</h1>
<p>《切韻》音系自動推導器（下稱「本頁面」）是一項開放原始碼的網絡服務。作為本頁面的開發者，我們對閣下的私隱非常重視。本頁面的開發者不會透過本頁面收集閣下的任何資料。</p>
<p>下面將具體介紹本頁面能在何種程度上保障閣下的私隱權。</p>
<h2>閣下鍵入的內容</h2>
<p>本頁面的開發者不會收集閣下在本頁面中鍵入的任何內容。任何與閣下鍵入的內容相關的運算均在閣下的系統本地完成。本頁面不會將包括待標註的文本、標註結果在內的任何資料傳送至任何伺服器。</p>
<h2>閣下的其他資料</h2>
<p>本頁面使用的內容託管於以下站點：GitHub Pages、jsDelivr、Google Fonts、cdnjs。在閣下訪問本頁面時，閣下的瀏覽器將與這些站點交互。本頁面的開發者並不能讀取閣下訪問這些站點時產生的資料，亦無法控制這些站點如何使用閣下訪問時產生的資料。<p>
</div>`);
}
