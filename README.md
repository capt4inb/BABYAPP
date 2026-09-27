# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# BABYAPP

## App thumbnail

`public/thumbnail.png` is the 1200 × 630 sharing image; `public/thumbnail.svg` is its editable source. Open Graph and Twitter metadata are in `index.html`, with absolute URLs pointing to https://babyapp-kappa.vercel.app/. Update those URLs if the production domain changes.

`public/icon.svg`, the PNG icons, and `public/site.webmanifest` provide the browser and home-screen icons. Deploy the updated build for the images and metadata to become available. Social networks may cache older previews.

## Startup loading

The initial HTML shows a lightweight pastel loading screen before JavaScript loads. The app downloads dynamically and replaces it as soon as it renders; there is no artificial delay. After 15 seconds, or if the app chunk fails, a reload button is available. Reduced-motion preferences are respected.

## iOS and Android widgets

The native Capacitor projects in `ios/` and `android/` include a medium home-screen widget. It shows the latest feeding time and pumping completion time. Each row has a `+` button that opens the matching quick-entry form in the app through the `babyapp://quick-add/feed` and `babyapp://quick-add/pump` deep links.

Widget values are a device-local snapshot of the current Firebase-backed React state. Opening or synchronizing the app refreshes the snapshot and asks the operating system to redraw the widget.

### Sync native projects

```sh
npm install
npm run native:sync
```

### Android

Open `android/` in Android Studio, select the desired device, and run the `app` configuration. After installation, long-press the phone's home screen, open **Widgets**, select **Baby Milk Tracker**, and add the 4 × 2 widget.

### iOS

iOS compilation and signing require macOS with Xcode 26 or newer. Open `ios/App/App.xcodeproj`, choose an Apple development team for both **App** and **BabyWidgetExtension**, and register the App Group `group.com.capt4inb.babyapp` for both targets. Run the app once, then long-press the iPhone home screen and add **Baby Milk Widget**.

The app bundle identifiers are `com.capt4inb.babyapp` and `com.capt4inb.babyapp.widget`. Change them together with the App Group if those identifiers are already owned by another Apple Developer account.
