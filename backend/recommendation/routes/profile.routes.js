const express = require("express");
const router = express.Router();

const { auth } = require("../../middleware/auth");
const profileController = require("../controllers/profile.controller");

/**
 * Customer Profile
 * GET /api/recommendation/profile/me
 */
router.get("/me", auth, profileController.getMyProfile);

module.exports = router;