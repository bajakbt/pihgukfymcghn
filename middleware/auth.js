const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    try {
        // الحصول على التوكن من Header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        // التحقق من الصيغة: Bearer TOKEN
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : authHeader;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Invalid token."
            });
        }

        // التحقق من JWT
        const decoded = jwt.verify(
            token,
process.env.JWT_SECRE        );

        // حفظ بيانات المستخدم داخل الطلب
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token expired or invalid."
        });
    }
};

module.exports = auth;