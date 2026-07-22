const admin = (req, res, next) => {
    try {
        // يجب تشغيل auth.js قبل هذا الملف
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized."
            });
        }

        // التحقق من أن المستخدم Admin
        if (
            req.user.role !== "admin" &&
            req.user.isAdmin !== true
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admins only."
            });
        }

        next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
};

module.exports = admin;