# Bluetooth LE Example

```bash
# install packages
npm i

# for development
npm run start
npx cap run android
npx cap run ios

# build and sync for Android
npm run build:android

# build and sync for iOS
npm run build:ios

# run web version locally
npm run serve:prod

# open Android Studio
npx cap open android

# open Xcode
npx cap open android
```

Add IP address to `capacitor.config.ts`:

```ts
  server: {
    url: "http://192.168.178.24:3333",
    cleartext: true,
  }
```
