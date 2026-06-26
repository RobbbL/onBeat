const jwt = require('jsonwebtoken');

function recoverAuth(req, res, next) {

    const token = req.body.recoverToken || req.headers.authorization;

    if (!token) {
        return res.status(401).json({
            message: 'Token mancante'
        });
    }

    try {

        const cleanToken = token.replace("Bearer ", "");

        const decoded = jwt.verify(
            cleanToken,
            process.env.JWT_RECOVER_SECRET
        );

        if (decoded.purpose !== 'password_recover') {
            return res.status(401).json({
                message: 'Token non valido'
            });
        }

        req.recover = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: 'Token non valido o scaduto'
        });

    }
}

module.exports = recoverAuth;