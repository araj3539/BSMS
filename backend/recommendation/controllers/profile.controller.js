const customerProfileService = require("../services/customerProfile.service");

class ProfileController {
  /**
   * GET /api/recommendation/profile/me
   */
  async getMyProfile(req, res) {
    try {
      const userId = req.user.id;

      const profile = await customerProfileService.getProfile(userId);

      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error("Customer Profile Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to load customer profile.",
      });
    }
  }
}

module.exports = new ProfileController();