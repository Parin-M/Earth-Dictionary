# Earth Dictionary

Android dictionary and fully offline translator.

## Offline translation

The app contains a local Transformers.js + ONNX Runtime Web translation engine based on `Xenova/nllb-200-distilled-600M`.

- Runtime has **no cloud translation API**.
- `android.permission.INTERNET` is intentionally not declared.
- The WebView serves the bundled web application from Android assets and blocks external hosts.
- GitHub Actions downloads the model during the build and packages it into the APK. This is a **build-time** download; the installed app does not need Internet access.
- The bundled NLLB model is distributed under **CC BY-NC 4.0**. Check the model license before commercial redistribution.
- The model is large (about 900 MB for the selected INT8 ONNX weights plus tokenizer/config), so build artifacts will also be large and device RAM/storage requirements are significant.

## Build locally

Install JDK 17, Android SDK 36, Node.js 22 and Gradle 9.6.

From the `web` directory:

```bash
npm install
mkdir -p public/wasm
find node_modules/onnxruntime-web -name '*.wasm' -exec cp {} public/wasm/ \;
```

Download the NLLB model files into `web/public/models/Xenova/nllb-200-distilled-600M/` (the GitHub Actions workflow does this automatically), then run:

```bash
npm run build
cd ..
./gradlew :app:assembleDebug
```

The installable debug APK is generated at `app/build/outputs/apk/debug/app-debug.apk`.

## Model attribution

`Xenova/nllb-200-distilled-600M` by Meta/Facebook AI Research, packaged for Transformers.js by Xenova.
Model source: https://huggingface.co/Xenova/nllb-200-distilled-600M
License: CC BY-NC 4.0

This project does not bundle or call a cloud translation service at runtime.
