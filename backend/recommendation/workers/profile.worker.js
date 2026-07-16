const profileService = require("../services/profile.service");

async function updateUserProfile(userId) {

    await profileService.buildUserProfile(userId);

}

module.exports = {

    updateUserProfile

};