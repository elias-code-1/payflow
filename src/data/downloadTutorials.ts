import { REPOSITORY_ACTIONS_URL, REPOSITORY_RELEASES_URL, type DownloadLinks } from "../constants/externalLinks";

export type PlatformCategory = "all" | "windows" | "linux" | "android" | "ios";

export interface TutorialStep {
  title: string;
  detail: string;
  commandLabel?: string;
  command?: string;
}

export interface PackageTutorial {
  id: string;
  category: Exclude<PlatformCategory, "all">;
  extension: string;
  name: string;
  systems: string;
  envVarName: string;
  urlKey: keyof DownloadLinks;
  summary: string;
  prerequisites: string;
  steps: TutorialStep[];
  storagePath: string;
  troubleshooting: string;
  uninstallNote: string;
}

export const PLATFORM_CATEGORIES: Array<{ id: PlatformCategory; label: string }> = [
  { id: "all", label: "Tous les formats" },
  { id: "windows", label: "Windows (.exe)" },
  { id: "linux", label: "Linux & BSD" },
  { id: "android", label: "Android (.apk)" },
  { id: "ios", label: "iOS (.ipa)" },
];

export const PACKAGE_TUTORIALS: PackageTutorial[] = [
  {
    id: "windows-nsis",
    category: "windows",
    extension: ".exe",
    name: "Installateur Windows (NSIS)",
    systems: "Windows 10 · Windows 11 (64 bits)",
    envVarName: "PAYFLOW_EXE_DOWNLOAD_URL",
    urlKey: "exeUrl",
    summary: "Recommandé sur PC Windows : installe PayFlow dans votre session, ajoute le raccourci au menu Démarrer et configure l’environnement local automatiquement.",
    prerequisites: "Windows 10 ou 11 (x64). Aucun serveur externe ni installation de Node.js ou SQLite n’est nécessaire.",
    steps: [
      {
        title: "Télécharger l’installateur",
        detail: "Cliquez sur le bouton de téléchargement pour enregistrer le fichier PayFlow Setup (.exe) dans votre dossier Téléchargements.",
      },
      {
        title: "Lancer le fichier et autoriser SmartScreen",
        detail: "Double-cliquez sur le fichier .exe téléchargé. Si Windows SmartScreen affiche « Windows a protégé votre ordinateur » (car le binaire open source n’utilise pas de certificat commercial EV), cliquez sur « Informations complémentaires » puis sur « Exécuter quand même ».",
      },
      {
        title: "Suivre l’assistant d’installation",
        detail: "Validez les étapes de l’installateur NSIS. L’installation s’effectue dans votre profil utilisateur sans exiger de configuration supplémentaire.",
      },
      {
        title: "Ouvrir PayFlow et créer votre compte local",
        detail: "Lancez PayFlow depuis le raccourci Bureau ou le menu Démarrer, créez votre compte marchand local (e-mail + mot de passe d’au moins 10 caractères), puis ajoutez votre clé API PayGateGlobal dans Paramètres.",
      },
    ],
    storagePath: "%APPDATA%\\PayFlow\\payflow.sqlite et %APPDATA%\\PayFlow\\backups\\",
    troubleshooting: "Si un antivirus tiers bloque le premier démarrage du serveur local embarqué (127.0.0.1), autorisez PayFlow.exe pour les connexions locales uniquement (loopback).",
    uninstallNote: "Désinstallez via Paramètres Windows → Applications → Applications installées → PayFlow. Pensez à cliquer sur « Créer une sauvegarde » avant de désinstaller ou changer de PC.",
  },
  {
    id: "windows-portable",
    category: "windows",
    extension: ".exe (Portable)",
    name: "Windows Portable (sans installation)",
    systems: "Windows 10 · Windows 11 (64 bits, sans droits admin)",
    envVarName: "PAYFLOW_EXE_PORTABLE_DOWNLOAD_URL",
    urlKey: "exePortableUrl",
    summary: "Exécutable autonome qui se lance immédiatement sans installation système ni droits administrateur.",
    prerequisites: "Un dossier dédié en écriture sur votre disque local ou support externe rapide.",
    steps: [
      {
        title: "Placer l’exécutable dans un dossier dédié",
        detail: "Créez un dossier (par exemple C:\\Outils\\PayFlow\\) et déposez-y le fichier .exe portable afin de le retrouver facilement.",
      },
      {
        title: "Autoriser le premier lancement",
        detail: "Double-cliquez sur le fichier .exe. Si l’écran bleu SmartScreen apparaît au premier lancement, cliquez sur « Informations complémentaires » puis « Exécuter quand même ».",
      },
      {
        title: "Vérifier l’emplacement avec PowerShell (facultatif)",
        detail: "Vous pouvez aussi lancer l’application ou vérifier son empreinte SHA-256 depuis PowerShell :",
        commandLabel: "PowerShell",
        command: "Get-FileHash .\\PayFlow*.exe -Algorithm SHA256\nStart-Process .\\PayFlow*.exe",
      },
    ],
    storagePath: "%APPDATA%\\PayFlow\\payflow.sqlite et %APPDATA%\\PayFlow\\backups\\",
    troubleshooting: "Ne lancez pas le fichier directement depuis une archive ZIP non extraite : déplacez-le toujours dans un vrai dossier local avant de l’ouvrir.",
    uninstallNote: "Il suffit de supprimer le fichier .exe portable. Vos données SQLite restent dans %APPDATA%\\PayFlow\\ tant que vous ne supprimez pas ce dossier.",
  },
  {
    id: "linux-appimage",
    category: "linux",
    extension: ".AppImage",
    name: "Linux AppImage (Universel)",
    systems: "Ubuntu · Debian · Linux Mint · Fedora · Arch · openSUSE",
    envVarName: "PAYFLOW_APPIMAGE_DOWNLOAD_URL",
    urlKey: "appImageUrl",
    summary: "Format universel recommandé sur Linux : un seul fichier exécutable contenant tout PayFlow, sans installation root.",
    prerequisites: "Bibliothèque FUSE installée (sur Ubuntu 22.04 / 24.04+, installez libfuse2t64 ou libfuse2 si l’AppImage ne s’ouvre pas au double-clic).",
    steps: [
      {
        title: "Installer FUSE si vous êtes sur Ubuntu 22.04 / 24.04+",
        detail: "Les versions récentes d’Ubuntu n’installent pas libfuse2 par défaut, pourtant requis par le format AppImage :",
        commandLabel: "Ubuntu 24.04+ / 22.04",
        command: "sudo apt update && sudo apt install -y libfuse2t64 || sudo apt install -y libfuse2",
      },
      {
        title: "Rendre le fichier .AppImage exécutable",
        detail: "Ouvrez un terminal dans votre dossier Téléchargements (ou faites Clic droit → Propriétés → Permissions → « Autoriser l’exécution ») :",
        commandLabel: "Terminal",
        command: "cd ~/Téléchargements || cd ~/Downloads\nchmod +x PayFlow*.AppImage",
      },
      {
        title: "Lancer PayFlow Desktop",
        detail: "Exécutez directement le fichier AppImage (ou double-cliquez dessus dans votre gestionnaire de fichiers) :",
        commandLabel: "Lancement",
        command: "./PayFlow*.AppImage",
      },
    ],
    storagePath: "~/.config/PayFlow/payflow.sqlite et ~/.config/PayFlow/backups/",
    troubleshooting: "Sur Ubuntu 24.04+ avec restriction AppArmor sur les namespaces non privilégiés, si une erreur SUID sandbox s’affiche, lancez avec : ./PayFlow*.AppImage --no-sandbox",
    uninstallNote: "Pour mettre à jour, téléchargez simplement la nouvelle .AppImage, rendez-la exécutable (chmod +x) et remplacez l’ancien fichier : votre base ~/.config/PayFlow/ est conservée automatiquement.",
  },
  {
    id: "linux-deb",
    category: "linux",
    extension: ".deb",
    name: "Paquet Debian / Ubuntu (.deb)",
    systems: "Ubuntu · Debian · Linux Mint · Pop!_OS · Zorin OS · Kali",
    envVarName: "PAYFLOW_DEB_DOWNLOAD_URL",
    urlKey: "debUrl",
    summary: "Installation native sur toutes les distributions basées sur Debian/Ubuntu, avec création automatique de l’icône dans le menu Applications.",
    prerequisites: "Accès administrateur (sudo) sur une distribution basée sur Debian ou Ubuntu (architecture amd64 / x86_64).",
    steps: [
      {
        title: "Se placer dans le dossier contenant le fichier .deb",
        detail: "Ouvrez votre terminal et accédez au dossier où le paquet .deb a été téléchargé :",
        commandLabel: "Terminal",
        command: "cd ~/Téléchargements || cd ~/Downloads",
      },
      {
        title: "Installer avec APT (résout automatiquement les dépendances)",
        detail: "Utilisez apt install avec ./ devant le nom du fichier pour qu’APT télécharge automatiquement les bibliothèques graphiques manquantes :",
        commandLabel: "Installation recommandée",
        command: "sudo apt update\nsudo apt install -y ./payflow*.deb",
      },
      {
        title: "Lancer PayFlow",
        detail: "Ouvrez le menu Applications de votre bureau Linux et cherchez « PayFlow », ou lancez-le depuis le terminal :",
        commandLabel: "Lancement",
        command: "payflow",
      },
    ],
    storagePath: "~/.config/PayFlow/payflow.sqlite et ~/.config/PayFlow/backups/",
    troubleshooting: "Si vous avez utilisé dpkg -i et obtenu une erreur de dépendances, exécutez : sudo apt-get install -f. Si AppArmor bloque le sandbox Electron sur Ubuntu 24.04+, lancez : payflow --no-sandbox",
    uninstallNote: "Pour mettre à jour : relancez sudo apt install ./nouveau-payflow.deb par-dessus l’ancien. Pour désinstaller : sudo apt remove payflow (vos données dans ~/.config/PayFlow restent intactes).",
  },
  {
    id: "linux-rpm",
    category: "linux",
    extension: ".rpm",
    name: "Paquet Fedora / Red Hat (.rpm)",
    systems: "Fedora · RHEL · Rocky Linux · AlmaLinux · openSUSE",
    envVarName: "PAYFLOW_RPM_DOWNLOAD_URL",
    urlKey: "rpmUrl",
    summary: "Paquet système natif pour l’écosystème Red Hat, Fedora et openSUSE avec intégration complète au bureau.",
    prerequisites: "Accès sudo sur Fedora, RHEL, Rocky, AlmaLinux ou openSUSE (x86_64).",
    steps: [
      {
        title: "Ouvrir le dossier de téléchargement",
        detail: "Positionnez votre terminal dans le répertoire contenant le fichier .rpm :",
        commandLabel: "Terminal",
        command: "cd ~/Téléchargements || cd ~/Downloads",
      },
      {
        title: "Installer sur Fedora / RHEL / Rocky / AlmaLinux",
        detail: "Utilisez DNF afin d’installer le paquet local et ses dépendances :",
        commandLabel: "Fedora / RHEL",
        command: "sudo dnf install -y ./payflow*.rpm",
      },
      {
        title: "Alternative sur openSUSE",
        detail: "Sur openSUSE Leap ou Tumbleweed, utilisez Zypper :",
        commandLabel: "openSUSE",
        command: "sudo zypper install --allow-unsigned-rpm ./payflow*.rpm",
      },
    ],
    storagePath: "~/.config/PayFlow/payflow.sqlite et ~/.config/PayFlow/backups/",
    troubleshooting: "Si DNF refuse le paquet car il n’est pas signé par une clé GPG distante, ajoutez l’option --nogpgcheck : sudo dnf install --nogpgcheck ./payflow*.rpm",
    uninstallNote: "Mise à jour : sudo dnf upgrade ./payflow*.rpm · Désinstallation : sudo dnf remove payflow",
  },
  {
    id: "linux-snap",
    category: "linux",
    extension: ".snap",
    name: "Paquet Snap (.snap)",
    systems: "Ubuntu · Kubuntu · Manjaro · Distributions avec snapd",
    envVarName: "PAYFLOW_SNAP_DOWNLOAD_URL",
    urlKey: "snapUrl",
    summary: "Paquet conteneurisé Snap pour Ubuntu et toute distribution disposant du démon snapd.",
    prerequisites: "Service snapd actif (préinstallé sur Ubuntu ; sur Debian/Fedora : sudo apt install snapd).",
    steps: [
      {
        title: "Vérifier que snapd est actif",
        detail: "Assurez-vous que le service snapd tourne sur votre machine :",
        commandLabel: "Vérification",
        command: "sudo systemctl enable --now snapd.socket",
      },
      {
        title: "Installer le fichier .snap local",
        detail: "Comme le fichier .snap est installé directement depuis un fichier local hors Snap Store, le drapeau --dangerous est requis par Snap :",
        commandLabel: "Installation Snap",
        command: "cd ~/Téléchargements || cd ~/Downloads\nsudo snap install --dangerous ./payflow*.snap",
      },
      {
        title: "Démarrer PayFlow",
        detail: "Lancez PayFlow depuis vos applications ou via la commande :",
        commandLabel: "Lancement",
        command: "snap run payflow",
      },
    ],
    storagePath: "~/snap/payflow/current/.config/PayFlow/ (isolé par Snap)",
    troubleshooting: "Pensez à utiliser le bouton « Créer une sauvegarde » dans PayFlow pour exporter régulièrement une copie JSON vers votre dossier Téléchargements avant de supprimer un paquet Snap.",
    uninstallNote: "Attention : sudo snap remove payflow supprime aussi le dossier isolé ~/snap/payflow/. Exportez toujours une sauvegarde JSON avant de désinstaller un Snap !",
  },
  {
    id: "linux-flatpak",
    category: "linux",
    extension: ".flatpak",
    name: "Bundle Flatpak (.flatpak)",
    systems: "Linux Mint · Fedora · Debian · Ubuntu · SteamOS · Arch",
    envVarName: "PAYFLOW_FLATPAK_DOWNLOAD_URL",
    urlKey: "flatpakUrl",
    summary: "Paquet universel isolé fonctionnant dans un bac à sable Flatpak utilisateur (sans droits root si installé avec --user).",
    prerequisites: "Flatpak installé (sudo apt install flatpak sur Debian/Ubuntu) et dépôt Flathub configuré pour le runtime.",
    steps: [
      {
        title: "Activer le dépôt Flathub (si ce n’est pas déjà fait)",
        detail: "Flatpak utilise Flathub pour télécharger automatiquement l’environnement d’exécution Freedesktop requis :",
        commandLabel: "Configuration Flathub",
        command: "flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo",
      },
      {
        title: "Installer le bundle .flatpak",
        detail: "Installez le fichier .flatpak dans votre session utilisateur :",
        commandLabel: "Installation Flatpak",
        command: "cd ~/Téléchargements || cd ~/Downloads\nflatpak install --user -y ./payflow*.flatpak",
      },
      {
        title: "Lancer l’application",
        detail: "Ouvrez PayFlow depuis votre lanceur d’applications ou via Flatpak (vérifiez l’ID exact avec flatpak list) :",
        commandLabel: "Lancement",
        command: "flatpak list --app | grep -i payflow\nflatpak run $(flatpak list --app --columns=application | grep -i payflow | head -n1)",
      },
    ],
    storagePath: "~/.var/app/<app-id>/config/PayFlow/",
    troubleshooting: "Si le menu Applications n’affiche pas encore l’icône après la première installation de Flatpak, déconnectez puis reconnectez votre session graphique.",
    uninstallNote: "Désinstallation : flatpak uninstall --user <app-id> (exportez une sauvegarde JSON avant d’ajouter --delete-data).",
  },
  {
    id: "linux-pacman",
    category: "linux",
    extension: ".pacman",
    name: "Paquet Arch Linux (.pacman)",
    systems: "Arch Linux · Manjaro · EndeavourOS · Garuda Linux",
    envVarName: "PAYFLOW_PACMAN_DOWNLOAD_URL",
    urlKey: "pacmanUrl",
    summary: "Paquet natif destiné au gestionnaire pacman sur Arch Linux et ses dérivés.",
    prerequisites: "Distribution basée sur Arch Linux avec accès sudo.",
    steps: [
      {
        title: "Installer le fichier local avec pacman -U",
        detail: "Ouvrez un terminal dans votre dossier de téléchargement et lancez pacman -U pour installer l’archive locale et ses dépendances :",
        commandLabel: "Arch / Manjaro",
        command: "cd ~/Téléchargements || cd ~/Downloads\nsudo pacman -U ./payflow*.pacman",
      },
      {
        title: "Démarrer PayFlow",
        detail: "Lancez PayFlow depuis votre menu d’applications (KDE, GNOME, Hyprland…) ou en ligne de commande :",
        commandLabel: "Lancement",
        command: "payflow",
      },
    ],
    storagePath: "~/.config/PayFlow/payflow.sqlite et ~/.config/PayFlow/backups/",
    troubleshooting: "Si pacman signale un conflit de vérification de signature sur un paquet local, vérifiez que LocalFileSigLevel = Optional est bien actif dans /etc/pacman.conf (comportement par défaut sur Arch).",
    uninstallNote: "Désinstallation : sudo pacman -R payflow (conserve vos données locales dans ~/.config/PayFlow/).",
  },
  {
    id: "linux-alpine",
    category: "linux",
    extension: ".apk (Alpine)",
    name: "Paquet Alpine Linux (.apk)",
    systems: "Alpine Linux · PostmarketOS (x86_64)",
    envVarName: "PAYFLOW_ALPINE_APK_DOWNLOAD_URL",
    urlKey: "alpineApkUrl",
    summary: "Paquet système apk-tools conçu spécifiquement pour Alpine Linux (attention : ne pas confondre avec l’APK Android).",
    prerequisites: "Environnement graphique Alpine Linux (musl/gcompat selon configuration).",
    steps: [
      {
        title: "Installer avec apk add --allow-untrusted",
        detail: "Comme le paquet est téléchargé hors dépôt officiel Alpine, passez l’option --allow-untrusted :",
        commandLabel: "Alpine Linux",
        command: "sudo apk add --allow-untrusted ./payflow*.apk",
      },
      {
        title: "Exécuter PayFlow",
        detail: "Lancez le binaire depuis votre session graphique :",
        commandLabel: "Lancement",
        command: "payflow",
      },
    ],
    storagePath: "~/.config/PayFlow/payflow.sqlite et ~/.config/PayFlow/backups/",
    troubleshooting: "Assurez-vous de ne pas utiliser ce fichier sur un téléphone Android : sur mobile Android, téléchargez l’APK de l’onglet « Android (.apk) ».",
    uninstallNote: "Désinstallation : sudo apk del payflow",
  },
  {
    id: "bsd-freebsd",
    category: "linux",
    extension: ".freebsd",
    name: "Paquet FreeBSD (.freebsd)",
    systems: "FreeBSD 13 · FreeBSD 14 (amd64)",
    envVarName: "PAYFLOW_FREEBSD_DOWNLOAD_URL",
    urlKey: "freebsdUrl",
    summary: "Archive de paquet pour postes de travail FreeBSD utilisant le gestionnaire pkg.",
    prerequisites: "Poste FreeBSD avec serveur graphique (X11/Wayland) et compatibilité Linux activée si requise par Electron.",
    steps: [
      {
        title: "Installer le paquet avec pkg add",
        detail: "Depuis le dossier contenant le fichier téléchargé, exécutez pkg add en tant qu’administrateur :",
        commandLabel: "FreeBSD",
        command: "sudo pkg add ./payflow*.freebsd",
      },
      {
        title: "Lancer PayFlow",
        detail: "Exécutez payflow depuis votre menu d’applications ou un terminal graphique :",
        commandLabel: "Lancement",
        command: "payflow",
      },
    ],
    storagePath: "~/.config/PayFlow/payflow.sqlite et ~/.config/PayFlow/backups/",
    troubleshooting: "Si certaines bibliothèques partagées Chromium/Electron manquent sous FreeBSD, installez les dépendances graphiques via sudo pkg install gtk3 nss alsa-lib.",
    uninstallNote: "Désinstallation : sudo pkg delete payflow",
  },
  {
    id: "linux-tar",
    category: "linux",
    extension: ".tar.gz · .tar.xz · .tar.bz2 · .tar.lz",
    name: "Archives Tar Linux (.tar.*)",
    systems: "Toutes distributions Linux 64 bits (sans droits root)",
    envVarName: "PAYFLOW_ARCHIVE_DOWNLOAD_URL",
    urlKey: "archiveUrl",
    summary: "Dossier applicatif complet compressé : idéal pour décompresser PayFlow dans ~/Applications ou /opt sans gestionnaire de paquets.",
    prerequisites: "Utilitaire tar (et xz-utils, bzip2 ou lzip selon l’extension choisie).",
    steps: [
      {
        title: "Extraire l’archive selon son extension exacte",
        detail: "Choisissez la commande correspondant au fichier que vous avez téléchargé (.tar.gz, .tar.xz, .tar.bz2 ou .tar.lz) :",
        commandLabel: "Commandes d’extraction par extension",
        command: "# Pour .tar.gz :\ntar -xzf payflow*.tar.gz\n\n# Pour .tar.xz :\ntar -xJf payflow*.tar.xz\n\n# Pour .tar.bz2 :\ntar -xjf payflow*.tar.bz2\n\n# Pour .tar.lz (installez lzip si besoin : sudo apt install lzip) :\ntar --lzip -xf payflow*.tar.lz",
      },
      {
        title: "Entrer dans le dossier extrait et rendre le binaire exécutable",
        detail: "Accédez au dossier décompressé et vérifiez les droits d’exécution sur le binaire payflow :",
        commandLabel: "Préparation",
        command: "cd payflow-*\nchmod +x payflow chrome-sandbox 2>/dev/null || chmod +x payflow",
      },
      {
        title: "Lancer PayFlow (et créer un raccourci facultatif)",
        detail: "Démarrez l’application directement depuis le dossier extrait :",
        commandLabel: "Lancement",
        command: "./payflow",
      },
    ],
    storagePath: "~/.config/PayFlow/payflow.sqlite et ~/.config/PayFlow/backups/",
    troubleshooting: "Si Linux affiche une erreur « The SUID sandbox helper binary was found, but is not configured correctly », lancez simplement avec : ./payflow --no-sandbox",
    uninstallNote: "Supprimez simplement le dossier extrait. Vos données restent conservées séparément dans ~/.config/PayFlow/.",
  },
  {
    id: "linux-zip-7z",
    category: "linux",
    extension: ".zip · .7z",
    name: "Archives ZIP et 7-Zip (.zip / .7z)",
    systems: "Toutes distributions Linux 64 bits",
    envVarName: "PAYFLOW_ARCHIVE_DOWNLOAD_URL",
    urlKey: "archiveUrl",
    summary: "Même contenu autonome que les archives Tar, compressé aux formats universels ZIP ou 7z (ultra-compact).",
    prerequisites: "Paquet unzip (pour .zip) ou p7zip-full / 7zip (pour .7z).",
    steps: [
      {
        title: "Décompresser le fichier .zip ou .7z",
        detail: "Exécutez la commande correspondant à votre archive dans un dossier dédié :",
        commandLabel: "Extraction .zip ou .7z",
        command: "# Pour .zip :\nunzip payflow*.zip -d payflow-app\n\n# Pour .7z (installez p7zip-full si besoin : sudo apt install p7zip-full) :\n7z x payflow*.7z -opayflow-app",
      },
      {
        title: "Rendre le binaire exécutable et lancer PayFlow",
        detail: "Le format ZIP peut parfois retirer le bit d’exécution POSIX : réactivez-le avec chmod +x avant de lancer :",
        commandLabel: "Permissions & lancement",
        command: "cd payflow-app/* 2>/dev/null || cd payflow-app\nchmod +x payflow\n./payflow --no-sandbox",
      },
    ],
    storagePath: "~/.config/PayFlow/payflow.sqlite et ~/.config/PayFlow/backups/",
    troubleshooting: "Si « permission denied » apparaît au lancement après décompression d’un .zip, c’est simplement que chmod +x payflow n’a pas encore été exécuté.",
    uninstallNote: "Supprimez le dossier payflow-app ; la base ~/.config/PayFlow/ reste préservée.",
  },
  {
    id: "android-apk",
    category: "android",
    extension: ".apk",
    name: "Application Android (.apk)",
    systems: "Smartphones & tablettes Android 8.0+ (ARM64 / universel)",
    envVarName: "PAYFLOW_APK_DOWNLOAD_URL",
    urlKey: "apkUrl",
    summary: "Application mobile Capacitor permettant d’accéder à votre tableau de bord PayFlow depuis votre téléphone Android.",
    prerequisites: "Téléphone Android 8.0 ou supérieur et serveur PayFlow accessible en HTTPS (configuré via CAPACITOR_SERVER_URL lors du build de l’APK).",
    steps: [
      {
        title: "Télécharger le fichier .apk sur votre téléphone",
        detail: "Ouvrez cette page depuis le navigateur de votre téléphone Android (Chrome, Firefox, Samsung Internet) et appuyez sur « Télécharger .apk », ou transférez le fichier par câble USB.",
      },
      {
        title: "Ouvrir le fichier depuis Téléchargements",
        detail: "Touchez la notification « Téléchargement terminé » ou ouvrez l’application « Fichiers / Mes fichiers » → catégorie « Téléchargements » → touchez payflow.apk.",
      },
      {
        title: "Autoriser l’installation depuis cette source",
        detail: "Si Android affiche un message de sécurité concernant les applications inconnues, appuyez sur « Paramètres », activez « Autoriser depuis cette source », puis revenez en arrière.",
      },
      {
        title: "Confirmer auprès de Google Play Protect",
        detail: "Appuyez sur « Installer ». Si Google Play Protect signale que l’application ne provient pas du Play Store, appuyez sur « Plus de détails » puis sur « Installer quand même ».",
      },
      {
        title: "Alternative développeur via ADB depuis un ordinateur (facultatif)",
        detail: "Si le téléphone est branché en USB avec le débogage USB actif, vous pouvez aussi installer l’APK en une commande :",
        commandLabel: "ADB (depuis PC/Linux/Mac)",
        command: "adb install -r app-debug.apk",
      },
    ],
    storagePath: "Stockage sur le serveur PayFlow connecté (CAPACITOR_SERVER_URL) + téléchargement JSON local sur le téléphone via « Créer une sauvegarde ».",
    troubleshooting: "Si l’écran affiche une erreur de connexion à http://10.0.2.2:3001 sur un vrai téléphone, recompilez l’APK en renseignant la variable CAPACITOR_SERVER_URL avec l’URL HTTPS de votre serveur PayFlow (ex. Render).",
    uninstallNote: "Maintenez le doigt sur l’icône PayFlow → Désinstaller. Vos données sur le serveur distant ne sont pas effacées.",
  },
  {
    id: "ios-ipa",
    category: "ios",
    extension: ".ipa",
    name: "Paquet iPhone & iPad (.ipa)",
    systems: "iOS 15+ · iPadOS 15+ (TestFlight ou Sideloading)",
    envVarName: "PAYFLOW_IPA_DOWNLOAD_URL",
    urlKey: "ipaUrl",
    summary: "Archive iOS signée destinée à TestFlight / App Store Connect ou à l’installation directe via AltStore, Sideloadly ou Apple Configurator.",
    prerequisites: "iPhone ou iPad sous iOS 15+, et soit une invitation TestFlight, soit un Mac/PC avec AltStore ou Sideloadly pour signer l’archive .ipa.",
    steps: [
      {
        title: "Méthode A (recommandée) : via TestFlight",
        detail: "Si l’administrateur a publié l’IPA sur App Store Connect, installez l’application gratuite « TestFlight » depuis l’App Store, ouvrez votre lien d’invitation et appuyez sur « Installer ».",
      },
      {
        title: "Méthode B : installation directe du fichier .ipa (Sideloadly / AltStore / Mac)",
        detail: "Téléchargez le fichier PayFlow.ipa sur votre ordinateur, branchez votre iPhone en USB et appuyez sur « Faire confiance à cet ordinateur » sur l’iPhone.",
      },
      {
        title: "Injecter et signer l’application",
        detail: "Ouvrez Sideloadly (Windows/macOS) ou Apple Configurator 2 (macOS), glissez le fichier PayFlow.ipa, saisissez votre identifiant Apple et cliquez sur « Start ».",
      },
      {
        title: "Approuver le profil et le Mode développeur sur iOS",
        detail: "Sur l’iPhone : ouvrez Réglages → Général → Gestion de l’appareil et des VPN → touchez votre profil → « Faire confiance ». Sous iOS 16+, activez également Réglages → Confidentialité et sécurité → Mode développeur.",
      },
    ],
    storagePath: "Stockage sur le serveur PayFlow connecté (CAPACITOR_SERVER_URL) + export JSON via le bouton « Créer une sauvegarde ».",
    troubleshooting: "Avec un compte Apple gratuit (hors Apple Developer Program payant), les applications installées par sideloading doivent être rafraîchies tous les 7 jours dans AltStore/Sideloadly.",
    uninstallNote: "Appui prolongé sur l’icône PayFlow → Supprimer l’app.",
  },
];

export function resolvePackageDownload(
  tutorial: PackageTutorial,
  links: DownloadLinks,
): { url: string; isDirect: boolean; label: string } {
  const direct = links[tutorial.urlKey] || (tutorial.category === "linux" && tutorial.urlKey === "appImageUrl" ? links.linuxUrl : "");
  if (direct) {
    return {
      url: direct,
      isDirect: true,
      label: `Télécharger ${tutorial.extension.split(" ")[0]}`,
    };
  }
  const fallback = links.releasesUrl || REPOSITORY_RELEASES_URL;
  return {
    url: fallback,
    isDirect: false,
    label: "Voir sur GitHub Releases",
  };
}

export { REPOSITORY_ACTIONS_URL, REPOSITORY_RELEASES_URL };
