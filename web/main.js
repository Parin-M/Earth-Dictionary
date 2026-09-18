import { LANGUAGES } from './languages.js';

const MAX_CHUNK = 1100;

const EN = {
  tagline:'Dictionary & translator', eyebrow:'Translation', hero:'Fast, private, on-device.',
  device:'On device', source:'Source language', target:'Target language', search:'Search languages…',
  input:'Input text', clear:'Clear', translation:'Translation', save:'Save', copy:'Copy', share:'Share',
  placeholder:'Your translation will appear here.', inputPH:'Type or paste text…', translate:'Translate',
  translateImage:'Translate image', imageHint:'Pick a photo. Text is extracted on-device and translated.',
  export:'Export', favorites:'Favorites', favoritesHint:'Saved translations', history:'History',
  historyHint:'Recent translations', about:'About', aboutHint:'Earth Dictionary', settings:'Settings',
  preferences:'Preferences', appLanguage:'App language', appLanguageHint:'Choose the interface language.',
  theme:'Theme', themeHint:'Choose the look of the app.', system:'System', light:'Light', dark:'Dark',
  textSize:'Text size', textSizeHint:'Adjust readability.', animations:'Animations',
  animationsHint:'Use smooth motion throughout the interface.', remember:'Remember languages',
  rememberHint:'Keep your last source and target choice.', quality:'Translation quality',
  qualityHint:'Balance speed and translation quality.', fast:'Fast', balanced:'Balanced',
  qualityMode:'High quality', maxOutput:'Maximum output', maxOutputHint:'Maximum tokens per segment.',
  clearHistory:'Clear local history', recent:'Recent translations', saved:'Saved translations',
  aboutText:'A modern offline dictionary and translator with on-device OCR. No cloud translation is required.',
  createdBy:'Created by', model:'Translation model', ocr:'Image OCR', version:'Version',
  use:'Use', remove:'Remove', noHistory:'No translations yet.', noFavorites:'No saved translations yet.',
  historyCleared:'History cleared.', languageChanged:'Language updated.', extracting:'Extracting text…',
  translatingImage:'Translating image text…', noText:'No readable text was found in the image.',
  imageError:'Could not read this image.'
};

const FA = {...EN,
  tagline:'واژه‌نامه و مترجم', eyebrow:'ترجمه', hero:'سریع، خصوصی و روی خود دستگاه.',
  device:'روی دستگاه', source:'زبان مبدأ', target:'زبان مقصد', search:'جستجوی زبان…',
  input:'متن ورودی', clear:'پاک کردن', translation:'ترجمه', save:'ذخیره', copy:'کپی', share:'اشتراک‌گذاری',
  placeholder:'ترجمه اینجا نمایش داده می‌شود.', inputPH:'متن را وارد یا جای‌گذاری کنید…', translate:'ترجمه',
  translateImage:'ترجمه تصویر', imageHint:'یک عکس انتخاب کنید؛ متن روی خود دستگاه استخراج و ترجمه می‌شود.',
  export:'خروجی', favorites:'ذخیره‌شده‌ها', favoritesHint:'ترجمه‌های ذخیره‌شده', history:'تاریخچه',
  historyHint:'ترجمه‌های اخیر', about:'درباره', aboutHint:'Earth Dictionary', settings:'تنظیمات',
  preferences:'ترجیحات', appLanguage:'زبان برنامه', appLanguageHint:'زبان رابط را انتخاب کنید.',
  theme:'پوسته', themeHint:'ظاهر برنامه را انتخاب کنید.', system:'سیستم', light:'روشن', dark:'تیره',
  textSize:'اندازه متن', textSizeHint:'خوانایی متن را تنظیم کنید.', animations:'انیمیشن‌ها',
  animationsHint:'حرکت‌های نرم رابط.', remember:'به‌خاطر سپاری زبان‌ها', rememberHint:'آخرین جفت زبان حفظ شود.',
  quality:'کیفیت ترجمه', qualityHint:'بین سرعت و کیفیت ترجمه تعادل ایجاد کنید.', fast:'سریع', balanced:'متعادل',
  qualityMode:'کیفیت بالا', maxOutput:'حداکثر خروجی', maxOutputHint:'حداکثر توکن برای هر بخش.',
  clearHistory:'پاک کردن تاریخچه محلی', recent:'ترجمه‌های اخیر', saved:'ترجمه‌های ذخیره‌شده',
  aboutText:'واژه‌نامه و مترجم مدرن و کاملاً آفلاین با OCR روی دستگاه. ترجمه ابری لازم نیست.',
  createdBy:'ساخته‌شده توسط', model:'مدل ترجمه', ocr:'OCR تصویر', version:'نسخه', use:'استفاده',
  remove:'حذف', noHistory:'هنوز ترجمه‌ای ثبت نشده است.', noFavorites:'هنوز ترجمه‌ای ذخیره نشده است.',
  historyCleared:'تاریخچه پاک شد.', languageChanged:'زبان برنامه به‌روز شد.', extracting:'در حال استخراج متن…',
  translatingImage:'در حال ترجمه متن تصویر…', noText:'متن قابل خواندن در تصویر پیدا نشد.', imageError:'خواندن تصویر ممکن نبود.'
};

const UI_TRANSLATIONS = {
  en:EN, fa:FA,
  ar:{...EN,tagline:'قاموس ومترجم',source:'لغة المصدر',target:'اللغة الهدف',input:'النص المدخل',clear:'مسح',translation:'الترجمة',translate:'ترجمة',translateImage:'ترجمة صورة',history:'السجل',about:'حول التطبيق',settings:'الإعدادات',appLanguage:'لغة التطبيق',theme:'المظهر',quality:'جودة الترجمة',fast:'سريع',balanced:'متوازن',qualityMode:'جودة عالية',maxOutput:'الحد الأقصى للإخراج',favorites:'المفضلة',save:'حفظ',copy:'نسخ',share:'مشاركة',export:'تصدير',createdBy:'تم التطوير بواسطة',model:'نموذج الترجمة',ocr:'OCR للصور',version:'الإصدار',noHistory:'لا توجد ترجمات بعد.',noFavorites:'لا توجد ترجمات محفوظة بعد.',historyCleared:'تم مسح السجل.',languageChanged:'تم تحديث اللغة.'},
  az:{...EN,tagline:'Lüğət və tərcüməçi',source:'Mənbə dili',target:'Hədəf dili',input:'Giriş mətni',clear:'Təmizlə',translation:'Tərcümə',translate:'Tərcümə et',translateImage:'Şəkli tərcümə et',history:'Tarixçə',about:'Haqqında',settings:'Ayarlar',appLanguage:'Tətbiq dili',theme:'Mövzu',quality:'Tərcümə keyfiyyəti',fast:'Sürətli',balanced:'Balanslı',qualityMode:'Yüksək keyfiyyət',maxOutput:'Maksimum çıxış',favorites:'Seçilmişlər',save:'Saxla',copy:'Kopyala',share:'Paylaş',export:'İxrac et',createdBy:'Hazırlayan',model:'Tərcümə modeli',ocr:'Şəkil OCR',version:'Versiya',noHistory:'Hələ tərcümə yoxdur.',noFavorites:'Hələ saxlanmış tərcümə yoxdur.'},
  tr:{...EN,tagline:'Sözlük ve çevirmen',source:'Kaynak dil',target:'Hedef dil',input:'Giriş metni',clear:'Temizle',translation:'Çeviri',translate:'Çevir',translateImage:'Resmi çevir',history:'Geçmiş',about:'Hakkında',settings:'Ayarlar',appLanguage:'Uygulama dili',theme:'Tema',quality:'Çeviri kalitesi',fast:'Hızlı',balanced:'Dengeli',qualityMode:'Yüksek kalite',maxOutput:'Maksimum çıktı',favorites:'Favoriler',save:'Kaydet',copy:'Kopyala',share:'Paylaş',export:'Dışa aktar',createdBy:'Geliştiren',model:'Çeviri modeli',ocr:'Görüntü OCR',version:'Sürüm'},
  ru:{...EN,tagline:'Словарь и переводчик',source:'Исходный язык',target:'Целевой язык',input:'Исходный текст',clear:'Очистить',translation:'Перевод',translate:'Перевести',translateImage:'Перевести изображение',history:'История',about:'О приложении',settings:'Настройки',appLanguage:'Язык приложения',theme:'Тема',quality:'Качество перевода',fast:'Быстро',balanced:'Баланс',qualityMode:'Высокое качество',maxOutput:'Максимальный вывод',favorites:'Избранное',save:'Сохранить',copy:'Копировать',share:'Поделиться',export:'Экспорт',createdBy:'Разработано',model:'Модель перевода',ocr:'OCR изображений',version:'Версия'},
  es:{...EN,tagline:'Diccionario y traductor',source:'Idioma de origen',target:'Idioma de destino',input:'Texto de entrada',clear:'Limpiar',translation:'Traducción',translate:'Traducir',translateImage:'Traducir imagen',history:'Historial',about:'Acerca de',settings:'Ajustes',appLanguage:'Idioma de la app',theme:'Tema',quality:'Calidad de traducción',fast:'Rápida',balanced:'Equilibrada',qualityMode:'Alta calidad',maxOutput:'Salida máxima',favorites:'Favoritos',save:'Guardar',copy:'Copiar',share:'Compartir',export:'Exportar',createdBy:'Creado por',model:'Modelo de traducción',ocr:'OCR de imágenes',version:'Versión'},
  fr:{...EN,tagline:'Dictionnaire et traducteur',source:'Langue source',target:'Langue cible',input:'Texte source',clear:'Effacer',translation:'Traduction',translate:'Traduire',translateImage:'Traduire une image',history:'Historique',about:'À propos',settings:'Réglages',appLanguage:'Langue de l’app',theme:'Thème',quality:'Qualité de traduction',fast:'Rapide',balanced:'Équilibré',qualityMode:'Haute qualité',maxOutput:'Sortie maximale',favorites:'Favoris',save:'Enregistrer',copy:'Copier',share:'Partager',export:'Exporter',createdBy:'Créé par',model:'Modèle de traduction',ocr:'OCR des images',version:'Version'},
  de:{...EN,tagline:'Wörterbuch und Übersetzer',source:'Ausgangssprache',target:'Zielsprache',input:'Eingabetext',clear:'Löschen',translation:'Übersetzung',translate:'Übersetzen',translateImage:'Bild übersetzen',history:'Verlauf',about:'Über',settings:'Einstellungen',appLanguage:'App-Sprache',theme:'Design',quality:'Übersetzungsqualität',fast:'Schnell',balanced:'Ausgewogen',qualityMode:'Hohe Qualität',maxOutput:'Maximale Ausgabe',favorites:'Favoriten',save:'Speichern',copy:'Kopieren',share:'Teilen',export:'Exportieren',createdBy:'Erstellt von',model:'Übersetzungsmodell',ocr:'Bild-OCR',version:'Version'},
  zh:{...EN,tagline:'词典与翻译器',source:'源语言',target:'目标语言',input:'输入文本',clear:'清除',translation:'翻译',translate:'翻译',translateImage:'翻译图片',history:'历史记录',about:'关于',settings:'设置',appLanguage:'应用语言',theme:'主题',quality:'翻译质量',fast:'快速',balanced:'均衡',qualityMode:'高质量',maxOutput:'最大输出',favorites:'收藏',save:'保存',copy:'复制',share:'分享',export:'导出',createdBy:'开发者',model:'翻译模型',ocr:'图片 OCR',version:'版本'},
  ja:{...EN,tagline:'辞書・翻訳アプリ',source:'原文の言語',target:'翻訳先の言語',input:'入力テキスト',clear:'クリア',translation:'翻訳',translate:'翻訳する',translateImage:'画像を翻訳',history:'履歴',about:'このアプリについて',settings:'設定',appLanguage:'アプリの言語',theme:'テーマ',quality:'翻訳品質',fast:'高速',balanced:'バランス',qualityMode:'高品質',maxOutput:'最大出力',favorites:'お気に入り',save:'保存',copy:'コピー',share:'共有',export:'書き出す',createdBy:'制作',model:'翻訳モデル',ocr:'画像 OCR',version:'バージョン'},
  ko:{...EN,tagline:'사전 및 번역기',source:'원본 언어',target:'대상 언어',input:'입력 텍스트',clear:'지우기',translation:'번역',translate:'번역하기',translateImage:'이미지 번역',history:'기록',about:'정보',settings:'설정',appLanguage:'앱 언어',theme:'테마',quality:'번역 품질',fast:'빠름',balanced:'균형',qualityMode:'고품질',maxOutput:'최대 출력',favorites:'즐겨찾기',save:'저장',copy:'복사',share:'공유',export:'내보내기',createdBy:'제작',model:'번역 모델',ocr:'이미지 OCR',version:'버전'},
  hi:{...EN,tagline:'शब्दकोश और अनुवादक',source:'स्रोत भाषा',target:'लक्ष्य भाषा',input:'इनपुट टेक्स्ट',clear:'साफ़ करें',translation:'अनुवाद',translate:'अनुवाद करें',translateImage:'चित्र का अनुवाद',history:'इतिहास',about:'जानकारी',settings:'सेटिंग्स',appLanguage:'ऐप भाषा',theme:'थीम',quality:'अनुवाद गुणवत्ता',fast:'तेज़',balanced:'संतुलित',qualityMode:'उच्च गुणवत्ता',maxOutput:'अधिकतम आउटपुट',favorites:'पसंदीदा',save:'सहेजें',copy:'कॉपी',share:'साझा करें',export:'निर्यात',createdBy:'द्वारा बनाया गया',model:'अनुवाद मॉडल',ocr:'चित्र OCR',version:'संस्करण'},
  ur:{...FA,tagline:'لغت اور مترجم',translateImage:'تصویر کا ترجمہ',quality:'ترجمہ معیار',fast:'تیز',balanced:'متوازن',qualityMode:'اعلیٰ معیار',maxOutput:'زیادہ سے زیادہ آؤٹ پٹ'}
};

const UI_LANGS=Object.keys(UI_TRANSLATIONS);
const $=selector=>document.querySelector(selector);

const els={
  src:$('#sourceLanguage'),dst:$('#targetLanguage'),app:$('#appLanguage'),filter:$('#languageFilter'),
  input:$('#sourceText'),out:$('#resultText'),go:$('#translate'),image:$('#translateImage'),
  clear:$('#clear'),save:$('#save'),copy:$('#copy'),share:$('#share'),export:$('#export'),swap:$('#swap'),
  status:$('#status'),count:$('#sourceCount'),bar:$('#progressBar'),wrap:$('#progressWrap'),toast:$('#toast'),
  splash:$('#splash'),overlay:$('#overlay'),history:$('#historyList'),favs:$('#favoritesList'),
  clearHistory:$('#clearHistory'),theme:$('#themeSelect'),textSize:$('#textSize'),animations:$('#animations'),
  remember:$('#rememberLanguages'),quality:$('#translationQuality'),maxOutput:$('#maxOutput'),
  historyButton:$('#historyButton'),settingsButton:$('#settingsButton'),openHistory:$('#openHistory'),
  openFavorites:$('#openFavorites'),openAbout:$('#openAbout')
};

const state={
  detected:'en',
  appLang:localStorage.getItem('earth_app_language')||'fa',
  nativeReady:false,
  beamSize:Number(localStorage.getItem('earth_beam_size')||'5'),
  maxTokens:Number(localStorage.getItem('earth_max_tokens')||'256')
};

const pending=new Map();
const pendingOcr=new Map();
let requestCounter=0;
let ocrCounter=0;
let nativeReadyResolve,nativeReadyReject;
const nativeReadyPromise=new Promise((resolve,reject)=>{nativeReadyResolve=resolve;nativeReadyReject=reject});

window.earthNativeModelReady=(ok,message='')=>{
  state.nativeReady=!!ok;
  if(ok){
    try{window.EarthNative.setBeamSize?.(state.beamSize);window.EarthNative.setMaxOutput?.(state.maxTokens)}catch{}
    els.status.textContent='M2M100 · '+strings().device;
    nativeReadyResolve();
  }else{
    nativeReadyReject(new Error(message||'Native M2M100 initialization failed.'));
    els.status.textContent=message||'Translation engine unavailable.';
  }
};

window.earthNativeTranslationResult=(id,result,ok,message='')=>{
  const resolver=pending.get(id);if(!resolver)return;pending.delete(id);
  ok?resolver.resolve(result):resolver.reject(new Error(message||'Translation failed.'));
};

window.earthNativeOcrResult=(id,result,ok,message='',hint='')=>{
  const resolver=pendingOcr.get(id);if(!resolver)return;pendingOcr.delete(id);
  ok?resolver.resolve({text:result,hint}):resolver.reject(new Error(message||strings().imageError));
};

const rtl=code=>['ar','fa','he','ps','sd','ur'].includes(code);
const name=code=>LANGUAGES.find(item=>item.code===code)?.name||code;
function strings(){return UI_TRANSLATIONS[state.appLang]||EN}

async function nativeTranslate(text,src,dst){
  if(!window.EarthNative)throw new Error('Native engine bridge is unavailable.');
  if(!state.nativeReady)await nativeReadyPromise;
  return new Promise((resolve,reject)=>{
    const id='r'+(++requestCounter);pending.set(id,{resolve,reject});
    try{window.EarthNative.translate(id,text,src,dst)}catch(error){pending.delete(id);reject(error)}
  });
}

function nativeExtractImage(sourceLang){
  return new Promise((resolve,reject)=>{
    if(!window.EarthNative?.pickImage){reject(new Error(strings().imageError));return}
    const id='o'+(++ocrCounter);pendingOcr.set(id,{resolve,reject});
    try{window.EarthNative.pickImage(id,sourceLang||'auto')}catch(error){pendingOcr.delete(id);reject(error)}
  });
}

function opts(select,list){
  select.replaceChildren(...list.map(([value,text])=>{const option=document.createElement('option');option.value=value;option.textContent=text;return option;}));
}

function populate(){
  const q=els.filter.value.trim().toLowerCase();
  const list=q?LANGUAGES.filter(item=>(item.name+item.code).toLowerCase().includes(q)):LANGUAGES;
  const savedSrc=localStorage.getItem('earth_src')||'auto';
  const savedDst=localStorage.getItem('earth_dst')||'en';

  opts(els.src,[['auto',state.appLang==='fa'?'تشخیص خودکار':'Auto detect'],...list.map(item=>[item.code,`${item.name} — ${item.code}`])]);
  opts(els.dst,list.map(item=>[item.code,`${item.name} — ${item.code}`]));
  opts(els.app,UI_LANGS.map(code=>[code,LANGUAGES.find(item=>item.code===code)?.name||code]));

  if([...els.src.options].some(o=>o.value===savedSrc))els.src.value=savedSrc;
  if([...els.dst.options].some(o=>o.value===savedDst))els.dst.value=savedDst;
  els.app.value=UI_LANGS.includes(state.appLang)?state.appLang:'en';
  if(!els.dst.value)els.dst.value='en';
}

function detect(text){
  if(/[پچژگکۀی]/.test(text)&&/[\u0600-\u06ff]/.test(text))return'fa';
  if(/[぀-ヿ]/.test(text))return'ja';
  if(/[가-힣]/.test(text))return'ko';
  if(/[一-鿿]/.test(text))return'zh';
  if(/[ऀ-ॿ]/.test(text))return'hi';
  if(/[Ѐ-ӿ]/.test(text))return'ru';
  if(/[֐-׿]/.test(text))return'he';
  if(/[اآأإئء-ي]/.test(text))return'ar';
  return'en';
}

function chunks(text){
  const result=[];let remaining=text.trim();
  while(remaining.length>MAX_CHUNK){let index=remaining.lastIndexOf(' ',MAX_CHUNK);if(index<180)index=MAX_CHUNK;result.push(remaining.slice(0,index));remaining=remaining.slice(index).trim()}
  if(remaining)result.push(remaining);
  return result;
}

function read(key){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return[]}}
function write(key,value){localStorage.setItem(key,JSON.stringify(value.slice(0,50)))}

function addHist(entry){
  const history=read('earth_history').filter(item=>!(item.input===entry.input&&item.output===entry.output));
  history.unshift(entry);write('earth_history',history);renderLists();
}

function addFav(entry){
  const favorites=read('earth_favorites');
  if(!favorites.some(item=>item.input===entry.input&&item.output===entry.output)){favorites.unshift(entry);write('earth_favorites',favorites);toast(strings().saved)}
}

function renderLists(){
  els.history.replaceChildren();els.favs.replaceChildren();
  const active=strings();
  const draw=(element,list,emptyText,key)=>{
    if(!list.length){element.className='entry-list empty-state';element.textContent=emptyText;return}
    element.className='entry-list';
    list.forEach((item,index)=>{
      const row=document.createElement('article');row.className='entry-row';row.style.setProperty('--item-delay',`${Math.min(index*30,240)}ms`);
      const meta=document.createElement('div');meta.className='entry-meta';meta.textContent=`${name(item.source)} → ${name(item.target)}`;
      const input=document.createElement('div');input.className='entry-input';input.textContent=item.input;
      const output=document.createElement('div');output.className='entry-output';output.textContent=item.output;
      const actions=document.createElement('div');actions.className='entry-actions';
      const use=document.createElement('button');use.className='tiny-button';use.type='button';use.textContent=active.use;
      use.onclick=()=>{els.src.value=item.source;els.dst.value=item.target;els.input.value=item.input;els.out.textContent=item.output;els.input.dispatchEvent(new Event('input'));closeModals()};
      const remove=document.createElement('button');remove.className='tiny-button ghost';remove.type='button';remove.textContent=active.remove;
      remove.onclick=()=>{write(key,read(key).filter(saved=>!(saved.input===item.input&&saved.output===item.output)));renderLists()};
      actions.append(use,remove);row.append(meta,input,output,actions);element.appendChild(row);
    });
  };
  draw(els.history,read('earth_history'),active.noHistory,'earth_history');
  draw(els.favs,read('earth_favorites'),active.noFavorites,'earth_favorites');
}

function toast(message){
  els.toast.textContent=message;els.toast.classList.add('show');clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>els.toast.classList.remove('show'),1800);
}

function openModal(id){
  const modalElement=$(id);if(!modalElement)return;
  document.querySelectorAll('.modal.show').forEach(e=>e.classList.remove('show'));
  els.overlay.hidden=false;modalElement.hidden=false;
  requestAnimationFrame(()=>{els.overlay.classList.add('show');modalElement.classList.add('show');modalElement.querySelector('.close-button')?.focus()});
}

function closeModals(){
  els.overlay.classList.remove('show');document.querySelectorAll('.modal.show').forEach(e=>e.classList.remove('show'));
  setTimeout(()=>{els.overlay.hidden=true;document.querySelectorAll('.modal').forEach(e=>e.hidden=true)},220);
}

function theme(value){document.documentElement.dataset.theme=value;localStorage.setItem('earth_theme',value)}
function motion(enabled){document.documentElement.classList.toggle('motion-off',!enabled);localStorage.setItem('earth_motion',enabled?'1':'0')}

function applyLanguage(){
  const active=strings();
  document.querySelectorAll('[data-i18n]').forEach(node=>{const value=active[node.dataset.i18n];if(value)node.textContent=value});
  document.querySelectorAll('[data-i18n-placeholder]').forEach(node=>{const value=active[node.dataset.i18nPlaceholder];if(value)node.placeholder=value});
  document.documentElement.lang=state.appLang;
  document.documentElement.dir=rtl(state.appLang)?'rtl':'ltr';
  populate();renderLists();
}

async function doTranslate(){
  const text=els.input.value.trim();if(!text)return;
  const active=strings();
  const source=els.src.value==='auto'?detect(text):els.src.value;
  const target=els.dst.value;state.detected=source;
  if(source===target){els.out.textContent=text;els.status.textContent=active.device;return}
  els.go.disabled=true;els.image.disabled=true;els.wrap.hidden=false;els.bar.style.width='0%';els.status.textContent=active.translation+'…';
  try{
    const parts=chunks(text),translated=[];
    for(let index=0;index<parts.length;index++){translated.push(await nativeTranslate(parts[index],source,target));els.bar.style.width=`${((index+1)/parts.length)*100}%`}
    els.out.textContent=translated.join('\n\n');
    els.out.classList.remove('reveal');void els.out.offsetWidth;els.out.classList.add('reveal');
    addHist({source,target,input:text,output:els.out.textContent,at:Date.now()});
  }catch(error){els.out.textContent=error?.message||'Translation failed.';console.error(error)}
  finally{els.go.disabled=false;els.image.disabled=false;els.wrap.hidden=true;els.status.textContent=active.device}
}

async function doImageTranslate(){
  const active=strings();
  els.image.disabled=true;els.go.disabled=true;els.status.textContent=active.extracting;
  try{
    const picked=await nativeExtractImage(els.src.value);
    if(!picked.text.trim()){toast(active.noText);return}
    els.input.value=picked.text.trim();els.input.dispatchEvent(new Event('input'));
    if(picked.hint&&picked.hint!=='auto'&&els.src.value==='auto'&&[...els.src.options].some(o=>o.value===picked.hint))els.src.value=picked.hint;
    els.status.textContent=active.translatingImage;
    await doTranslate();
  }catch(error){toast(error?.message||active.imageError);console.error(error)}
  finally{els.image.disabled=false;els.go.disabled=false}
}

els.go.addEventListener('click',doTranslate);
els.image.addEventListener('click',doImageTranslate);
els.input.addEventListener('input',()=>els.count.textContent=els.input.value.length.toLocaleString());
els.filter.addEventListener('input',populate);
els.clear.addEventListener('click',()=>{els.input.value='';els.out.textContent=strings().placeholder;els.count.textContent='0';els.input.focus()});
els.copy.addEventListener('click',async()=>{if(!els.out.textContent.trim())return;try{await navigator.clipboard?.writeText(els.out.textContent);toast(strings().copy)}catch{toast('Copy unavailable')}});
els.save.addEventListener('click',()=>{const output=els.out.textContent.trim();if(els.input.value.trim()&&output&&output!==strings().placeholder)addFav({source:els.src.value==='auto'?state.detected:els.src.value,target:els.dst.value,input:els.input.value,output,at:Date.now()})});
els.share.addEventListener('click',async()=>{try{await navigator.share?.({title:'Earth Dictionary',text:els.out.textContent});toast(strings().share)}catch{}});
els.export.addEventListener('click',()=>{const blob=new Blob([els.out.textContent],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='translation.txt';a.click();URL.revokeObjectURL(url)});
els.swap.addEventListener('click',()=>{const source=els.src.value,target=els.dst.value;if(source==='auto'){els.src.value=target;els.dst.value=state.detected||'en'}else{els.src.value=target;els.dst.value=source}localStorage.setItem('earth_src',els.src.value);localStorage.setItem('earth_dst',els.dst.value)});
els.src.addEventListener('change',()=>localStorage.setItem('earth_src',els.src.value));
els.dst.addEventListener('change',()=>localStorage.setItem('earth_dst',els.dst.value));

els.app.addEventListener('change',event=>{state.appLang=event.target.value;localStorage.setItem('earth_app_language',state.appLang);applyLanguage();toast(strings().languageChanged)});
els.settingsButton.addEventListener('click',()=>openModal('#settingsModal'));
els.historyButton.addEventListener('click',()=>openModal('#historyModal'));
els.openHistory.addEventListener('click',()=>openModal('#historyModal'));
els.openFavorites.addEventListener('click',()=>openModal('#favoritesModal'));
els.openAbout.addEventListener('click',()=>openModal('#aboutModal'));
els.overlay.addEventListener('click',closeModals);
document.querySelectorAll('[data-close-modal]').forEach(button=>button.addEventListener('click',closeModals));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeModals()});
els.theme.addEventListener('change',event=>theme(event.target.value));
els.textSize.addEventListener('input',event=>{document.documentElement.style.setProperty('--scale',event.target.value);localStorage.setItem('earth_text_size',event.target.value)});
els.animations.addEventListener('change',event=>motion(event.target.checked));
els.remember.addEventListener('change',event=>localStorage.setItem('earth_remember',event.target.checked?'1':'0'));
els.quality.addEventListener('change',event=>{state.beamSize=Number(event.target.value);localStorage.setItem('earth_beam_size',String(state.beamSize));try{window.EarthNative?.setBeamSize?.(state.beamSize)}catch{}});
els.maxOutput.addEventListener('change',event=>{state.maxTokens=Number(event.target.value);localStorage.setItem('earth_max_tokens',String(state.maxTokens));try{window.EarthNative?.setMaxOutput?.(state.maxTokens)}catch{}});
els.clearHistory.addEventListener('click',()=>{localStorage.removeItem('earth_history');renderLists();toast(strings().historyCleared)});

function init(){
  theme(localStorage.getItem('earth_theme')||'system');
  const textSize=localStorage.getItem('earth_text_size')||'1';els.textSize.value=textSize;document.documentElement.style.setProperty('--scale',textSize);
  const animationsEnabled=localStorage.getItem('earth_motion')!=='0';els.animations.checked=animationsEnabled;motion(animationsEnabled);
  els.remember.checked=localStorage.getItem('earth_remember')!=='0';
  els.quality.value=String(state.beamSize);els.maxOutput.value=String(state.maxTokens);
  populate();renderLists();applyLanguage();
  setTimeout(()=>{els.splash.classList.add('hide');els.splash.setAttribute('aria-hidden','true')},650);
}
init();
