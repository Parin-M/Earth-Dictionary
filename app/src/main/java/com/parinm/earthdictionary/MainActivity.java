package com.parinm.earthdictionary;

import android.app.Activity;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.MimeTypeMap;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

public final class MainActivity extends Activity {
    private static final String LOCAL_ORIGIN = "earth.local";
    private static final String START_URL = "https://" + LOCAL_ORIGIN + "/index.html";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView.setWebContentsDebuggingEnabled(false);

        WebView webView = new WebView(this);
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

        webView.setWebViewClient(new OfflineAssetWebViewClient(getAssets()));
        webView.loadUrl(START_URL);
        setContentView(webView);
    }

    private static final class OfflineAssetWebViewClient extends WebViewClient {
        private final AssetManager assets;

        OfflineAssetWebViewClient(AssetManager assets) {
            this.assets = assets;
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
