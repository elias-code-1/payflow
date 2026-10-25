# Fonctionnalités PayFlow

## 1. Vue d’ensemble

PayFlow est un dashboard de paiement local, orienté liens de paiement, avec gestion locale des comptes, des liens, des clients, des statistiques et des exports.

## 2. Fonctionnalités principales

### 2.1 Authentification locale
- Création de compte local
- Connexion / déconnexion locale
- Session cookie HttpOnly
- Isolation complète par utilisateur
- Données et clés stockées séparément par compte

### 2.2 Génération de liens de paiement
- Création d’un lien PayGateGlobal
- Choix de la monnaie XOF / EUR / USD
- Conversion locale pour le montant envoyé
- Stockage du lien généré dans SQLite
- Référence unique par lien

### 2.3 Gestion des liens
- Liste des liens de paiement
- Statut : pending / paid / cancelled
- Copie du lien
- Ouverture du lien dans un nouvel onglet
- Mise à jour manuelle du statut
- Date de mise à jour du statut
- Suppression / archive future selon roadmap

### 2.4 Transactions et historique
- Historique local des paiements reçus
- Intégration des liens marqués payés manuellement
- Déduplication des doublons par identifiant
- Filtres par recherche et colonne
- Vue transactions centralisée

### 2.5 Clients
- Liste des numéros associés aux paiements / liens
- Historique d’activité
- Profil client local future
- Tags et notes prévues

### 2.6 Analytique
- Revenus confirmés
- Paiements confirmés
- Taux de conversion approximatif
- Vue sur 7 / 30 jours
- Agrégation basée sur les statuts locaux

### 2.7 Paramètres / intégration
- Stockage local de la clé PayGateGlobal par compte
- Vérification locale de présence de clé
- Système de configuration stable

### 2.8 Landing page
- Présentation du produit
- CTA vers le dashboard
- Don 
- FAQ
- section Téléchargements / builds

## 3. Fonctionnalités validées actuellement

- Création de compte local
- Connexion / déconnexion
- Génération de lien de paiement
- Statut de paiement manuel
- Isolation des comptes par utilisateur
- Dashboard overview et analytics
- Dashboard transactions et liens
- Revenu par période locale
- Landing page + CTA donation
- Build web local

## 4. Fonctionnalités planifiées

### 4.1 Encaissements manuels
- Saisir un paiement manuel sans webhook
- Date de paiement
- Référence externe
- Méthode de paiement
- Note interne
- Historique des modifications

### 4.2 Clients détaillés
- Fiche client
- Notes, tags, historique
- Suivi des paiements et liens

### 4.3 Catalogue produit / service
- Produits à réutiliser
- Prix par devise
- Génération de lien depuis un produit

### 4.4 Gestion avancée des liens
- Duplication
- Expiration
- Archivage
- Filtre avancé

### 4.5 QR codes
- Génération QR d’un lien de paiement
- Téléchargement PNG/SVG

### 4.6 Exports
- CSV / JSON des liens, transactions et clients
- Export analytique

### 4.7 Sauvegardes et restauration
- Export SQLite
- Validation checksum ou hash
- Restauration locale

### 4.8 Relances clients
- Modèles de message
- Copie de relance
- Personnalisation simple

### 4.9 Analytics avancés
- Conversion sur périodes personnalisées
- Ventilation par méthode / devise / canal

## 5. Règles métier

- Aucun webhook n’est requis pour la plateforme fonctionnelle.
- Une confirmation automatique n’est pas le point de départ de l’outil.
- Le statut payé est une confirmation manuelle dans le dashboard, pas une validation fournisseur.
- Les données de paiement et de clients restent dans la base locale SQLite.
