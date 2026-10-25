const PaymentModel = require('../models/PaymentModel');
const UserModel = require('../models/UserModel');

async function generatePaymentLink(req, res) {
  try {
    const token = await PaymentModel.getPaymentProviderToken(req.auth.userId);
    if (!token) {
      return res.status(503).json({ message: 'Configurez votre clé API PayGateGlobal dans les paramètres.' });
    }

    const { description, phone_number, amount, display_amount, currency = 'XOF', network, identifier } = req.body;

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || !description?.trim()) {
      return res.status(400).json({ message: 'Une description et un montant supérieur à 0 sont requis.' });
    }
    if (!['XOF', 'EUR', 'USD'].includes(currency)) {
      return res.status(400).json({ message: 'Devise non prise en charge.' });
    }

    const paymentIdentifier = identifier || `order_${Date.now()}`;
    const paymentDescription = description.trim().slice(0, 120);
    const paymentNetwork = (network || 'TMONEY').toUpperCase();
    const paymentUrl = new URL('https://paygateglobal.com/v1/page');
    paymentUrl.search = new URLSearchParams({
      token,
      amount: String(Number(amount)),
      description: paymentDescription,
      identifier: paymentIdentifier,
      ...(phone_number ? { phone: String(phone_number) } : {}),
      network: paymentNetwork,
    }).toString();

    await PaymentModel.createPaymentLink({
      userId: req.auth.userId,
      identifier: paymentIdentifier,
      description: paymentDescription,
      amount: Number(amount),
      displayAmount: Number(display_amount || amount),
      currency,
      network: paymentNetwork,
      phoneNumber: phone_number,
      paymentUrl: paymentUrl.toString(),
    });

    return res.status(201).json({
      ok: true,
      identifier: paymentIdentifier,
      paymentUrl: paymentUrl.toString(),
      amount: Number(amount),
      display_amount: Number(display_amount || amount),
      currency,
      network: paymentNetwork,
    });
  } catch (error) {
    console.error('Payment link error:', error);
    return res.status(500).json({ message: 'Impossible de générer le lien de paiement.' });
  }
}

async function getPaymentLinks(req, res) {
  try {
    return res.json(await PaymentModel.getPaymentLinks(req.auth.userId));
  } catch (error) {
    return res.status(500).json({ message: 'Erreur chargement des liens', error: error.message });
  }
}

async function getPaymentSettings(req, res) {
  try {
    return res.json({ configured: await PaymentModel.hasPaymentProviderToken(req.auth.userId) });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur chargement des paramètres.' });
  }

}

async function getAuthStatus(req, res) {
  try {
    return res.json({ hasAccounts: (await UserModel.count()) > 0 });
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de vérifier les comptes locaux.' });
  }
}

async function savePaymentSettings(req, res) {
  try {
    const token = typeof req.body.apiToken === 'string' ? req.body.apiToken.trim() : '';
    if (token.length < 8 || token.length > 500) {
      return res.status(400).json({ message: 'La clé API semble invalide.' });
    }
    await PaymentModel.savePaymentProviderToken(req.auth.userId, token);
    return res.json({ ok: true, configured: true });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de l’enregistrement de la clé API.' });
  }
}

async function updatePaymentLinkStatus(req, res) {
  try {
    const { status } = req.body || {};
    const paymentLinkId = Number(req.params.id ?? req.body?.id);
    if (!Number.isInteger(paymentLinkId) || paymentLinkId <= 0) {
      return res.status(400).json({ message: 'Identifiant du lien invalide.' });
    }

    const nextStatus = await PaymentModel.updatePaymentLinkStatus(req.auth.userId, paymentLinkId, status);
    if (!nextStatus) {
      return res.status(404).json({ message: 'Lien de paiement introuvable.' });
    }
    return res.json({ ok: true, status: nextStatus });
  } catch (error) {
    if (error.message === 'Statut de paiement invalide.') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Payment-link status update error:', error);
    return res.status(500).json({ message: 'Impossible de mettre à jour le statut.' });
  }
}

module.exports = { generatePaymentLink, getPaymentLinks, getPaymentSettings, savePaymentSettings, getAuthStatus, updatePaymentLinkStatus };
