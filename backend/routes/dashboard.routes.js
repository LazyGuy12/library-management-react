// routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authJwt = require('../middlewares/authJwt');

// Thống kê tổng quan (Admin only)
router.get('/stats', authJwt.verifyToken, authJwt.isAdmin, dashboardController.getStats);

module.exports = router;
