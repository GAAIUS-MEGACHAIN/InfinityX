# InfinityX Play Store Signing

The committed Android build reads release signing data from `secrets/keystore.properties`.

That file is intentionally ignored by Git. Do not commit it.

Required keys:

```properties
storeFile=C:/Users/Administrator/Documents/InfinityX/secrets/infinityx-upload-key.jks
storePassword=REPLACE_WITH_LOCAL_SECRET
keyAlias=infinityx-upload
keyPassword=REPLACE_WITH_LOCAL_SECRET
```

Build release APK:

```powershell
$env:JAVA_HOME='E:\InfinityX-tools\jdk21\jdk-21.0.11+10'
$env:Path="$env:JAVA_HOME\bin;C:\Program Files\nodejs;$env:Path"
npm.cmd run build
.\node_modules\.bin\cap.cmd sync android
Set-Location android
.\gradlew.bat assembleRelease
```

Google Play App Signing should use this as the upload key. If the key is lost, Google Play must rotate the upload key.
