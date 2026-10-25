const express = require('express');
const { getStats, getPayments, getCustomers, getLeads, createLead, createNewsletter } = require('../controllers/dashboardController');
const { generatePaymentLink, getPaymentLinks, getPaymentSettings, savePaymentSettings, getAuthStatus, updatePaymentLinkStatus } = require('../controllers/paymentController');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'API active' });
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
router.patch('/payment/status', updatePaymentLinkStatus);
router.get('/settings/payment', getPaymentSettings);
router.put('/settings/payment', savePaymentSettings);

module.exports = router;
