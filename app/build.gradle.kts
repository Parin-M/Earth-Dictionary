plugins {
    id("com.android.application")
}

android {
    namespace = "com.parinm.earthdictionary"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.parinm.earthdictionary"
        minSdk = 26
        targetSdk = 36
        versionCode = 2
        versionName = "1.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    // Allow APK compression of the large ONNX model files.
    // WASM stays uncompressed for fast local loading.
    androidResources {
        noCompress += "wasm"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}
