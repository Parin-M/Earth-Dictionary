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
        versionCode = 6
        versionName = "1.3.2"

        // Universal APK: 64-bit ARM, 32-bit ARM, and x86-64 Android devices.
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
}
