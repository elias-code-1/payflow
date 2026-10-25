const express = require('express');
const { getStats, getPayments, getCustomers, getLeads, createLead, createNewsletter } = require('../controllers/dashboardController');
const { generatePaymentLink, getPaymentLinks, getPaymentSettings, savePaymentSettings, getAuthStatus, updatePaymentLinkStatus, duplicatePaymentLink } = require('../controllers/paymentController');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authenticate');
const featureController = require('../controllers/featureController');

const { getDownloadLinks } = require('../config');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'API active' });
});

router.get('/downloads', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(getDownloadLinks());
});

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/session', authenticate, authController.session);
router.get('/auth/status', getAuthStatus);

router.use(authenticate);
router.get('/stats', getStats);
router.get('/payments', getPayments);
router.get('/customers', getCustomers);
router.get('/payment-links', getPaymentLinks);
router.get('/leads', getLeads);
router.post('/contact', createLead);
router.post('/newsletter', createNewsletter);
router.post('/payment', generatePaymentLink);
router.patch('/payment-links/:id/status', updatePaymentLinkStatus);
router.post('/payment-links/:id/duplicate', duplicatePaymentLink);
router.patch('/payment/status', updatePaymentLinkStatus);
router.get('/settings/payment', getPaymentSettings);
router.put('/settings/payment', savePaymentSettings);

router.get('/manual-payments', featureController.listManualPayments);
router.post('/manual-payments', featureController.createManualPayment);
router.put('/manual-payments/:id', featureController.updateManualPayment);
router.patch('/manual-payments/:id/status', featureController.setManualPaymentStatus);
router.get('/manual-payments/:id/history', featureController.manualPaymentHistory);

router.get('/customer-profiles', featureController.listCustomerProfiles);
router.post('/customer-profiles', featureController.createCustomerProfile);
router.get('/customer-profiles/:id', featureController.customerDetails);
router.put('/customer-profiles/:id', featureController.updateCustomerProfile);
router.patch('/customer-profiles/:id/archive', featureController.customerArchive);
router.delete('/customer-profiles/:id', featureController.deleteCustomer);
router.post('/customer-profiles/merge-preview', featureController.previewCustomerMerge);
router.post('/customer-profiles/merge', featureController.mergeCustomers);

router.get('/catalog', featureController.listCatalogItems);
router.post('/catalog', featureController.createCatalogItem);
router.get('/catalog/:id', featureController.catalogItemDetails);
router.put('/catalog/:id', featureController.updateCatalogItem);
router.post('/catalog/:id/duplicate', featureController.duplicateCatalogItem);
router.patch('/catalog/:id/archive', featureController.archiveCatalogItem);

router.patch('/payment-links/bulk-archive', featureController.bulkArchivePaymentLinks);
router.patch('/payment-links/:id/lifecycle', featureController.paymentLinkLifecycle);
router.get('/payment-links/:id/history', featureController.paymentLinkHistory);

router.get('/reminders', featureController.listReminders);
router.post('/reminders', featureController.createReminder);
router.patch('/reminders/:id', featureController.updateReminder);
router.get('/analytics', featureController.analytics);

router.get('/exports/preview', featureController.previewExport);
router.get('/exports/:type', featureController.exportData);

router.get('/backups', featureController.listBackups);
router.post('/backups', featureController.createBackup);
router.post('/backups/restore-latest-automatic', featureController.restoreLatestAutomaticBackup);
router.get('/backups/:id', featureController.downloadBackup);
router.post('/backups/verify', featureController.verifyBackup);
router.post('/backups/restore', featureController.restoreBackup);

module.exports = router;
