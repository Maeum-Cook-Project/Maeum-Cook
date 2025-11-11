// Top-level build file where you can add configuration options common to all sub-projects/modules.
buildscript {
    dependencies {
        classpath ("org.jetbrains.kotlin:kotlin-serialization:1.8.0")
        classpath ("com.android.tools.build:gradle:8.2.0")
    }
}

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
}