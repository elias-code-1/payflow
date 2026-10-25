# Packaging et build

## Web

```bash
npm install
npm run dev
npm run build
```

## Windows desktop

```bash
npm run package:win
```

Le build Windows est centré sur Electron. Le wrapper démarre l’API locale et charge le dashboard.

## Android APK

```bash
npm run cap:add:android
npm run package:apk
```

L’APK est un build optionnel basé sur Capacitor. Il n’est pas un produit autonome sans environnement Android bien configuré.

Le wrapper mobile charge le dashboard serveur défini par `CAPACITOR_SERVER_URL`. Pour une build connectée, définir cette variable (URL Render sans `/dashboard.html`) avant `npx cap sync android`; sans variable il utilise `http://10.0.2.2:3001`, réservé à l’émulateur Android local. Les sauvegardes quotidiennes d’une app mobile connectée à Render sont stockées côté serveur sur le disque persistant, pas directement sur le téléphone.

## GitHub Actions

Les workflows se trouvent dans `.github/workflows/` :

- `build-desktop.yml` produit l’installateur Windows NSIS, l’EXE portable et les formats Linux/BSD pris en charge sur Ubuntu par electron-builder : AppImage, DEB, RPM, Snap, Flatpak, Pacman, APK Alpine, FreeBSD et archives 7z, tar.xz, tar.lz, tar.gz et tar.bz2.
- `build-mobile.yml` produit automatiquement `payflow-android.apk` et `PayFlow-iOS.ipa` sur les push (`main` et tags `v*`), pull requests et lancements manuels.

Sur les push et tags, chaque fichier généré est publié individuellement (sans enveloppe `.zip`) dans la **GitHub Release** correspondante (`v1.0.0`, etc.).

### Signature iOS (optionnelle)

Sans configuration supplémentaire, le job iOS génère automatiquement un `PayFlow-iOS.ipa` ad-hoc prêt à être installé via **AltStore**, **Sideloadly** ou **TrollStore**.

Pour générer un IPA signé officiellement pour **App Store Connect / TestFlight**, ajouter ces 4 secrets dans **Settings → Secrets and variables → Actions** :

- `IOS_CERTIFICATE_BASE64` : certificat Apple Distribution au format `.p12`, encodé en Base64.
- `IOS_CERTIFICATE_PASSWORD` : mot de passe du fichier `.p12`.
- `IOS_PROVISIONING_PROFILE_BASE64` : profil App Store Connect encodé en Base64, associé à l’identifiant `org.payflow.local`.
- `IOS_TEAM_ID` : identifiant de l’équipe Apple Developer.

### Configuration mobile actuelle

`capacitor.config.ts` lit `CAPACITOR_SERVER_URL` (depuis les variables/secrets GitHub Actions, `.env` ou `.env.example`) pour Android et iOS. Définir `CAPACITOR_SERVER_URL` avec l’URL HTTPS Render (ex. `https://payflow.onrender.com`) pour connecter directement l’APK et l’IPA au serveur distant.

## Limitations

- Un build Windows standard nécessite un environnement Windows ou un outil de cross-build compatible.
- Un build Android nécessite JDK / SDK / Android Studio.
- Le packaging ne remplace pas la sécurisation logicielle ou la base distante.
