const express = require("express");

const router = express.Router();

const optionalAuth = require("../../middleware/optionalAuth");

const controller = require("../controllers/recommendation.controller");

router.get("/book/:bookId", controller.recommendBook);

router.get("/search", controller.search);

router.get("/popular", controller.popular);

router.get(
  "/book/:bookId/frequently-bought",

  controller.frequentlyBought,
);

router.get("/home", controller.home);

module.exports = router;
