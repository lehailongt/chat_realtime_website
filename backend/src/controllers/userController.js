import { uploadImageFromBuffer, deleteImageFromCloudinary } from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js";

export const authMe = async (req, res) => {
  try {
    const user = req.user; // lấy từ authMiddleware

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const searchUserByUsername = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.trim() === "") {
      return res.status(400).json({ message: "Cần cung cấp username trong query." });
    }

    const user = await User.findOne({ username }).select(
      "_id displayName username avatarUrl"
    );

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi xảy ra khi searchUserByUsername", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user._id;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadImageFromBuffer(file.buffer);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatarUrl: result.secure_url,
        avatarId: result.public_id,
      },
      {
        new: true,
      }
    ).select("avatarUrl");

    if (!updatedUser.avatarUrl) {
      return res.status(400).json({ message: "Avatar trả về null" });
    }

    return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
  } catch (error) {
    console.error("Lỗi xảy ra khi upload avatar", error);
    return res.status(500).json({ message: "Upload failed" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { displayName, email, phone, bio } = req.body;
    const file = req.file;

    // Validate dữ liệu
    if (!displayName || !email) {
      return res.status(400).json({ message: "Tên hiển thị và email là bắt buộc" });
    }

    // Kiểm tra email đã tồn tại chưa (nếu thay đổi)
    const existingUser = await User.findOne({
      email,
      _id: { $ne: userId },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // Cập nhật dữ liệu
    const updateData = {
      displayName: displayName.trim(),
      email: email.trim().toLowerCase(),
      bio: bio ? bio.trim().substring(0, 500) : undefined,
      phone: phone ? phone.trim() : undefined,
    };

    // Nếu có file avatar, upload lên Cloudinary
    if (file) {
      const user = await User.findById(userId);
      
      // Xoá avatar cũ nếu có
      if (user.avatarId) {
        try {
          await deleteImageFromCloudinary(user.avatarId);
        } catch (error) {
          console.error("Lỗi khi xoá avatar cũ", error);
        }
      }

      const result = await uploadImageFromBuffer(file.buffer);
      updateData.avatarUrl = result.secure_url;
      updateData.avatarId = result.public_id;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-hashedPassword");

    return res.status(200).json({
      message: "Cập nhật thông tin thành công",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi xảy ra khi cập nhật thông tin", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
