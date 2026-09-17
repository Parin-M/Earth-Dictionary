import { pipeline, env } from '@huggingface/transformers';
import { LANGUAGES } from './languages.js';

const MODEL_ID = 'Xenova/nllb-200-distilled-600M';
const MAX_CHUNK_CHARS = 1200;

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.useBrowserCache = false;
env.localModelPath = '/models/';
env.backends.onnx.wasm.wasmPaths = '/wasm/';
env.backends.onnx.wasm.numThreads = 1;

globalThis.process = globalThis.process || { env: {} };

const sourceSelect = document.querySelector('#sourceLanguage');
const targetSelect = document.querySelector('#targetLanguage');
const sourceText = document.querySelector('#sourceText');
const resultText = document.querySelector('#resultText');
const translateButton = document.querySelector('#translate');
const status = document.querySelector('#status');
const copyButton = document.querySelector('#copy');
const clearButton = document.querySelector('#clear');
const swapButton = document.querySelector('#swap');
const sourceCount = document.querySelector('#sourceCount');
const languageFilter = document.querySelector('#languageFilter');
const progressWrap = document.querySelector('#progressWrap');
const progressBar = document.querySelector('#progressBar');

let allLanguages = [...LANGUAGES].sort((a, b) => a.name.localeCompare(b.name));
let translatorPromise = null;
let activeFilter = '';
let detectedSource = 'eng_Latn';

function addOption(select, code, name) {
  const option = document.createElement('option');
  option.value = code;
  option.textContent = name;
  select.appendChild(option);
}

function populateLanguages() {
  const previousSource = sourceSelect.value;
  const previousTarget = targetSelect.value;
  sourceSelect.replaceChildren();
  targetSelect.replaceChildren();
  addOption(sourceSelect, 'auto', 'تشخیص خودکار');
  const items = activeFilter
    ? allLanguages.filter(x => `${x.name} ${x.code}`.toLowerCase().includes(activeFilter.toLowerCase()))
    : allLanguages;
  for (const lang of items) {
    addOption(sourceSelect, lang.code, `${lang.name} — ${lang.code}`);
    addOption(targetSelect, lang.code, `${lang.name} — ${lang.code}`);
  }
  sourceSelect.value = items.some(x => x.code === previousSource) ? previousSource : 'auto';
  targetSelect.value = items.some(x => x.code === previousTarget) ? previousTarget : 'eng_Latn';
}

function setStatus(message, busy = false) {
  status.textContent = message;
  translateButton.disabled = busy;
  if (!busy) {
    progressWrap.hidden = true;
    progressBar.style.width = '0%';
  }
}

function detectLanguage(text) {
  if (!text.trim()) return 'eng_Latn';
  if (/[پچژگک]/.test(text)) return 'pes_Arab';
  if (/[߀-ࣿ]/.test(text)) return 'arb_Arab';
  if (/[぀-ヿ]/.test(text)) return 'jpn_Jpan';
  if (/[가-힯]/.test(text)) return 'kor_Hang';
  if (/[一-鿿]/.test(text)) return 'zho_Hans';
  if (/[ऀ-ॿ]/.test(text)) return 'hin_Deva';
  if (/[ঀ-৿]/.test(text)) return 'ben_Beng';
  if (/[஀-௿]/.test(text)) return 'tam_Taml';
  if (/[ఀ-౿]/.test(text)) return 'tel_Telu';
  if (/[ഀ-ൿ]/.test(text)) return 'mal_Mlym';
  if (/[Ѐ-ӿ]/.test(text)) return 'rus_Cyrl';
  if (/[Ͱ-Ͽ]/.test(text)) return 'ell_Grek';
  if (/[԰-֏]/.test(text)) return 'hye_Armn';
  if (/[Ⴀ-ჿ]/.test(text)) return 'kat_Geor';
  if (/[֐-׿]/.test(text)) return 'heb_Hebr';
  return 'eng_Latn';
}

function splitText(text) {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (normalized.length <= MAX_CHUNK_CHARS) return [normalized];
  const pieces = [];
  let rest = normalized;
  while (rest.length > MAX_CHUNK_CHARS) {
    let cut = rest.lastIndexOf('\n', MAX_CHUNK_CHARS);
    if (cut < MAX_CHUNK_CHARS * 0.55) cut = rest.lastIndexOf('۔', MAX_CHUNK_CHARS);
    if (cut < MAX_CHUNK_CHARS * 0.55) cut = rest.lastIndexOf('.', MAX_CHUNK_CHARS);
    if (cut < MAX_CHUNK_CHARS * 0.55) cut = rest.lastIndexOf(' ', MAX_CHUNK_CHARS);
    if (cut < 1) cut = MAX_CHUNK_CHARS;
    pieces.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) pieces.push(rest);
  return pieces;
}

async function getTranslator() {
  if (!translatorPromise) {
    setStatus('در حال بارگذاری مدل ترجمه روی دستگاه…', true);
    translatorPromise = pipeline('translation', MODEL_ID, {
      dtype: 'q8',
      device: 'wasm',
      progress_callback: progress => {
        if (typeof progress?.progress === 'number') {
          progressWrap.hidden = false;
          progressBar.style.width = `${Math.max(0, Math.min(100, progress.progress))}%`;
        }
        if (progress?.status === 'progress') setStatus(`در حال آماده‌سازی مدل… ${Math.round(progress.progress || 0)}%`, true);
        else if (progress?.status === 'ready') setStatus('مدل آماده است.', false);
      }
    });
  }
  return translatorPromise;
}

async function translate() {
  const text = sourceText.value.trim();
  if (!text) {
    setStatus('ابتدا متن ورودی را وارد کنید.');
    return;
  }
  const source = sourceSelect.value === 'auto' ? detectLanguage(text) : sourceSelect.value;
  const target = targetSelect.value;
  detectedSource = source;
  if (source === target) {
    resultText.textContent = text;
    setStatus('زبان مبدأ و مقصد یکسان است.');
    return;
  }

  resultText.textContent = 'در حال ترجمه…';
  setStatus(`ترجمهٔ آفلاین ${LANGUAGES.find(x => x.code === source)?.name || source} → ${LANGUAGES.find(x => x.code === target)?.name || target}`, true);
  progressWrap.hidden = false;
  progressBar.style.width = '0%';

  try {
    const translator = await getTranslator();
    const chunks = splitText(text);
    const outputs = [];
    for (let i = 0; i < chunks.length; i += 1) {
      const out = await translator(chunks[i], {
        src_lang: source,
        tgt_lang: target,
        max_new_tokens: 256
      });
      outputs.push(Array.isArray(out) ? out[0]?.translation_text ?? '' : String(out));
      progressBar.style.width = `${Math.round(((i + 1) / chunks.length) * 100)}%`;
    }
    const finalText = outputs.join('\n\n');
    resultText.textContent = finalText || 'ترجمه‌ای تولید نشد.';
    localStorage.setItem('earth_dictionary_last_translation', JSON.stringify({ source, target, input: text, output: finalText, at: Date.now() }));
    setStatus('ترجمه با موفقیت و کاملاً روی دستگاه انجام شد.');
  } catch (error) {
    console.error(error);
    translatorPromise = null;
    resultText.textContent = 'خطا در اجرای مدل ترجمه.';
    setStatus(`خطا: ${error?.message || 'مدل یا فایل‌های آن پیدا نشد.'}`);
  } finally {
    translateButton.disabled = false;
    progressWrap.hidden = true;
  }
}

translateButton.addEventListener('click', translate);
sourceText.addEventListener('input', () => {
  sourceCount.textContent = sourceText.value.length.toLocaleString('fa-IR');
});
clearButton.addEventListener('click', () => {
  sourceText.value = '';
  resultText.textContent = 'ترجمه اینجا نمایش داده می‌شود.';
  sourceCount.textContent = '۰';
  setStatus('متن پاک شد.');
});
copyButton.addEventListener('click', async () => {
  const text = resultText.textContent.trim();
  if (!text || text === 'ترجمه اینجا نمایش داده می‌شود.') return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const temp = document.createElement('textarea');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    temp.remove();
  }
  setStatus('ترجمه در کلیپ‌بورد کپی شد.');
});
swapButton.addEventListener('click', () => {
  const currentSource = sourceSelect.value;
  const currentTarget = targetSelect.value;
  if (currentSource !== 'auto') {
    sourceSelect.value = currentTarget;
    targetSelect.value = currentSource;
  } else {
    sourceSelect.value = detectedSource;
    targetSelect.value = currentTarget;
  }
  const oldInput = sourceText.value;
  sourceText.value = resultText.textContent === 'ترجمه اینجا نمایش داده می‌شود.' ? oldInput : resultText.textContent;
  resultText.textContent = oldInput || 'ترجمه اینجا نمایش داده می‌شود.';
  sourceCount.textContent = sourceText.value.length.toLocaleString('fa-IR');
  setStatus('زبان‌ها جابه‌جا شدند.');
});
languageFilter.addEventListener('input', event => {
  activeFilter = event.target.value.trim();
  populateLanguages();
});

populateLanguages();
sourceSelect.value = 'auto';
targetSelect.value = 'eng_Latn';
setStatus('آماده. هیچ متنی به اینترنت ارسال نمی‌شود.');
