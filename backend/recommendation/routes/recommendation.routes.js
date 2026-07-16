const express = require("express");

const router = express.Router();

const controller = require("../controllers/recommendation.controller");

const { auth } = require("../../middleware/auth");

router.post(

    "/track",

    auth,

    controller.track

);

module.exports = router;