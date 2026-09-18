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
        versionCode = 10
        versionName = "1.4.0"

        ndk {
            abiFilters += listOf("arm64-v8a", "armeabi-v7a", "x86_64")
        }
    }

    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    androidResources {
        noCompress += "wasm"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }

    dependenciesInfo {
        includeInApk = false
        includeInBundle = false
    }

    dependencies {
        implementation("com.google.mlkit:text-recognition:16.0.1")
        implementation("com.google.mlkit:text-recognition-chinese:16.0.1")
        implementation("com.google.mlkit:text-recognition-devanagari:16.0.1")
        implementation("com.google.mlkit:text-recognition-japanese:16.0.1")
        implementation("com.google.mlkit:text-recognition-korean:16.0.1")
        implementation("com.rmtheis:tess-two:9.1.0")
    }
}
