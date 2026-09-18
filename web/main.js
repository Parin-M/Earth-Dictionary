import { LANGUAGES } from './languages.js';

const MAX_CHUNK = 1200;

const EN = {
  tagline:'Dictionary & translator',
  eyebrow:'Translation',
  hero:'Simple, private, on-device.',
  device:'On device',
  source:'Source language',
  target:'Target language',
  search:'Search languages…',
  input:'Input text',
  clear:'Clear',
  translation:'Translation',
  save:'Save',
  copy:'Copy',
  share:'Share',
  placeholder:'Your translation will appear here.',
  inputPH:'Type or paste text…',
  translate:'Translate',
  export:'Export',
  favorites:'Favorites',
  favoritesHint:'Saved translations',
  history:'History',
  historyHint:'Recent translations',
  about:'About',
  aboutHint:'Earth Dictionary',
  settings:'Settings',
  preferences:'Preferences',
  appLanguage:'App language',
  appLanguageHint:'Use any supported language for the interface.',
  theme:'Theme',
  themeHint:'Choose the look of the app.',
  system:'System',
  light:'Light',
  dark:'Dark',
  textSize:'Text size',
  textSizeHint:'Adjust readability.',
  animations:'Animations',
  animationsHint:'Use soft motion throughout the interface.',
  remember:'Remember languages',
  rememberHint:'Keep your last source and target choice.',
  clearHistory:'Clear local history',
  recent:'Recent translations',
  saved:'Saved translations',
  aboutText:'A minimal dictionary and on-device translator built for private, everyday language work.',
  createdBy:'Created by',
  model:'Translation model',
  version:'Version',
  use:'Use',
  remove:'Remove',
  noHistory:'No translations yet.',
  noFavorites:'No saved translations yet.',
  historyCleared:'History cleared.',
  languageChanged:'Language updated.'
};

const FA = {
  ...EN,
  tagline:'واژه‌نامه و مترجم',
  eyebrow:'ترجمه',
  hero:'ساده، خصوصی و روی خود دستگاه.',
  device:'روی دستگاه',
  source:'زبان مبدأ',
  target:'زبان مقصد',
  search:'جستجوی زبان…',
  input:'متن ورودی',
  clear:'پاک کردن',
  translation:'ترجمه',
  save:'ذخیره',
  copy:'کپی',
  share:'اشتراک‌گذاری',
  placeholder:'ترجمه اینجا نمایش داده می‌شود.',
  inputPH:'متن را وارد یا جای‌گذاری کنید…',
  translate:'ترجمه',
  export:'خروجی',
  favorites:'ذخیره‌شده‌ها',
  favoritesHint:'ترجمه‌های ذخیره‌شده',
  history:'تاریخچه',
  historyHint:'ترجمه‌های اخیر',
  about:'درباره',
  aboutHint:'Earth Dictionary',
  settings:'تنظیمات',
  preferences:'ترجیحات',
  appLanguage:'زبان برنامه',
  appLanguageHint:'زبان رابط را انتخاب کنید.',
  theme:'پوسته',
  themeHint:'ظاهر برنامه را انتخاب کنید.',
  system:'سیستم',
  light:'روشن',
  dark:'تیره',
  textSize:'اندازه متن',
  textSizeHint:'خوانایی متن را تنظیم کنید.',
  animations:'انیمیشن‌ها',
  animationsHint:'حرکت‌های نرم رابط.',
  remember:'به‌خاطر سپاری زبان‌ها',
  rememberHint:'آخرین جفت زبان حفظ شود.',
  clearHistory:'پاک کردن تاریخچه محلی',
  recent:'ترجمه‌های اخیر',
  saved:'ترجمه‌های ذخیره‌شده',
  aboutText:'یک واژه‌نامه و مترجم مینیمال و روی دستگاه، برای استفاده روزمره و خصوصی.',
  createdBy:'ساخته‌شده توسط',
  model:'مدل ترجمه',
  version:'نسخه',
  use:'استفاده',
  remove:'حذف',
  noHistory:'هنوز ترجمه‌ای ثبت نشده است.',
  noFavorites:'هنوز ترجمه‌ای ذخیره نشده است.',
  historyCleared:'تاریخچه پاک شد.',
  languageChanged:'زبان برنامه به‌روز شد.'
};

const $ = (selector) => document.querySelector(selector);
const els = {
  src: $('#sourceLanguage'),
  dst: $('#targetLanguage'),
  app: $('#appLanguage'),
  filter: $('#languageFilter'),
  input: $('#sourceText'),
  out: $('#resultText'),
  go: $('#translate'),
  clear: $('#clear'),
  save: $('#save'),
  copy: $('#copy'),
  share: $('#share'),
  export: $('#export'),
  swap: $('#swap'),
  status: $('#status'),
  count: $('#sourceCount'),
  bar: $('#progressBar'),
  wrap: $('#progressWrap'),
  toast: $('#toast'),
  splash: $('#splash'),
  overlay: $('#overlay'),
  history: $('#historyList'),
  favs: $('#favoritesList'),
  clearHistory: $('#clearHistory'),
  theme: $('#themeSelect'),
  textSize: $('#textSize'),
  animations: $('#animations'),
  remember: $('#rememberLanguages'),
  historyButton: $('#historyButton'),
  settingsButton: $('#settingsButton'),
  openHistory: $('#openHistory'),
  openFavorites: $('#openFavorites'),
  openAbout: $('#openAbout')
};

const state = {
  detected: 'en',
  appLang: localStorage.getItem('earth_app_language') || 'fa',
  nativeReady: false
};

const pending = new Map();
let requestCounter = 0;
let nativeReadyResolve;
let nativeReadyReject;

const nativeReadyPromise = new Promise((resolve, reject) => {
  nativeReadyResolve = resolve;
  nativeReadyReject = reject;
});

window.earthNativeModelReady = (ok, message = '') => {
  state.nativeReady = !!ok;
  if (ok) {
    els.status.textContent = 'M2M100 · ' + (strings()?.device || EN.device);
    nativeReadyResolve();
  } else {
    nativeReadyReject(new Error(message || 'Native M2M100 initialization failed.'));
    els.status.textContent = message || 'Translation engine unavailable.';
  }
};

window.earthNativeTranslationResult = (id, result, ok, message = '') => {
  const resolver = pending.get(id);
  if (!resolver) return;
  pending.delete(id);
  ok
    ? resolver.resolve(result)
    : resolver.reject(new Error(message || 'Translation failed.'));
};

const rtl = (code) => ['ar', 'fa', 'he', 'ps', 'sd', 'ur'].includes(code);
const name = (code) => LANGUAGES.find((item) => item.code === code)?.name || code;

function strings() {
  if (state.appLang === 'fa') return FA;
  if (state.appLang === 'en') return EN;
  return null;
}

async function nativeTranslate(text, src, dst) {
  if (!window.EarthNative) {
    throw new Error('Native engine bridge is unavailable.');
  }

  if (!state.nativeReady) {
    await nativeReadyPromise;
  }

  return new Promise((resolve, reject) => {
    const id = 'r' + (++requestCounter);
    pending.set(id, { resolve, reject });

    try {
      window.EarthNative.translate(id, text, src, dst);
    } catch (error) {
      pending.delete(id);
      reject(error);
    }
  });
}

function opts(select, list) {
  select.replaceChildren(
    ...list.map(([value, text]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      return option;
    })
  );
}

function populate() {
  const query = els.filter.value.trim().toLowerCase();
  const list = query
    ? LANGUAGES.filter((item) => (item.name + item.code).toLowerCase().includes(query))
    : LANGUAGES;

  const activeStrings = strings() || EN;
  opts(els.src, [
    ['auto', state.appLang === 'fa' ? 'تشخیص خودکار' : 'Auto detect'],
    ...list.map((item) => [item.code, `${item.name} — ${item.code}`])
  ]);
  opts(els.dst, list.map((item) => [item.code, `${item.name} — ${item.code}`]));
  opts(els.app, LANGUAGES.map((item) => [item.code, `${item.name} — ${item.code}`]));

  const savedSrc = localStorage.getItem('earth_src') || 'auto';
  const savedDst = localStorage.getItem('earth_dst') || 'en';

  if ([...els.src.options].some((option) => option.value === savedSrc)) {
    els.src.value = savedSrc;
  }
  if ([...els.dst.options].some((option) => option.value === savedDst)) {
    els.dst.value = savedDst;
  }
  els.app.value = state.appLang;

  if (!els.dst.value) els.dst.value = 'en';
  els.status.dataset.readyLabel = activeStrings.device;
}

function detect(text) {
  if (/[پچژگک]/.test(text)) return 'fa';
  if (/[぀-ヿ]/.test(text)) return 'ja';
  if (/[가-힣]/.test(text)) return 'ko';
  if (/[一-鿿]/.test(text)) return 'zh';
  if (/[ऀ-ॿ]/.test(text)) return 'hi';
  if (/[Ѐ-ӿ]/.test(text)) return 'ru';
  if (/[֐-׿]/.test(text)) return 'he';
  if (/[اآأإئء-ي]/.test(text)) return 'ar';
  return 'en';
}

function chunks(text) {
  const result = [];
  let remaining = text.trim();

  while (remaining.length > MAX_CHUNK) {
    let index = remaining.lastIndexOf(' ', MAX_CHUNK);
    if (index < 200) index = MAX_CHUNK;
    result.push(remaining.slice(0, index));
    remaining = remaining.slice(index).trim();
  }

  if (remaining) result.push(remaining);
  return result;
}

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value.slice(0, 50)));
}

function addHist(entry) {
  const history = read('earth_history')
    .filter((item) => !(item.input === entry.input && item.output === entry.output));

  history.unshift(entry);
  write('earth_history', history);
  renderLists();
}

function addFav(entry) {
  const favorites = read('earth_favorites');

  if (!favorites.some((item) => item.input === entry.input && item.output === entry.output)) {
    favorites.unshift(entry);
    write('earth_favorites', favorites);
    toast((strings() || FA).saved);
  }
}

function renderLists() {
  els.history.replaceChildren();
  els.favs.replaceChildren();

  const activeStrings = strings() || EN;

  const draw = (element, list, emptyText, key) => {
    if (!list.length) {
      element.className = 'entry-list empty-state';
      element.textContent = emptyText;
      return;
    }

    element.className = 'entry-list';

    list.forEach((item, index) => {
      const row = document.createElement('article');
      row.className = 'entry-row';
      row.style.setProperty('--item-delay', `${Math.min(index * 35, 280)}ms`);

      const meta = document.createElement('div');
      meta.className = 'entry-meta';
      meta.textContent = `${name(item.source)} → ${name(item.target)}`;

      const input = document.createElement('div');
      input.className = 'entry-input';
      input.textContent = item.input;

      const output = document.createElement('div');
      output.className = 'entry-output';
      output.textContent = item.output;

      const actions = document.createElement('div');
      actions.className = 'entry-actions';

      const useButton = document.createElement('button');
      useButton.className = 'tiny-button';
      useButton.type = 'button';
      useButton.textContent = activeStrings.use;
      useButton.addEventListener('click', () => {
        els.src.value = item.source;
        els.dst.value = item.target;
        els.input.value = item.input;
        els.out.textContent = item.output;
        els.input.dispatchEvent(new Event('input'));
        closeModals();
      });

      const removeButton = document.createElement('button');
      removeButton.className = 'tiny-button ghost';
      removeButton.type = 'button';
      removeButton.textContent = activeStrings.remove;
      removeButton.addEventListener('click', () => {
        write(key, read(key).filter((saved) => !(saved.input === item.input && saved.output === item.output)));
        renderLists();
      });

      actions.append(useButton, removeButton);
      row.append(meta, input, output, actions);
      element.appendChild(row);
    });
  };

  draw(els.history, read('earth_history'), activeStrings.noHistory, 'earth_history');
  draw(els.favs, read('earth_favorites'), activeStrings.noFavorites, 'earth_favorites');
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove('show'), 1800);
}

function openModal(id) {
  const modalElement = $(id);
  if (!modalElement) return;

  document.querySelectorAll('.modal.show').forEach((element) => element.classList.remove('show'));
  els.overlay.hidden = false;
  modalElement.hidden = false;

  requestAnimationFrame(() => {
    els.overlay.classList.add('show');
    modalElement.classList.add('show');
    modalElement.querySelector('.close-button')?.focus();
  });
}

function closeModals() {
  els.overlay.classList.remove('show');
  document.querySelectorAll('.modal.show').forEach((element) => element.classList.remove('show'));

  setTimeout(() => {
    els.overlay.hidden = true;
    document.querySelectorAll('.modal').forEach((element) => {
      element.hidden = true;
    });
  }, 220);
}

function theme(value) {
  document.documentElement.dataset.theme = value;
  localStorage.setItem('earth_theme', value);
}

function motion(enabled) {
  document.documentElement.classList.toggle('motion-off', !enabled);
  localStorage.setItem('earth_motion', enabled ? '1' : '0');
}

async function applyLanguage() {
  let activeStrings = strings();

  if (!activeStrings) {
    const cached = localStorage.getItem('earth_ui_' + state.appLang);

    if (cached) {
      try {
        activeStrings = JSON.parse(cached);
      } catch {
        activeStrings = null;
      }
    }

    if (!activeStrings) {
      activeStrings = { ...EN };

      for (const key of Object.keys(EN)) {
        try {
          activeStrings[key] = await nativeTranslate(EN[key], 'en', state.appLang);
        } catch {
          activeStrings[key] = EN[key];
        }
      }

      localStorage.setItem('earth_ui_' + state.appLang, JSON.stringify(activeStrings));
    }
  }

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const value = activeStrings[node.dataset.i18n];
    if (value) node.textContent = value;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    const value = activeStrings[node.dataset.i18nPlaceholder];
    if (value) node.placeholder = value;
  });

  document.documentElement.lang = state.appLang;
  document.documentElement.dir = rtl(state.appLang) ? 'rtl' : 'ltr';

  populate();
  renderLists();
}

els.go.addEventListener('click', async () => {
  const text = els.input.value.trim();
  if (!text) return;

  const source = els.src.value === 'auto' ? detect(text) : els.src.value;
  const target = els.dst.value;
  const activeStrings = strings() || FA;

  state.detected = source;

  if (source === target) {
    els.out.textContent = text;
    els.status.textContent = activeStrings.device;
    return;
  }

  els.go.disabled = true;
  els.wrap.hidden = false;
  els.bar.style.width = '0%';
  els.status.textContent = activeStrings.translation + '…';

  try {
    const parts = chunks(text);
    const translated = [];

    for (let index = 0; index < parts.length; index++) {
      translated.push(await nativeTranslate(parts[index], source, target));
      els.bar.style.width = `${((index + 1) / parts.length) * 100}%`;
    }

    els.out.textContent = translated.join('\n\n');
    els.out.classList.remove('reveal');
    void els.out.offsetWidth;
    els.out.classList.add('reveal');

    addHist({
      source,
      target,
      input: text,
      output: els.out.textContent,
      at: Date.now()
    });
  } catch (error) {
    els.out.textContent = error?.message || 'Translation failed.';
    console.error(error);
  } finally {
    els.go.disabled = false;
    els.wrap.hidden = true;
    els.status.textContent = (strings() || EN).device;
  }
});

els.input.addEventListener('input', () => {
  els.count.textContent = els.input.value.length.toLocaleString();
});

els.filter.addEventListener('input', populate);

els.clear.addEventListener('click', () => {
  els.input.value = '';
  els.out.textContent = (strings() || FA).placeholder;
  els.count.textContent = '0';
  els.input.focus();
});

els.copy.addEventListener('click', async () => {
  if (!els.out.textContent.trim()) return;
  try {
    await navigator.clipboard?.writeText(els.out.textContent);
    toast((strings() || FA).copy);
  } catch {
    toast('Copy unavailable');
  }
});

els.save.addEventListener('click', () => {
  const output = els.out.textContent.trim();

  if (
    els.input.value.trim() &&
    output &&
    output !== (strings() || FA).placeholder
  ) {
    addFav({
      source: els.src.value === 'auto' ? state.detected : els.src.value,
      target: els.dst.value,
      input: els.input.value,
      output,
      at: Date.now()
    });
  }
});

els.share.addEventListener('click', async () => {
  try {
    await navigator.share?.({
      title: 'Earth Dictionary',
      text: els.out.textContent
    });
    toast((strings() || FA).share);
  } catch {
    // User cancelled or WebView does not support sharing.
  }
});

els.export.addEventListener('click', () => {
  const blob = new Blob([els.out.textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'translation.txt';
  link.click();
  URL.revokeObjectURL(url);
});

els.swap.addEventListener('click', () => {
  const source = els.src.value;
  const target = els.dst.value;

  if (source === 'auto') {
    els.src.value = target;
    els.dst.value = state.detected || 'en';
  } else {
    els.src.value = target;
    els.dst.value = source;
  }

  localStorage.setItem('earth_src', els.src.value);
  localStorage.setItem('earth_dst', els.dst.value);
});

els.src.addEventListener('change', () => localStorage.setItem('earth_src', els.src.value));
els.dst.addEventListener('change', () => localStorage.setItem('earth_dst', els.dst.value));

els.app.addEventListener('change', async (event) => {
  const previous = state.appLang;
  state.appLang = event.target.value;
  localStorage.setItem('earth_app_language', state.appLang);

  try {
    await applyLanguage();
    toast((strings() || EN).languageChanged);
  } catch (error) {
    state.appLang = previous;
    localStorage.setItem('earth_app_language', previous);
    await applyLanguage();
    toast(error?.message || 'Language update failed.');
  }
});

els.settingsButton.addEventListener('click', () => openModal('#settingsModal'));
els.historyButton.addEventListener('click', () => openModal('#historyModal'));
els.openHistory.addEventListener('click', () => openModal('#historyModal'));
els.openFavorites.addEventListener('click', () => openModal('#favoritesModal'));
els.openAbout.addEventListener('click', () => openModal('#aboutModal'));

els.overlay.addEventListener('click', closeModals);
document.querySelectorAll('[data-close-modal]').forEach((button) => {
  button.addEventListener('click', closeModals);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModals();
});

els.theme.addEventListener('change', (event) => theme(event.target.value));

els.textSize.addEventListener('input', (event) => {
  document.documentElement.style.setProperty('--scale', event.target.value);
  localStorage.setItem('earth_text_size', event.target.value);
});

els.animations.addEventListener('change', (event) => motion(event.target.checked));

els.remember.addEventListener('change', (event) => {
  localStorage.setItem('earth_remember', event.target.checked ? '1' : '0');
});

els.clearHistory.addEventListener('click', () => {
  localStorage.removeItem('earth_history');
  renderLists();
  toast((strings() || FA).historyCleared);
});

function init() {
  theme(localStorage.getItem('earth_theme') || 'system');

  const textSize = localStorage.getItem('earth_text_size') || '1';
  els.textSize.value = textSize;
  document.documentElement.style.setProperty('--scale', textSize);

  const animationsEnabled = localStorage.getItem('earth_motion') !== '0';
  els.animations.checked = animationsEnabled;
  motion(animationsEnabled);

  els.remember.checked = localStorage.getItem('earth_remember') !== '0';

  populate();
  renderLists();

  // Never let UI initialization keep the splash visible.
  applyLanguage().catch((error) => {
    console.error('UI language initialization failed', error);
  });

  setTimeout(() => {
    els.splash.classList.add('hide');
    els.splash.setAttribute('aria-hidden', 'true');
  }, 650);
}

init();
