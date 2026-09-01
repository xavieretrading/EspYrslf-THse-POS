GROUP OF COMPANIES — ANDROID ADAPTIVE ICON PACKAGE

This package contains:
- Legacy launcher PNGs for mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi
- Proper Android Adaptive Icon XML for API 26+
- Separate transparent foreground
- Separate black background
- Round launcher configuration
- 512px UI logo
- 1024px master logo

INSTALL:
Copy the contents of the included `res` folder into:
app/src/main/res/

Your AndroidManifest.xml can use:
android:icon="@mipmap/ic_launcher"
android:roundIcon="@mipmap/ic_launcher_round"
