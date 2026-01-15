import userModel from "../Models/UserModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../config/brevo.js";
import getdataUri from "../config/DataURI.js";
import cloudinary from "../config/cloudinary.js";

export const register = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "Missing Details. Required Field Must be submitted" });
    }
    try {
        const existing_user = await userModel.findOne({ email });
        if (existing_user) {
            return res.status(409).json({ success: false, message: "User already Exist, Please Login" });
        }
        const hashpassword = await bcrypt.hash(password, 10);
        const user = await userModel.create({ name, email, password: hashpassword, isVerified: false });
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = otp;
        user.verifyOtpExpairy = Date.now() + 10 * 60 * 1000;
        await user.save();
        const mailoption = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Verify your Intryo account 🔐",
            text: `Hello ${name},

Welcome to Intryo 👋

Your One-Time Password (OTP) to verify your email is:

👉 ${otp}

This OTP is valid for 10 minutes.
Please do not share it with anyone.

— Team Intryo`
        }
        sendEmail(mailoption).catch(err => {
            console.error("OTP email failed:", err.message);
        });
        return res.status(201).json({ success: true, message: " Otp Send to Mail", next: "Verify_OTP" });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })

    }

}
export const resendOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is Required" })
    }
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User Not Found" });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        user.verifyOtp = String(otp);
        user.verifyOtpExpairy = Date.now() + 10 * 60 * 1000;
        await user.save();
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Resend Verification Otp 🔐",
            text: `Hey User Your Resend Verification otp is ${otp} This OTP is valid for 10 minutes.
Please do not share it with anyone.

— Team Intryo`
        }
        sendEmail(mailOption).catch(err => {
            console.log("otp mailed failed", err.message);
        })
        return res.status(201).json({ success: true, message: "otp send to mail", next: "verify the otp" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Details Missing." });
        }
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User Not Found!!! Please check or FUrther Registration " });
        }
        if (!user.isVerified) {
            return res.status(401).json({ success: false, message: "Email not verified" });
        }
        const ismatch = await bcrypt.compare(password, user.password);
        if (!ismatch) {
            return res.status(401).json({ success: false, message: "Invalid Password" });
        }

        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

        // Dynamic cookie settings for cross-origin (Render backend + localhost frontend)
        const isProduction = process.env.NODE_ENV === "production";
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
        };

        res.cookie("token", accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000
        });

        res.cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        sendEmail({
            to: user.email,
            subject: "Login successful ✅",
            text: `Hello ${user.name},

You have successfully logged in to your Intryo account.

If this wasn’t you, please reset your password immediately.

— Team Intryo`
        }).catch(err => {
            console.error("Login email failed:", err.message);
        });


        return res.status(200).json({
            success: true,
            message: "Login Complete",
            userId: user._id,
            token: accessToken,
            userData: {
                id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                friendscount: user.friendscount,
                fieldofintereset: user.fieldofintereset,
                sociallinks: user.sociallinks,
                fullfillmentpoint: user.fullfillmentpoint,
                profilepicture: user.profilepicture,
                isAccountVerified: user.isVerified,
                joinedAt: user.createdAt,
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
export const logout = async (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === "production";
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax"
        };

        res.clearCookie("token", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);

        return res.status(200).json({ success: true, message: "Logout successful", });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



export const verifyMail = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: "missing details" });
    }
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "No user Found " });
        }
        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.status(400).json({ success: false, message: "invalid Otp" });
        }
        if (user.verifyOtpExpairy < Date.now()) {
            return res.status(400).json({ success: false, message: "otp expire" });
        }
        user.isVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpairy = 0;
        await user.save();
        return res.status(200).json({ success: true, message: "Email verified succesfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }

}
export const isAuthenticated = async (req, res) => {
    try {
        return res.status(200).json({ success: true, message: "Authenticated" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
export const sendResetOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is Required" })
    }
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User Not Found" });
        }
        const otp = String(Math.floor(10000 + Math.random() * 900000));
        user.resendOtp = otp;
        user.resendOtpExpairy = Date.now() + 15 * 60 * 1000;
        await user.save();
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Password Reset OTP",
            text: `Your Reset Otp is ${otp}`
        }
        sendEmail(mailOption);
        return res.status(200).json({ success: true, message: "OTP Send to your email" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const resetpassOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!otp) {
        return res.status(400).json({ success: false, message: "Missing Details " })
    }
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User Not Found" })
        }
        if (user.resendOtp === '' || user.resendOtp !== otp) {
            return res.status(400).json({ success: false, message: "otp does not match" })
        }
        if (user.resendOtpExpairy < Date.now()) {
            return res.status(400).json({ success: false, message: "Otp Expire" })
        }

        user.resendOtp = "";
        user.resendOtppExpairy = 0;
        user.passwordchangeotpVerify = true;
        await user.save();
        return res.status(200).json({ success: true, message: "Otp Verify Succesfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
export const resetpass = async (req, res) => {
    const { email, newpassword } = req.body;
    if (!newpassword) {
        return res.status(404).json({ success: false, message: "Missing Details" });
    }
    try {
        const user = await userModel.findOne({ email });
        if (user.passwordchangeotpVerify !== true) {
            return res.status(404).json({ success: false, message: "Otp is Not Verified" });
        }
        const hashpassword = await bcrypt.hash(newpassword, 10);
        user.password = hashpassword;
        await user.save();
        return res.status(200).json({ success: true, message: "Password Chnage Succesfully" });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
export const refreshTokenController = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ success: false, message: "No refresh token" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: "15m" });

        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("token", newAccessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 15 * 60 * 1000
        });

        return res.status(200).json({ success: true });

    } catch (error) {
        return res.status(403).json({ success: false, message: "Invalid refresh token" });
    }
};

export const editprofile = async (req, res) => {
    try {
        const { userId } = req.params;
        const { bio, name, sociallinks, interest } = req.body;
        const profilepicture = req.file || (req.files && req.files[0]);
        let cloudresponse;
        if (profilepicture) {
            const fileuri = getdataUri(profilepicture);
            cloudresponse = await cloudinary.uploader.upload(fileuri);
        }
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            })
        }
        if (bio) user.bio = bio;
        if (sociallinks) user.sociallinks = sociallinks;
        if (name) user.name = name;
        if (interest) user.fieldofinterest = interest;
        if (profilepicture && cloudresponse) user.profilepicture = cloudresponse.secure_url;
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Profile Edit Succefully",
            userData: {
                id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                gender: user.gender,
                profilepicture: user.profilepicture,
                sociallinks: user.sociallinks,
                fieldofintereset: user.fieldofintereset,
                isAccountVerified: user.isVerified,

            }
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}