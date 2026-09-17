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
        versionCode = 3
        versionName = "1.2.0"

        ndk {
            abiFilters += listOf("arm64-v8a")
        }
    }

    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
            arguments += listOf("-DLLAMA_SRC_DIR=${rootProject.projectDir}/.llama")
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
