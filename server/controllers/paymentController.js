const PaymentModel = require('../models/PaymentModel');
const UserModel = require('../models/UserModel');
const { FeatureModel } = require('../models/FeatureModel');
const crypto = require('crypto');

function normalizeExpiration(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function generatePaymentLink(req, res) {
  try {
    const token = await PaymentModel.getPaymentProviderToken(req.auth.userId);
    if (!token) {
      return res.status(503).json({ message: 'Configurez votre clé API PayGateGlobal dans les paramètres.' });
    }

    const { description, phone_number, amount, display_amount, currency = 'XOF', network, identifier, customer_id, catalog_item_id, expires_at } = req.body;

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || !description?.trim()) {
      return res.status(400).json({ message: 'Une description et un montant supérieur à 0 sont requis.' });
    }
    const displayAmount = display_amount === undefined || display_amount === null || display_amount === '' ? Number(amount) : Number(display_amount);
    if (!Number.isFinite(displayAmount) || displayAmount <= 0) {
      return res.status(400).json({ message: 'Le montant affiché doit être supérieur à 0.' });
    }
    if (!['XOF', 'EUR', 'USD'].includes(currency)) {
      return res.status(400).json({ message: 'Devise non prise en charge.' });
    }
    const expiresAt = normalizeExpiration(expires_at);
    if (expiresAt === false) return res.status(400).json({ message: 'Date d’expiration invalide.' });

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

    const id = await PaymentModel.createPaymentLink({
      userId: req.auth.userId,
      identifier: paymentIdentifier,
      description: paymentDescription,
      amount: Number(amount),
      displayAmount,
      currency,
      network: paymentNetwork,
      phoneNumber: phone_number,
      paymentUrl: paymentUrl.toString(),
      customerId: customer_id ? Number(customer_id) : null,
      catalogItemId: catalog_item_id ? Number(catalog_item_id) : null,
      expiresAt,
    });

    return res.status(201).json({
      ok: true,
      id,
      identifier: paymentIdentifier,
      paymentUrl: paymentUrl.toString(),
      amount: Number(amount),
      display_amount: displayAmount,
      currency,
      network: paymentNetwork,
    });
  } catch (error) {
    console.error('Payment link error:', error);
    return res.status(Number(error.status) || 500).json({ message: error.status ? error.message : 'Impossible de générer le lien de paiement.' });
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

    const nextStatus = await PaymentModel.updatePaymentLinkStatus(req.auth.userId, paymentLinkId, status, req.body?.reason);
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

async function duplicatePaymentLink(req, res) {
  try {
    const source = await FeatureModel.getPaymentLinkForUser(req.auth.userId, Number(req.params.id));
    if (!source) return res.status(404).json({ message: 'Lien de paiement introuvable.' });
    if (source.archived_at) return res.status(400).json({ message: 'Restaurez le lien archivé avant de le dupliquer.' });
    const token = await PaymentModel.getPaymentProviderToken(req.auth.userId);
    if (!token) return res.status(503).json({ message: 'Configurez votre clé API PayGateGlobal dans les paramètres.' });
    const displayAmount = Number(source.display_amount ?? source.amount);
    const displayCurrency = source.display_amount == null ? 'XOF' : source.currency;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const identifier = `order_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      const paymentUrl = new URL('https://paygateglobal.com/v1/page');
      paymentUrl.search = new URLSearchParams({
        token,
        amount: String(Number(source.amount)),
        description: String(source.description).slice(0, 120),
        identifier,
        ...(source.phone_number ? { phone: String(source.phone_number) } : {}),
        network: String(source.payment_method || 'TMONEY'),
      }).toString();
      try {
        const id = await PaymentModel.createPaymentLink({
          userId: req.auth.userId,
          identifier,
          description: source.description,
          amount: Number(source.amount),
          displayAmount,
          currency: displayCurrency,
          network: source.payment_method,
          phoneNumber: source.phone_number,
          paymentUrl: paymentUrl.toString(),
          customerId: source.customer_id,
          catalogItemId: source.catalog_item_id,
        });
        return res.status(201).json({ ok: true, id, identifier, paymentUrl: paymentUrl.toString() });
      } catch (error) {
        const isIdentifierCollision = error.code === 'SQLITE_CONSTRAINT' && String(error.message).includes('payment_links.identifier');
        if (!isIdentifierCollision || attempt === 4) throw error;
      }
    }
    return res.status(500).json({ message: 'Impossible de créer un identifiant unique pour ce lien.' });
  } catch (error) {
    console.error('Payment link duplication error:', error);
    return res.status(Number(error.status) || 500).json({ message: error.status ? error.message : 'Impossible de dupliquer le lien.' });
  }
}

module.exports = { generatePaymentLink, getPaymentLinks, getPaymentSettings, savePaymentSettings, getAuthStatus, updatePaymentLinkStatus, duplicatePaymentLink };
