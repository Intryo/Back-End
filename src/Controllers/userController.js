import userModel from "../Models/UserModel.js";

export const getUserData = async (req, res) => {
    try {
        const userId = req.user?.id ?? req.user?._id ?? req.user;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const user = await userModel.findById(userId).select("-password");
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        return res.json({
            success: true,
            userData: {
                id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                age: user.age,
                gender: user.gender,
                avatar: user.avatar,
                isAccountVerified: user.isVerified,
                joinedAt: user.createdAt,
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}