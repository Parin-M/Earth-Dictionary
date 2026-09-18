package com.parinm.earthdictionary;

import android.app.Activity;
import android.content.Intent;
import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.net.Uri;
import android.media.ExifInterface;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.google.android.gms.tasks.Tasks;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;
import com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions;
import com.google.mlkit.vision.text.devanagari.DevanagariTextRecognizerOptions;
import com.google.mlkit.vision.text.japanese.JapaneseTextRecognizerOptions;
import com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions;

import com.googlecode.tesseract.android.TessBaseAPI;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private static final String LOCAL_ORIGIN = "earth.local";
    private static final String START_URL = "https://" + LOCAL_ORIGIN + "/index.html";
    private static final String MODEL_ASSET = "models/m2m100-q4k.gguf";
    private static final String[] TESS_LANGS = {"eng", "fas", "ara", "aze", "heb", "urd"};
    private static final int REQUEST_PICK_IMAGE = 4012;

    private WebView webView;
    private NativeBridge nativeBridge;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView.setWebContentsDebuggingEnabled(false);

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setTextZoom(100);

        nativeBridge = new NativeBridge(this, webView);
        webView.addJavascriptInterface(nativeBridge, "EarthNative");
        webView.setWebViewClient(new OfflineAssetWebViewClient(getAssets(), nativeBridge));
        webView.loadUrl(START_URL);
        setContentView(webView);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_PICK_IMAGE) return;

        if (resultCode != RESULT_OK || data == null || data.getData() == null) {
            nativeBridge.notifyOcrCancelled();
            return;
        }

        Uri imageUri = data.getData();
        String requestId = nativeBridge.takePendingOcrRequest();
        String sourceLang = nativeBridge.takePendingOcrLanguage();

        if (requestId == null) {
            return;
        }

        nativeBridge.processImage(imageUri, requestId, sourceLang);
    }

    @Override
    protected void onDestroy() {
        if (nativeBridge != null) nativeBridge.shutdown();
        if (webView != null) webView.destroy();
        super.onDestroy();
    }

    private static final class NativeBridge {
        private final MainActivity activity;
        private final WebView webView;
        private final ExecutorService executor = Executors.newSingleThreadExecutor();
        private volatile boolean ready;
        private volatile boolean started;
        private volatile String pendingOcrRequestId;
        private volatile String pendingOcrLanguage = "auto";

        NativeBridge(MainActivity activity, WebView webView) {
            this.activity = activity;
            this.webView = webView;
        }

        void start() {
            if (started) return;
            started = true;
            executor.execute(() -> {
                try {
                    File model = prepareModel();
                    ready = NativeTranslator.nativeInit(model.getAbsolutePath());
                    notifyModelReady(ready, ready ? "" : "Native M2M100 initialization failed.");
                } catch (Exception e) {
                    ready = false;
                    notifyModelReady(false, e.getMessage() == null ? "Model initialization failed." : e.getMessage());
                }
            });
        }

        @JavascriptInterface
        public boolean isReady() {
            return ready;
        }

        @JavascriptInterface
        public void setBeamSize(int beam) {
            NativeTranslator.setBeamSize(beam);
        }

        @JavascriptInterface
        public void setMaxOutput(int tokens) {
            NativeTranslator.setMaxOutput(tokens);
        }

        @JavascriptInterface
        public void translate(String requestId, String text, String srcLang, String dstLang) {
            executor.execute(() -> {
                if (!ready) {
                    notifyTranslation(requestId, "", false, "Translation engine is not ready.");
                    return;
                }
                try {
                    String result = NativeTranslator.nativeTranslate(text, srcLang, dstLang);
                    if (result == null || result.isEmpty()) {
                        notifyTranslation(requestId, "", false, "Native M2M100 returned no text.");
                    } else {
                        notifyTranslation(requestId, result, true, "");
                    }
                } catch (Throwable t) {
                    notifyTranslation(requestId, "", false,
                            t.getMessage() == null ? "Native translation failed." : t.getMessage());
                }
            });
        }

        @JavascriptInterface
        public void pickImage(String requestId, String sourceLang) {
            activity.runOnUiThread(() -> {
                pendingOcrRequestId = requestId;
                pendingOcrLanguage = sourceLang == null || sourceLang.isEmpty() ? "auto" : sourceLang;

                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("image/*");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                activity.startActivityForResult(intent, REQUEST_PICK_IMAGE);
            });
        }

        String takePendingOcrRequest() {
            String value = pendingOcrRequestId;
            pendingOcrRequestId = null;
            return value;
        }

        String takePendingOcrLanguage() {
            String value = pendingOcrLanguage;
            pendingOcrLanguage = "auto";
            return value;
        }

        void notifyOcrCancelled() {
            String requestId = takePendingOcrRequest();
            if (requestId != null) notifyOcr(requestId, "", false, "Image selection cancelled.", "");
        }

        void processImage(Uri uri, String requestId, String sourceLang) {
            executor.execute(() -> {
                try {
                    String tessPath = prepareTessData();
                    Bitmap bitmap = loadBitmap(uri);

                    OcrResult result = recognize(bitmap, sourceLang, tessPath);
                    if (result.text.trim().isEmpty()) {
                        notifyOcr(requestId, "", false, "No readable text was found in the image.", "");
                    } else {
                        notifyOcr(requestId, result.text.trim(), true, "", result.hint);
                    }
                } catch (Throwable t) {
                    notifyOcr(requestId, "", false,
                            t.getMessage() == null ? "Could not read this image." : t.getMessage(), "");
                }
            });
        }

        private OcrResult recognize(Bitmap bitmap, String sourceLang, String tessPath) throws Exception {
            String lang = sourceLang == null ? "auto" : sourceLang;

            if (isTesseractLanguage(lang)) {
                String[] languageCandidates;
                if ("auto".equals(lang)) {
                    languageCandidates = new String[]{"fas+ara+aze+heb+urd+eng"};
                } else {
                    languageCandidates = new String[]{tesseractLanguage(lang)};
                }
                OcrResult best = null;
                for (String candidate : languageCandidates) {
                    OcrResult value = recognizeWithTesseract(bitmap, tessPath, candidate);
                    if (best == null || value.confidence > best.confidence ||
                            (value.confidence == best.confidence && value.text.length() > best.text.length())) {
                        best = value;
                    }
                }
                return best == null ? new OcrResult("", 0, hintFromText("")) : best;
            }

            if (!"auto".equals(lang)) {
                TextRecognizer recognizer = recognizerForLanguage(lang);
                if (recognizer == null) {
                    return recognizeWithMlKit(bitmap, "latin");
                }
                try {
                    Text text = Tasks.await(recognizer.process(InputImage.fromBitmap(bitmap, 0)));
                    return new OcrResult(text.getText(), text.getText().length(), lang);
                } finally {
                    recognizer.close();
                }
            }

            OcrResult best = new OcrResult("", -1, "en");
            String[] scripts = {"latin", "chinese", "devanagari", "japanese", "korean"};
            for (String script : scripts) {
                OcrResult value = recognizeWithMlKit(bitmap, script);
                if (value.text.length() > best.text.length()) best = value;
            }

            OcrResult rtl = recognizeWithTesseract(bitmap, tessPath, "fas+ara+aze+heb+urd+eng");
            if (looksRtl(rtl.text) && (!looksRtl(best.text) || rtl.text.length() >= Math.max(12, best.text.length() / 2))) {
                return rtl;
            }

            return best.text.isEmpty() ? rtl : best;
        }

        private TextRecognizer recognizerForLanguage(String lang) {
            switch (lang) {
                case "zh": return TextRecognition.getClient(new ChineseTextRecognizerOptions.Builder().build());
                case "hi": return TextRecognition.getClient(new DevanagariTextRecognizerOptions.Builder().build());
                case "ja": return TextRecognition.getClient(new JapaneseTextRecognizerOptions.Builder().build());
                case "ko": return TextRecognition.getClient(new KoreanTextRecognizerOptions.Builder().build());
                default: return TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
            }
        }

        private OcrResult recognizeWithMlKit(Bitmap bitmap, String script) throws Exception {
            TextRecognizer recognizer;
            switch (script) {
                case "chinese":
                    recognizer = TextRecognition.getClient(new ChineseTextRecognizerOptions.Builder().build());
                    break;
                case "devanagari":
                    recognizer = TextRecognition.getClient(new DevanagariTextRecognizerOptions.Builder().build());
                    break;
                case "japanese":
                    recognizer = TextRecognition.getClient(new JapaneseTextRecognizerOptions.Builder().build());
                    break;
                case "korean":
                    recognizer = TextRecognition.getClient(new KoreanTextRecognizerOptions.Builder().build());
                    break;
                default:
                    recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
                    break;
            }

            try {
                Text text = Tasks.await(recognizer.process(InputImage.fromBitmap(bitmap, 0)));
                return new OcrResult(text.getText(), text.getText().length(), hintFromText(text.getText()));
            } finally {
                recognizer.close();
            }
        }

        private OcrResult recognizeWithTesseract(Bitmap bitmap, String tessPath, String languages) throws Exception {
            TessBaseAPI api = new TessBaseAPI();
            try {
                if (!api.init(tessPath.getAbsolutePath(), languages)) {
                    throw new IOException("Tesseract OCR initialization failed.");
                }
                api.setPageSegMode(TessBaseAPI.PageSegMode.PSM_AUTO);
                api.setImage(bitmap);
                String text = api.getUTF8Text();
                int confidence = api.meanConfidence();
                return new OcrResult(text == null ? "" : text, confidence, hintFromText(text));
            } finally {
                try { api.end(); } catch (Throwable ignored) {}
            }
        }

        private Bitmap loadBitmap(Uri uri) throws IOException {
            try (InputStream input = activity.getContentResolver().openInputStream(uri)) {
                Bitmap bitmap = BitmapFactory.decodeStream(input);
                if (bitmap == null) throw new IOException("Unsupported image.");
                return applyExifRotation(uri, bitmap);
            }
        }

        private Bitmap applyExifRotation(Uri uri, Bitmap bitmap) {
            try (android.os.ParcelFileDescriptor pfd =
                         activity.getContentResolver().openFileDescriptor(uri, "r")) {
                if (pfd == null) return bitmap;

                ExifInterface exif = new ExifInterface(pfd.getFileDescriptor());
                int orientation = exif.getAttributeInt(
                        ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);

                int angle = 0;
                if (orientation == ExifInterface.ORIENTATION_ROTATE_90) angle = 90;
                else if (orientation == ExifInterface.ORIENTATION_ROTATE_180) angle = 180;
                else if (orientation == ExifInterface.ORIENTATION_ROTATE_270) angle = 270;

                if (angle == 0) return bitmap;
                Matrix matrix = new Matrix();
                matrix.postRotate(angle);
                return Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);
            } catch (Throwable ignored) {
                return bitmap;
            }
        }

        private boolean isTesseractLanguage(String lang) {
            return "fa".equals(lang) || "ar".equals(lang) || "az".equals(lang) ||
                    "he".equals(lang) || "ur".equals(lang) || "ps".equals(lang) || "sd".equals(lang);
        }

        private String tesseractLanguage(String lang) {
            switch (lang) {
                case "ar": return "ara";
                case "az": return "aze";
                case "he": return "heb";
                case "ur": return "urd";
                case "ps":
                case "sd":
                case "fa":
                default: return "fas";
            }
        }

        private boolean looksRtl(String text) {
            if (text == null || text.isEmpty()) return false;
            int rtl = 0;
            int letters = 0;
            for (int i = 0; i < text.length(); i++) {
                char c = text.charAt(i);
                if ((c >= 0x0590 && c <= 0x08FF) || (c >= 0xFB1D && c <= 0xFDFF)) rtl++;
                if (Character.isLetter(c)) letters++;
            }
            return rtl >= 3 && rtl * 2 >= Math.max(letters, 1);
        }

        private String hintFromText(String text) {
            if (text == null) return "en";
            if (text.matches("(?s).*[پچژگکۀی].*")) return "fa";
            if (text.matches("(?s).*[\u0590-\u05ff].*")) return "he";
            if (text.matches("(?s).*[\u0600-\u06ff].*")) return "ar";
            if (text.matches("(?s).*[\u4e00-\u9fff].*")) return "zh";
            if (text.matches("(?s).*[\u3040-\u30ff].*")) return "ja";
            if (text.matches("(?s).*[\uac00-\ud7af].*")) return "ko";
            if (text.matches("(?s).*[\u0900-\u097f].*")) return "hi";
            if (text.matches("(?s).*[\u0400-\u04ff].*")) return "ru";
            return "en";
        }

        private File prepareTessData() throws IOException {
            File root = new File(activity.getFilesDir(), "tesseract");
            File data = new File(root, "tessdata");
            if (!data.exists() && !data.mkdirs()) throw new IOException("Cannot create OCR data directory.");

            for (String lang : TESS_LANGS) {
                File target = new File(data, lang + ".traineddata");
                if (target.isFile() && target.length() > 1000) continue;

                try (InputStream input = activity.getAssets().open("tessdata/" + lang + ".traineddata", AssetManager.ACCESS_STREAMING);
                     OutputStream output = new FileOutputStream(target)) {
                    byte[] buffer = new byte[1024 * 64];
                    int read;
                    while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
                    output.flush();
                }
            }
            return root;
        }

        private File prepareModel() throws IOException {
            File model = new File(activity.getFilesDir(), "m2m100-q4k.gguf");
            if (model.isFile() && model.length() > 250_000_000L) return model;

            File tmp = new File(activity.getFilesDir(), "m2m100-q4k.gguf.part");
            if (tmp.exists() && !tmp.delete()) throw new IOException("Cannot replace incomplete model cache.");

            try (InputStream input = activity.getAssets().open(MODEL_ASSET, AssetManager.ACCESS_STREAMING);
                 OutputStream output = new FileOutputStream(tmp)) {
                byte[] buffer = new byte[1024 * 1024];
                int read;
                while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
                output.flush();
            }

            if (!tmp.renameTo(model)) {
                if (model.exists() && !model.delete()) throw new IOException("Cannot replace model cache.");
                if (!tmp.renameTo(model)) throw new IOException("Cannot finalize model cache.");
            }
            return model;
        }

        void shutdown() {
            executor.execute(NativeTranslator::nativeShutdown);
            executor.shutdown();
        }

        private void notifyModelReady(boolean ok, String message) {
            webView.post(() -> webView.evaluateJavascript(
                    "window.earthNativeModelReady(" + ok + "," + JSONObject.quote(message) + ")", null));
        }

        private void notifyTranslation(String requestId, String result, boolean ok, String message) {
            webView.post(() -> webView.evaluateJavascript(
                    "window.earthNativeTranslationResult(" + JSONObject.quote(requestId) + "," +
                            JSONObject.quote(result) + "," + ok + "," + JSONObject.quote(message) + ")", null));
        }

        private void notifyOcr(String requestId, String result, boolean ok, String message, String hint) {
            webView.post(() -> webView.evaluateJavascript(
                    "window.earthNativeOcrResult(" + JSONObject.quote(requestId) + "," +
                            JSONObject.quote(result) + "," + ok + "," +
                            JSONObject.quote(message) + "," + JSONObject.quote(hint == null ? "" : hint) + ")", null));
        }

        private static final class OcrResult {
            final String text;
            final int confidence;
            final String hint;

            OcrResult(String text, int confidence, String hint) {
                this.text = text == null ? "" : text;
                this.confidence = confidence;
                this.hint = hint == null ? "" : hint;
            }
        }
    }

    private static final class OfflineAssetWebViewClient extends WebViewClient {
        private final AssetManager assets;
        private final NativeBridge nativeBridge;

        OfflineAssetWebViewClient(AssetManager assets, NativeBridge nativeBridge) {
            this.assets = assets;
            this.nativeBridge = nativeBridge;
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            if (url != null && url.startsWith(START_URL)) nativeBridge.start();
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            return !LOCAL_ORIGIN.equals(uri.getHost());
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            return serve(request.getUrl());
        }

        @SuppressWarnings("deprecation")
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
            return serve(Uri.parse(url));
        }

        private WebResourceResponse serve(Uri uri) {
            if (!"https".equalsIgnoreCase(uri.getScheme()) || !LOCAL_ORIGIN.equals(uri.getHost())) {
                return blockedResponse();
            }

            String path = uri.getPath();
            if (path == null || path.isEmpty() || "/".equals(path)) path = "/index.html";
            path = Uri.decode(path).replace('\\', '/');
            if (path.contains("..")) return blockedResponse();

            String assetPath = "web" + path;
            try {
                InputStream input = assets.open(assetPath, AssetManager.ACCESS_STREAMING);
                String mime = mimeType(path);
                String encoding = mime.startsWith("text/") || mime.contains("javascript") || mime.contains("json") ? "utf-8" : null;
                return new WebResourceResponse(mime, encoding, input);
            } catch (IOException e) {
                return blockedResponse();
            }
        }

        private static WebResourceResponse blockedResponse() {
            return new WebResourceResponse(
                    "text/plain", "utf-8",
                    new ByteArrayInputStream("Offline-only resource".getBytes())
            );
        }

        private static String mimeType(String path) {
            String extension = MimeTypeMap.getFileExtensionFromUrl(path);
            if ("js".equalsIgnoreCase(extension) || "mjs".equalsIgnoreCase(extension)) return "application/javascript";
            if ("wasm".equalsIgnoreCase(extension)) return "application/wasm";
            if ("json".equalsIgnoreCase(extension)) return "application/json";
            if ("css".equalsIgnoreCase(extension)) return "text/css";
            if ("html".equalsIgnoreCase(extension)) return "text/html";
            if ("svg".equalsIgnoreCase(extension)) return "image/svg+xml";
            if ("webp".equalsIgnoreCase(extension)) return "image/webp";
            return "application/octet-stream";
        }
    }
}
