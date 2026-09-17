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

    androidResources {
        noCompress += "wasm"
        noCompress += "xz"
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

dependencies {
    implementation("org.tukaani:xz:1.12")
}
