'use strict';

const { FeatureModel } = require('../models/FeatureModel');
const { DataToolsModel } = require('../models/DataToolsModel');

function handleError(res, error, fallback) {
  const status = Number(error?.status) || 500;
  if (status >= 500) console.error(fallback, error);
  return res.status(status).json({ message: status >= 500 ? fallback : error.message });
}

function idParam(req, key = 'id') {
  const id = Number(req.params[key]);
  if (!Number.isSafeInteger(id) || id <= 0) {
    const error = new Error('Identifiant invalide.');
    error.status = 400;
    throw error;
  }
  return id;
}

function exportFilters(query) {
  return {
    from: query.from,
    to: query.to,
    status: query.status,
    currency: query.currency,
    customerId: query.customerId,
    ids: query.ids,
    includeSensitive: query.includeSensitive,
  };
}

const controller = {
  async listManualPayments(req, res) {
    try { return res.json(await FeatureModel.listManualPayments(req.auth.userId, {
      status: req.query.status, currency: req.query.currency, method: req.query.method,
      customerId: req.query.customerId, from: req.query.from, to: req.query.to, q: req.query.q,
    })); } catch (error) { return handleError(res, error, 'Erreur de chargement des encaissements.'); }
  },

  async createManualPayment(req, res) {
    try { return res.status(201).json(await FeatureModel.createManualPayment(req.auth.userId, req.body || {})); }
    catch (error) { return handleError(res, error, 'Impossible d’enregistrer l’encaissement.'); }
  },

  async updateManualPayment(req, res) {
    try { return res.json(await FeatureModel.updateManualPayment(req.auth.userId, idParam(req), req.body || {})); }
    catch (error) { return handleError(res, error, 'Impossible de modifier l’encaissement.'); }
  },

  async setManualPaymentStatus(req, res) {
    try { return res.json(await FeatureModel.changeManualPaymentStatus(req.auth.userId, idParam(req), req.body?.status, req.body?.reason)); }
    catch (error) { return handleError(res, error, 'Impossible de modifier le statut de l’encaissement.'); }
  },

  async manualPaymentHistory(req, res) {
    try { return res.json(await FeatureModel.getManualPaymentHistory(req.auth.userId, idParam(req))); }
    catch (error) { return handleError(res, error, 'Impossible de charger l’historique de l’encaissement.'); }
  },

  async listCustomerProfiles(req, res) {
    try { return res.json(await FeatureModel.listCustomerProfiles(req.auth.userId, {
      archived: req.query.archived, q: req.query.q, from: req.query.from, to: req.query.to,
    })); } catch (error) { return handleError(res, error, 'Erreur de chargement des clients.'); }
  },

  async createCustomerProfile(req, res) {
    try {
      const input = req.body || {};
      const duplicates = await FeatureModel.findPotentialCustomerDuplicates(req.auth.userId, { phoneNumber: input.phoneNumber, email: input.email });
      const customer = await FeatureModel.createCustomerProfile(req.auth.userId, input);
      return res.status(201).json({ customer, potentialDuplicates: duplicates });
    } catch (error) { return handleError(res, error, 'Impossible de créer la fiche client.'); }
  },

  async customerDetails(req, res) {
    try { return res.json(await FeatureModel.getCustomerDetails(req.auth.userId, idParam(req))); }
    catch (error) { return handleError(res, error, 'Impossible de charger la fiche client.'); }
  },

  async updateCustomerProfile(req, res) {
    try {
      const input = req.body || {};
      const duplicates = await FeatureModel.findPotentialCustomerDuplicates(req.auth.userId, {
        phoneNumber: input.phoneNumber, email: input.email, excludeId: req.params.id,
      });
      const customer = await FeatureModel.updateCustomerProfile(req.auth.userId, idParam(req), input);
      return res.json({ customer, potentialDuplicates: duplicates });
    } catch (error) { return handleError(res, error, 'Impossible de modifier la fiche client.'); }
  },

  async customerArchive(req, res) {
    try { return res.json(await FeatureModel.setCustomerArchived(req.auth.userId, idParam(req), Boolean(req.body?.archived))); }
    catch (error) { return handleError(res, error, 'Impossible de modifier l’archivage du client.'); }
  },

  async deleteCustomer(req, res) {
    try { return res.json(await FeatureModel.deleteOrAnonymizeCustomer(req.auth.userId, idParam(req), req.body?.mode)); }
    catch (error) { return handleError(res, error, 'Impossible de supprimer ou anonymiser le client.'); }
  },

  async previewCustomerMerge(req, res) {
    try { return res.json(await FeatureModel.previewCustomerMerge(req.auth.userId, req.body?.targetId, req.body?.sourceIds)); }
    catch (error) { return handleError(res, error, 'Impossible de préparer la fusion des clients.'); }
  },

  async mergeCustomers(req, res) {
    try { return res.json(await FeatureModel.mergeCustomers(req.auth.userId, req.body?.targetId, req.body?.sourceIds)); }
    catch (error) { return handleError(res, error, 'Impossible de fusionner les fiches clients.'); }
  },

  async listCatalogItems(req, res) {
    try { return res.json(await FeatureModel.listCatalogItems(req.auth.userId, {
      archived: req.query.archived, category: req.query.category, q: req.query.q,
    })); } catch (error) { return handleError(res, error, 'Erreur de chargement du catalogue.'); }
  },

  async createCatalogItem(req, res) {
    try { return res.status(201).json(await FeatureModel.createCatalogItem(req.auth.userId, req.body || {})); }
    catch (error) { return handleError(res, error, 'Impossible de créer l’article.'); }
  },

  async catalogItemDetails(req, res) {
    try { return res.json(await FeatureModel.getCatalogItem(req.auth.userId, idParam(req))); }
    catch (error) { return handleError(res, error, 'Impossible de charger l’article.'); }
  },

  async updateCatalogItem(req, res) {
    try { return res.json(await FeatureModel.updateCatalogItem(req.auth.userId, idParam(req), req.body || {})); }
    catch (error) { return handleError(res, error, 'Impossible de modifier l’article.'); }
  },

  async duplicateCatalogItem(req, res) {
    try { return res.status(201).json(await FeatureModel.duplicateCatalogItem(req.auth.userId, idParam(req))); }
    catch (error) { return handleError(res, error, 'Impossible de dupliquer l’article.'); }
  },

  async archiveCatalogItem(req, res) {
    try { return res.json(await FeatureModel.setCatalogArchived(req.auth.userId, idParam(req), Boolean(req.body?.archived))); }
    catch (error) { return handleError(res, error, 'Impossible de modifier l’archivage de l’article.'); }
  },

  async paymentLinkLifecycle(req, res) {
    try { return res.json(await FeatureModel.changePaymentLinkLifecycle(req.auth.userId, idParam(req), req.body || {})); }
    catch (error) { return handleError(res, error, 'Impossible de modifier le cycle de vie du lien.'); }
  },

  async paymentLinkHistory(req, res) {
    try { return res.json(await FeatureModel.getPaymentLinkHistory(req.auth.userId, idParam(req))); }
    catch (error) { return handleError(res, error, 'Impossible de charger l’historique du lien.'); }
  },

  async bulkArchivePaymentLinks(req, res) {
    try { return res.json(await FeatureModel.bulkArchivePaymentLinks(req.auth.userId, req.body?.ids)); }
    catch (error) { return handleError(res, error, 'Impossible d’archiver les liens sélectionnés.'); }
  },

  async listReminders(req, res) {
    try { return res.json(await FeatureModel.listReminders(req.auth.userId)); }
    catch (error) { return handleError(res, error, 'Impossible de charger les relances.'); }
  },

  async createReminder(req, res) {
    try { return res.status(201).json(await FeatureModel.createReminder(req.auth.userId, req.body || {})); }
    catch (error) { return handleError(res, error, 'Impossible d’enregistrer la relance préparée.'); }
  },

  async updateReminder(req, res) {
    try { return res.json(await FeatureModel.updateReminder(req.auth.userId, idParam(req), req.body || {})); }
    catch (error) { return handleError(res, error, 'Impossible de modifier la relance.'); }
  },

  async analytics(req, res) {
    try {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      const from = req.query.from ? String(req.query.from) : undefined;
      const to = req.query.to ? String(req.query.to) : undefined;
      const validDate = (value) => {
        if (!datePattern.test(value)) return false;
        const parsed = new Date(`${value}T00:00:00Z`);
        return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
      };
      if ((from && !validDate(from)) || (to && !validDate(to)) || (from && to && from > to)) {
        return res.status(400).json({ message: 'Période analytique invalide.' });
      }
      return res.json(await FeatureModel.getAnalytics(req.auth.userId, from, to));
    } catch (error) { return handleError(res, error, 'Impossible de calculer les indicateurs.'); }
  },

  async previewExport(req, res) {
    try { return res.json(await DataToolsModel.previewExport(req.auth.userId, req.query.type, exportFilters(req.query))); }
    catch (error) { return handleError(res, error, 'Impossible de préparer l’export.'); }
  },

  async exportData(req, res) {
    try {
      const result = await DataToolsModel.createExport(req.auth.userId, req.params.type, exportFilters(req.query), req.query.format || 'csv');
      const filename = `payflow-${req.params.type}-${new Date().toISOString().slice(0, 10)}.${result.extension}`;
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(result.body);
    } catch (error) { return handleError(res, error, 'Impossible de générer l’export.'); }
  },

  async listBackups(req, res) {
    try { return res.json(await DataToolsModel.listBackups(req.auth.userId)); }
    catch (error) { return handleError(res, error, 'Impossible de charger les sauvegardes.'); }
  },

  async createBackup(req, res) {
    try { return res.status(201).json(await DataToolsModel.createBackup(req.auth.userId)); }
    catch (error) { return handleError(res, error, 'Impossible de créer une sauvegarde vérifiée.'); }
  },

  async downloadBackup(req, res) {
    try { return res.json(await DataToolsModel.getBackup(req.auth.userId, idParam(req))); }
    catch (error) { return handleError(res, error, 'Impossible de charger la sauvegarde.'); }
  },

  async verifyBackup(req, res) {
    try { return res.json(DataToolsModel.verifyBackup(req.body?.document)); }
    catch (error) { return handleError(res, error, 'La sauvegarde n’a pas pu être vérifiée.'); }
  },

  async restoreBackup(req, res) {
    try {
      if (req.body?.confirmed !== true) return res.status(400).json({ message: 'Confirmez explicitement le remplacement des données de ce compte.' });
      return res.json(await DataToolsModel.restoreBackup(req.auth.userId, req.body?.document));
    } catch (error) { return handleError(res, error, 'La restauration a échoué; les données courantes sont conservées.'); }
  },
};

module.exports = controller;
