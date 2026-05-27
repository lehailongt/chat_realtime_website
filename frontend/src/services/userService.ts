import api from "@/lib/axios";

export const userService = {
  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/users/uploadAvatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 400) {
      throw new Error(res.data.message);
    }

    return res.data;
  },

  updateProfile: async (formData: FormData) => {
    const res = await api.put("/users/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status !== 200) {
      throw new Error(res.data.message || "Cập nhật thất bại");
    }

    return res.data;
  },
};
