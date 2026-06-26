const db = require('../database/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mail = require('../config/mail');
const User = require('../models/user.model');

exports.register = async (req, res) => {

    const {
        username,
        email,
        profileImage,
        password,
        firstName,
        lastName,
        phone,
        shippingAddress
    } = req.body;

    if (
        !username ||
        !email ||
        !password ||
        !firstName ||
        !lastName ||
        !phone ||
        !shippingAddress ||
        !shippingAddress.street ||
        !shippingAddress.streetNumber ||
        !shippingAddress.city ||
        !shippingAddress.provinceCode ||
        !shippingAddress.zipcode ||
        !shippingAddress.country
    ) {
        return res.status(400).json({ message: 'Compila tutti i campi' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run("BEGIN TRANSACTION");

    db.run(
        `INSERT INTO users (username, email, profileImage, password, firstName, lastName, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [username, email, profileImage, hashedPassword, firstName, lastName, phone],
        function (err) {

            if (err) {
                db.run("ROLLBACK");

                if (err.message.includes("UNIQUE")) {
                    return res.status(409).json({ message: "Email o username già esistono" });
                }

                return res.status(500).json({ message: 'Errore registrazione utente', error: err.message });
            }

            const userId = this.lastID;

            db.run(
                `INSERT INTO addresses (user_id, street, streetNumber, city, provinceCode, zipcode, country)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    shippingAddress.street,
                    shippingAddress.streetNumber,
                    shippingAddress.city,
                    shippingAddress.provinceCode,
                    shippingAddress.zipcode,
                    shippingAddress.country
                ],
                function (err2) {

                    if (err2) {
                        db.run("ROLLBACK");

                        return res.status(500).json({
                            message: 'Errore registrazione indirizzo',
                            error: err2.message
                        });
                    }

                    db.run("COMMIT");

                    return res.status(201).json({
                        message: 'Registrazione completata',
                        userId
                    });
                }
            );
        }
    );
};

exports.login = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Compila tutti i campi' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, userData) => {
        if (err) return res.status(500).json({ message: 'Errore' });
        if (!userData) return res.status(401).json({ message: 'Non valido' });

        const isValidPassword = await bcrypt.compare(password, userData.password);
        if (!isValidPassword) 
            return res.status(401).json({ message: 'Non valido' });

        const token = jwt.sign(
            { id: userData.id, username: userData.username, role: userData.role },
            process.env.JWT_SECRET,
            { expiresIn: '3d' }
        );

        const userInstance = new User({
            id: userData.id,
            username: userData.username,
            role: userData.role
        });

        res.status(200).json({
            message: 'ok',
            token,
            user: userInstance
        });
    });
};

exports.updatePushToken = (req, res) => {
    const { userId, pushToken } = req.body;

    if (!userId || !pushToken) {
        return res.status(400).json({ message: 'Dati mancanti' });
    }

    db.run(
        `UPDATE users SET push_token = ? WHERE id = ?`,
        [pushToken, userId],
        function (err) {
            if (err) {
                return res.status(500).json({ message: 'Errore DB', error: err.message });
            }
            return res.status(200).json({ message: 'Token aggiornato' });
        }
    );
};

exports.recoverPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email mancante" });
    }

    db.get(
        "SELECT id FROM users WHERE email = ?",
        [email],
        async (err, user) => {

            if (err) {
                return res.status(500).json({ error: "Errore col DB" });
            }

            if (!user) {
                return res.status(404).json({ error: "Email non trovata" });
            }

            db.run("DELETE FROM password_resets WHERE email = ?", [email]);

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const hash = await bcrypt.hash(code, 10);
            const expiresAt = Date.now() + 10 * 60 * 1000;

            db.run(
                "INSERT INTO password_resets (email, code_hash, expires_at) VALUES (?, ?, ?)",
                [email, hash, expiresAt],
                async (err) => {

                    if (err) {
                        return res.status(500).json({
                            error: "Errore nel DB",
                            details: err.message
                        });
                    }

                    try {
                        await mail.sendMail({
                            to: email,
                            subject: "Reset password",
                            html: `<h1>${code}</h1><p>Scade in 10 minuti</p>`
                        });

                        return res.status(200).json({ok: true});

                    } catch (e) {
                        return res.status(500).json({
                            error: "Errore nell'invio email",
                            details: e.message
                        });
                    }
                }
            );
        }
    );
};

exports.verifyCode = (req, res) => {
    const { email, code} = req.body;

    if (!email || !code) {
        return res.status(400).json({
            error: "Campi mancanti"
        });
    }

    db.get(
        "SELECT * FROM password_resets WHERE email = ?",
        [email],
        async (err, row) => {

            if (err) {
                return res.status(500).json({
                    error: "Errore generico nel DB",
                    details: err.message
                });
            }

            if (!row) {
                return res.status(404).json({
                    error: "Nessun codice trovato"
                });
            }

            if (Date.now() > row.expires_at) {
                db.run("DELETE FROM password_resets WHERE email = ?", [email]);
                return res.status(410).json({
                    error: "Codice scaduto"
                });
            }

            const valid = await bcrypt.compare(code, row.code_hash);

            if (!valid) {
                const maxAttempts = 3;
                const newAttempts = row.attempts + 1;

                if (newAttempts >= maxAttempts) {
                    db.run("DELETE FROM password_resets WHERE email = ?", [email]);
                    return res.status(429).json({
                        error: "Tentativi esauriti",
                        attemptsLeft: 0
                    });
                }

                db.run(
                    "UPDATE password_resets SET attempts = ? WHERE email = ?",
                    [newAttempts, email]
                );

                return res.status(401).json({
                    error: "Code invalido",
                    attemptsLeft: maxAttempts - newAttempts
                });
            }

            db.run("DELETE FROM password_resets WHERE email = ?", [email]);

            const recoverToken = jwt.sign(
                { email, purpose: "password_recover", verified: true },
                process.env.JWT_RECOVER_SECRET,
                { expiresIn: "10m" }
            );

            return res.status(200).json({
                ok: true,
                recoverToken
            });
        }
    );
};

exports.changePassword = async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: "Campi mancanti" });
    }

    if (!req.recover || !req.recover.email || !req.recover.verified) {
        return res.status(401).json({ error: "Token non valido" });
    }

    const email = req.recover.email;

    const hash = await bcrypt.hash(password, 10);

    db.run(
        "UPDATE users SET password = ? WHERE email = ?",
        [hash, email],
        function (err) {
            if (err) {
                return res.status(500).json({ error: "Errore DB" });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: "Utente non trovato" });
            }

            return res.status(200).json({ ok: true });
        }
    );
};