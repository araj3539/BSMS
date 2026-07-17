const express = require("express");

const router = express.Router();

const optionalAuth = require("../../middleware/optionalAuth");

const controller = require("../controllers/recommendation.controller");

/**
 * AI Semantic Search
 */
router.get("/search", controller.search);

/**
 * Popular Books
 */
router.get("/popular", controller.popular);

/**
 * Home Recommendations
 */
router.get("/home", optionalAuth, controller.home);

/**
 * Frequently Bought Together
 */
router.get("/book/:bookId/frequently-bought", controller.frequentlyBought);

/**
 * Book Recommendations
 */
router.get("/book/:bookId", optionalAuth, controller.recommendBook);

module.exports = router;
