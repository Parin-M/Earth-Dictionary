package com.parinm.earthdictionary;

import android.app.Activity;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private static final String LOCAL_ORIGIN = "earth.local";
    private static final String START_URL = "https://" + LOCAL_ORIGIN + "/index.html";
    private static final String MODEL_ASSET = "models/nllb-q4.gguf";

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
                    notifyModelReady(ready, ready ? "" : "Native NLLB initialization failed.");
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
        public void translate(String requestId, String text, String srcLang, String dstLang) {
            executor.execute(() -> {
                if (!ready) {
                    notifyTranslation(requestId, "", false, "Translation engine is not ready.");
                    return;
                }
                try {
                    String result = NativeTranslator.nativeTranslate(text, srcLang, dstLang);
                    if (result == null || result.isEmpty()) {
                        notifyTranslation(requestId, "", false, "Native NLLB returned no text.");
                    } else {
                        notifyTranslation(requestId, result, true, "");
                    }
                } catch (Throwable t) {
                    notifyTranslation(requestId, "", false, t.getMessage() == null ? "Native translation failed." : t.getMessage());
                }
            });
        }

        void shutdown() {
            executor.execute(NativeTranslator::nativeShutdown);
            executor.shutdown();
        }

        private File prepareModel() throws IOException {
            File model = new File(activity.getFilesDir(), "nllb-q4.gguf");
            if (model.isFile() && model.length() > 450_000_000L) return model;

            File tmp = new File(activity.getFilesDir(), "nllb-q4.gguf.part");
            if (tmp.exists() && !tmp.delete()) {
                throw new IOException("Cannot replace incomplete model cache.");
            }

            try (InputStream input = activity.getAssets().open(MODEL_ASSET, AssetManager.ACCESS_STREAMING);
                 OutputStream output = new FileOutputStream(tmp)) {
                byte[] buffer = new byte[1024 * 1024];
                int read;
                while ((read = input.read(buffer)) != -1) {
                    output.write(buffer, 0, read);
                }
                output.flush();
            }

            if (!tmp.renameTo(model)) {
                if (model.exists() && !model.delete()) throw new IOException("Cannot replace model cache.");
                if (!tmp.renameTo(model)) throw new IOException("Cannot finalize model cache.");
            }
            return model;
        }

        private void notifyModelReady(boolean ok, String message) {
            webView.post(() -> webView.evaluateJavascript(
                    "window.earthNativeModelReady(" + ok + "," + JSONObject.quote(message) + ")",
                    null));
        }

        private void notifyTranslation(String requestId, String result, boolean ok, String message) {
            webView.post(() -> webView.evaluateJavascript(
                    "window.earthNativeTranslationResult(" + JSONObject.quote(requestId) + "," +
                            JSONObject.quote(result) + "," + ok + "," + JSONObject.quote(message) + ")",
                    null));
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
            if (path == null || path.isEmpty() || "/".equals(path)) {
                path = "/index.html";
            }
            path = Uri.decode(path).replace('\\', '/');
            if (path.contains("..")) {
                return blockedResponse();
            }

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
                    "text/plain",
                    "utf-8",
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
            return "application/octet-stream";
        }
    }
}
