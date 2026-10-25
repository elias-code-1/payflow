export interface ReminderTemplate {
  id: string;
  categoryId: string;
  category: string;
  title: string;
  text: string;
}

interface TemplatePart {
  title: string;
  text: string;
}

interface TemplateCategory {
  id: string;
  label: string;
  openings: TemplatePart[];
  messages: TemplatePart[];
}

const categories: TemplateCategory[] = [
  {
    id: "chaleureux",
    label: "Chaleureux",
    openings: [
      { title: "Petit rappel", text: "Bonjour {{name}}, j’espère que vous allez bien." },
      { title: "Suivi de commande", text: "Bonjour {{name}}, je reviens vers vous au sujet de votre commande." },
      { title: "Message amical", text: "Bonjour {{name}}, un petit mot pour vous faciliter la suite." },
      { title: "Lien retrouvé", text: "Bonjour {{name}}, je vous remets le lien de paiement ici." },
      { title: "À votre rythme", text: "Bonjour {{name}}, prenez le temps qu’il vous faut pour consulter ce message." },
      { title: "Disponibilité", text: "Bonjour {{name}}, je reste disponible si vous avez une question." },
      { title: "Belle journée", text: "Bonjour {{name}}, j’espère que votre journée se passe bien." },
      { title: "Petit suivi", text: "Bonjour {{name}}, je fais simplement le suivi de votre demande." },
    ],
    messages: [
      { title: "Finaliser tranquillement", text: "Le règlement de {{description}} ({{amount}} {{currency}}) est toujours en attente. Vous pourrez le finaliser quand vous le souhaitez ici : {{url}}\n\nMerci beaucoup pour votre confiance." },
      { title: "Retrouver le lien", text: "Voici le lien pour régler {{description}}, d’un montant de {{amount}} {{currency}} : {{url}}\n\nMerci et à bientôt." },
      { title: "Commande prête", text: "Votre commande {{description}} est prête. Pour terminer le règlement de {{amount}} {{currency}}, voici le lien : {{url}}\n\nMerci pour votre confiance." },
      { title: "Aide proposée", text: "Le lien de règlement pour {{description}} ({{amount}} {{currency}}) est disponible ici : {{url}}\n\nDites-moi si vous souhaitez que je vous aide." },
    ],
  },
  {
    id: "court",
    label: "Très courts",
    openings: [
      { title: "Rappel rapide", text: "Bonjour {{name}}, petit rappel." },
      { title: "Lien ci-dessous", text: "Bonjour {{name}}, voici le lien." },
      { title: "Suivi bref", text: "Bonjour {{name}}, je reviens vers vous." },
      { title: "Info pratique", text: "Bonjour {{name}}, pour vous faciliter le paiement :" },
      { title: "Commande", text: "Bonjour {{name}}, au sujet de {{description}} :" },
      { title: "Montant", text: "Bonjour {{name}}, le montant à régler est de {{amount}} {{currency}}." },
      { title: "Petit mot", text: "Bonjour {{name}}, un mot au sujet de votre règlement." },
      { title: "Lien retrouvé", text: "Bonjour {{name}}, je vous renvoie votre lien." },
    ],
    messages: [
      { title: "Lien de paiement", text: "{{description}} · {{amount}} {{currency}} : {{url}}" },
      { title: "Règlement en attente", text: "Le règlement de {{description}} est en attente. Lien : {{url}}" },
      { title: "À portée de main", text: "Voici le lien pour terminer votre commande : {{url}}" },
      { title: "Merci", text: "Vous pouvez régler {{description}} ici : {{url}}\n\nMerci !" },
    ],
  },
  {
    id: "professionnel",
    label: "Professionnels",
    openings: [
      { title: "Suivi de règlement", text: "Bonjour {{name}}, je vous contacte au sujet du règlement en attente." },
      { title: "Commande concernée", text: "Bonjour {{name}}, ce message concerne {{description}}." },
      { title: "Rappel administratif", text: "Bonjour {{name}}, voici un rappel pour le suivi de votre commande." },
      { title: "Lien à disposition", text: "Bonjour {{name}}, je vous transmets à nouveau le lien de règlement." },
      { title: "Point de suivi", text: "Bonjour {{name}}, je fais suite à notre échange concernant votre règlement." },
      { title: "Information de paiement", text: "Bonjour {{name}}, le règlement associé à votre commande apparaît en attente." },
      { title: "Commande en cours", text: "Bonjour {{name}}, votre demande {{description}} est toujours en cours." },
      { title: "Rappel de dossier", text: "Bonjour {{name}}, je reviens vers vous pour le suivi de votre dossier." },
    ],
    messages: [
      { title: "Procéder au règlement", text: "Le montant de {{amount}} {{currency}} relatif à {{description}} peut être réglé à cette adresse : {{url}}\n\nJe reste à votre disposition pour toute précision." },
      { title: "Référence de commande", text: "Pour finaliser {{description}} ({{amount}} {{currency}}), veuillez utiliser le lien suivant : {{url}}\n\nMerci de votre attention." },
      { title: "Lien sécurisé", text: "Vous pouvez consulter les informations et procéder au règlement de {{description}} via ce lien : {{url}}\n\nLe montant indiqué est de {{amount}} {{currency}}." },
      { title: "Suite à donner", text: "Aucune action n’est nécessaire si vous avez déjà réglé. Sinon, le lien pour {{description}} ({{amount}} {{currency}}) est disponible ici : {{url}}" },
    ],
  },
  {
    id: "doux",
    label: "Relances douces",
    openings: [
      { title: "Sans urgence", text: "Bonjour {{name}}, je vous écris sans urgence au sujet de votre commande." },
      { title: "Quand vous pourrez", text: "Bonjour {{name}}, quand vous aurez un moment, voici le lien demandé." },
      { title: "Vérification", text: "Bonjour {{name}}, je vérifie simplement que vous avez bien reçu le lien." },
      { title: "Petit suivi utile", text: "Bonjour {{name}}, je vous partage à nouveau ces informations pour vous éviter de les rechercher." },
      { title: "Aucun souci", text: "Bonjour {{name}}, aucun souci si vous n’avez pas encore eu le temps de vous en occuper." },
      { title: "Je reste disponible", text: "Bonjour {{name}}, n’hésitez pas à me dire si vous avez besoin d’un renseignement." },
      { title: "À votre convenance", text: "Bonjour {{name}}, vous pouvez consulter ce rappel à votre convenance." },
      { title: "Suite de votre demande", text: "Bonjour {{name}}, je reviens vers vous pour que vous ayez toutes les informations utiles." },
    ],
    messages: [
      { title: "Lien à retrouver", text: "Le lien pour {{description}} ({{amount}} {{currency}}) est juste ici : {{url}}\n\nSi vous avez déjà effectué le règlement, vous pouvez ignorer ce message." },
      { title: "Question ou aide", text: "Votre règlement n’apparaît pas encore comme confirmé dans mon suivi. Vous pouvez retrouver le lien ici : {{url}}\n\nJe suis disponible si vous avez une question." },
      { title: "Information sans pression", text: "Je vous remets les détails de {{description}} : {{amount}} {{currency}}, avec le lien de règlement {{url}}\n\nPrenez le temps nécessaire." },
      { title: "Déjà réglé", text: "Si vous avez déjà réglé {{description}}, merci et vous pouvez ne pas tenir compte de ce rappel. Sinon, le lien est ici : {{url}}" },
    ],
  },
  {
    id: "prochainement",
    label: "À régler prochainement",
    openings: [
      { title: "Avant la suite", text: "Bonjour {{name}}, voici les informations pour finaliser votre commande." },
      { title: "Commande en attente", text: "Bonjour {{name}}, votre commande est prête et reste en attente de règlement." },
      { title: "Étape suivante", text: "Bonjour {{name}}, le règlement est la dernière étape pour terminer {{description}}." },
      { title: "Organisation", text: "Bonjour {{name}}, je vous transmets le lien afin que vous puissiez vous organiser." },
      { title: "Quand cela vous arrange", text: "Bonjour {{name}}, vous pouvez effectuer le règlement au moment qui vous convient." },
      { title: "Préparation", text: "Bonjour {{name}}, nous pouvons poursuivre dès que le règlement sera effectué." },
      { title: "Lien à conserver", text: "Bonjour {{name}}, pensez à garder ce lien si vous souhaitez revenir au règlement plus tard." },
      { title: "Rappel de disponibilité", text: "Bonjour {{name}}, le lien de paiement de votre commande reste disponible." },
    ],
    messages: [
      { title: "Terminer la commande", text: "Pour terminer {{description}} d’un montant de {{amount}} {{currency}}, utilisez ce lien : {{url}}" },
      { title: "Étape de paiement", text: "Le paiement de {{description}} est la prochaine étape. Vous pouvez le réaliser ici : {{url}}\n\nMerci." },
      { title: "Commande prête", text: "Votre commande {{description}} pourra être finalisée après le règlement de {{amount}} {{currency}} : {{url}}" },
      { title: "Lien à garder", text: "Voici votre lien de paiement pour {{description}} ({{amount}} {{currency}}). Vous pouvez le conserver et l’ouvrir lorsque vous êtes prêt : {{url}}" },
    ],
  },
  {
    id: "retard",
    label: "Règlement en attente",
    openings: [
      { title: "Suivi de paiement", text: "Bonjour {{name}}, mon suivi indique que le règlement de votre commande est encore en attente." },
      { title: "Point à vérifier", text: "Bonjour {{name}}, je vérifie avec vous le statut du règlement de {{description}}." },
      { title: "Règlement non confirmé", text: "Bonjour {{name}}, le paiement ne m’est pas encore apparu comme confirmé." },
      { title: "État de commande", text: "Bonjour {{name}}, votre commande reste en attente de règlement dans mon suivi." },
      { title: "Vérification simple", text: "Bonjour {{name}}, avez-vous pu consulter le lien de paiement que je vous ai envoyé ?" },
      { title: "Suite au rappel", text: "Bonjour {{name}}, je reviens vers vous car le règlement reste indiqué comme en attente." },
      { title: "Besoin d’aide", text: "Bonjour {{name}}, si le paiement a rencontré un problème, dites-le-moi et je regarderai avec vous." },
      { title: "Lien à nouveau", text: "Bonjour {{name}}, je vous renvoie le lien afin de faciliter le suivi du règlement." },
    ],
    messages: [
      { title: "Reprendre le paiement", text: "Vous pouvez reprendre le règlement de {{description}} ({{amount}} {{currency}}) ici : {{url}}\n\nSi vous avez déjà payé, merci de me le signaler pour que je vérifie mon suivi." },
      { title: "Confirmer le statut", text: "Le règlement de {{description}} n’apparaît pas encore confirmé de mon côté. Voici le lien utilisé : {{url}}\n\nMerci de me dire si votre paiement est déjà effectué." },
      { title: "Aide en cas de blocage", text: "Si le paiement de {{amount}} {{currency}} n’a pas abouti, vous pouvez réessayer à partir de ce lien : {{url}}\n\nJe reste disponible pour vous aider." },
      { title: "Pas encore réglé", text: "Si vous souhaitez toujours {{description}}, le lien de règlement est disponible ici : {{url}}\n\nVous pouvez ignorer ce message si votre paiement a déjà été fait." },
    ],
  },
  {
    id: "fidele",
    label: "Clients fidèles",
    openings: [
      { title: "Merci pour votre fidélité", text: "Bonjour {{name}}, merci encore pour votre confiance." },
      { title: "Comme convenu", text: "Bonjour {{name}}, comme convenu, je vous envoie les détails de votre commande." },
      { title: "Votre nouvelle commande", text: "Bonjour {{name}}, je suis heureux de vous accompagner pour cette nouvelle commande." },
      { title: "Toujours disponible", text: "Bonjour {{name}}, je reste à votre disposition comme d’habitude." },
      { title: "Petit service", text: "Bonjour {{name}}, je vous remets le lien ici pour vous faire gagner du temps." },
      { title: "Suite à notre échange", text: "Bonjour {{name}}, je fais suite à notre échange au sujet de {{description}}." },
      { title: "Merci de revenir", text: "Bonjour {{name}}, merci d’avoir de nouveau fait appel à mes services." },
      { title: "Suivi personnalisé", text: "Bonjour {{name}}, voici un suivi rapide de votre demande." },
    ],
    messages: [
      { title: "Finaliser ensemble", text: "Il reste le règlement de {{amount}} {{currency}} pour finaliser {{description}}. Vous pouvez le faire ici : {{url}}\n\nMerci encore pour votre fidélité." },
      { title: "Lien prêt", text: "Votre lien pour {{description}} est prêt : {{url}}\n\nLe montant est de {{amount}} {{currency}}. Merci pour votre confiance renouvelée." },
      { title: "Comme d’habitude", text: "Pour régler {{description}}, voici le lien direct : {{url}}\n\nMerci beaucoup, et dites-moi si vous souhaitez un renseignement." },
      { title: "Un coup de main", text: "Je vous remets le lien de {{description}} ({{amount}} {{currency}}) : {{url}}\n\nSi quelque chose a changé, faites-moi signe et nous trouverons une solution." },
    ],
  },
];

export const REMINDER_TEMPLATES: ReminderTemplate[] = categories.flatMap((category) =>
  category.openings.flatMap((opening, openingIndex) =>
    category.messages.map((message, messageIndex) => ({
      id: `${category.id}-${openingIndex + 1}-${messageIndex + 1}`,
      categoryId: category.id,
      category: category.label,
      title: `${opening.title} · ${message.title}`,
      text: `${opening.text}\n\n${message.text}`,
    })),
  ),
);

export const REMINDER_TEMPLATE_CATEGORIES = categories.map(({ id, label }) => ({ id, label }));
export const REMINDER_TEMPLATE_COUNT = REMINDER_TEMPLATES.length;
