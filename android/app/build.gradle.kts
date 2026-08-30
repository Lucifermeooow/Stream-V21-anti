plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.ahmed.streamv21"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.ahmed.streamv21"
        minSdk = 24
        targetSdk = 35
        versionCode = 21
        versionName = "21.0.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("debug")
            isMinifyEnabled = false
            isShrinkResources = false
        }
    }
}

tasks.matching { it.name.contains("AarMetadata") }.configureEach {
    enabled = false
}

flutter {
    source = "../.."
}
