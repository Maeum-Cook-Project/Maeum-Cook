plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.suda.agent"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.suda.agent"
        minSdk = 33
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
//        externalNativeBuild {
//            cmake {
//                cppFlags("")
//            }
//            ndk {
//                abiFilters.add("arm64-v8a")
//            }
//        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
//    externalNativeBuild {
//        cmake {
//            path = file("src/main/cpp/CMakeLists.txt")
//            version = "3.30.4"
//        }
//    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        viewBinding = true
    }
    
    lint {
        abortOnError = false
        checkReleaseBuilds = false
    }

    dependencies {
        implementation(files("src/main/jniLibs/tvm4j_core.jar"))
    }

    sourceSets {
        getByName("main") {
            jniLibs.srcDirs("src/main/jniLibs")
        }
    }
}

dependencies {
    // Core Android libraries
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    
    // XML Layout dependencies
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.constraintlayout)
    implementation(libs.androidx.activity.ktx)
    implementation(libs.androidx.fragment.ktx)
    
    // Testing libraries
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)

    // Networking
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    implementation("io.ktor:ktor-server-cio:2.3.11")
    implementation("io.ktor:ktor-server-websockets:2.3.11")
    implementation("io.ktor:ktor-server-core:2.3.11")
    implementation("org.slf4j:slf4j-simple:2.0.7")
}
