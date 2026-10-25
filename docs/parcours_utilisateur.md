# Parcours utilisateur PayFlow

## 1. Parcours type d’un marchand local

### Étape 1 : création de compte
Le marchand crée un compte local avec email et mot de passe. Ce compte est isolé dans SQLite.

### Étape 2 : configuration de la clé API
Le marchand configure sa clé API dans le dashboard, par compte.

### Étape 3 : création d’un lien de paiement
Le marchand entre la description, le montant, la devise, le réseau et le téléphone client. Le lien est généré localement et enregistré.

### Étape 4 : partage du lien
Le marchand copie ou ouvre le lien et le transmet au client.

### Étape 5 : validation manuelle
Le marchand confirme le paiement depuis le dashboard si le statut a été observé ou enregistré localement.

### Étape 6 : gestion et reporting
Le marchand vérifie les statistiques, l’historique, les clients et les liens. Il peut exporter ou relancer selon ses besoins.

## 2. Cas d’usage

### Cas A — paiement par un client
- Le marchand crée un lien
- Le client ouvre le lien
- Le marchand confirme le statut dans le dashboard
- Statistiques et revenus locaux sont recalculés

### Cas B — encaissement manuel
- Le marchand saisit un paiement directement sans passer par un webhook
- La transaction est enregistrée dans l’historique
- Elle figure comme un paiement manuel local

### Cas C — suivi client
- Le marchand consulte les clients
- Il filtre les numéros
- Il peut renseigner les données complémentaires plus tard

## 3. Point de vigilance

Le parcours utilisateur doit rester explicite : le dashboard est un outil de gestion locale, pas un système de confirmation automatique fournisseur.
