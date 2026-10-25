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

### Étape 7 : aide, don et déconnexion
Depuis le dashboard, le marchand ouvre la page Aide & communauté pour consulter le dépôt GitHub ou soutenir PayFlow. Le bouton de don ouvre la page de paiement externe. Le marchand peut se déconnecter depuis le bas de la barre latérale ou depuis l’icône dédiée sur petit écran.

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

Le parcours utilisateur doit rester explicite : aucun webhook ni notification de paiement n’est utilisé. Un statut « Payé » est toujours saisi manuellement par le marchand.
