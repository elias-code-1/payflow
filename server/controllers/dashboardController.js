const PaymentModel = require('../models/PaymentModel');

async function getStats(req, res) {
  try {
    const stats = await PaymentModel.getStats(req.auth.userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Erreur stats', error: error.message });
  }
}

async function getPayments(req, res) {
  try {
    const payments = await PaymentModel.getPayments(req.auth.userId);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Erreur chargement transactions', error: error.message });
  }
}

async function getCustomers(req, res) {
  try {
    res.json(await PaymentModel.getCustomers(req.auth.userId));
  } catch (error) {
    res.status(500).json({ message: 'Erreur chargement clients', error: error.message });
  }
}

async function getLeads(req, res) {
  try {
    const leads = await PaymentModel.getLeads(req.auth.userId);
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Erreur chargement leads', error: error.message });
  }
}

async function createLead(req, res) {
  try {
    const { fullName, email, company, project, message } = req.body;

    if (!fullName || !email || !project || !message) {
      return res.status(400).json({ message: 'Nom, email, projet et message sont requis.' });
    }

    await PaymentModel.createLead(req.auth.userId, { fullName, email, company, project, message });
    return res.status(201).json({ ok: true, message: 'Demande enregistrée avec succès.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur enregistrement', error: error.message });
  }
}

async function createNewsletter(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requis.' });
    }

    await PaymentModel.createNewsletter(req.auth.userId, email);
    return res.status(201).json({ ok: true, message: 'Inscription newsletter validée.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur newsletter', error: error.message });
  }
}

module.exports = { getStats, getPayments, getCustomers, getLeads, createLead, createNewsletter };
