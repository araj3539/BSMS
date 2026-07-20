import api from "./api";

const profileService = {
  async getCustomerProfile() {
    const { data } = await api.get("/recommendation/profile/me");
    return data.data;
  },
};

export default profileService;