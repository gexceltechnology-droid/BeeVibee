# ProGuard rules for Bee Vibe Admin App
-keep class org.beevibe.admin.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
