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

## Limitations

- Un build Windows standard nécessite un environnement Windows ou un outil de cross-build compatible.
- Un build Android nécessite JDK / SDK / Android Studio.
- Le packaging ne remplace pas la sécurisation logicielle ou la base distante.
