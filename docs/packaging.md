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

## GitHub Actions

Les workflows se trouvent dans `.github/workflows/` :

- `build-desktop.yml` produit l’installateur Windows NSIS, l’EXE portable et les formats Linux pris en charge par electron-builder : AppImage, DEB, RPM, Snap, Flatpak, Pacman, APK Alpine, FreeBSD, IPS Solaris (`p5p`) et archives 7z, ZIP, tar.xz, tar.lz, tar.gz et tar.bz2.
- `build-mobile.yml` produit un APK Android debug sur les push, pull requests et lancements manuels. Le job iOS ne s’exécute qu’au lancement manuel du workflow et exporte un IPA signé pour App Store Connect.

Les fichiers sont téléchargeables dans la section **Artifacts** de chaque exécution et sont conservés 14 jours. Ces workflows ne publient pas automatiquement sur une boutique ni dans une GitHub Release.

### Signature iOS

Avant de lancer manuellement le workflow mobile, ajouter ces secrets dans **Settings → Secrets and variables → Actions** :

- `IOS_CERTIFICATE_BASE64` : certificat Apple Distribution au format `.p12`, encodé en Base64.
- `IOS_CERTIFICATE_PASSWORD` : mot de passe du fichier `.p12`.
- `IOS_PROVISIONING_PROFILE_BASE64` : profil App Store Connect encodé en Base64, associé à l’identifiant `org.payflow.local`.
- `IOS_TEAM_ID` : identifiant de l’équipe Apple Developer.

La signature iOS nécessite le certificat et le profil de provisioning Apple appropriés. Le workflow installe le projet Capacitor iOS uniquement pendant le build.

### Configuration mobile actuelle

`capacitor.config.json` pointe encore vers `http://10.0.2.2:3001/dashboard.html`, une adresse de développement destinée à l’émulateur Android. Le workflow peut compiler et signer l’IPA, mais cette adresse ne convient pas à un iPhone réel. Il faudra configurer une adresse de serveur adaptée avant de distribuer l’application iOS.

## Limitations

- Un build Windows standard nécessite un environnement Windows ou un outil de cross-build compatible.
- Un build Android nécessite JDK / SDK / Android Studio.
- Le packaging ne remplace pas la sécurisation logicielle ou la base distante.
