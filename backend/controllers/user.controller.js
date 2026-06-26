const db = require('../database/db');
const fs = require('fs');
const path = require('path');
const User = require('../models/user.model'); 
const Address = require('../models/address.model');

exports.getProfile = (req, res) => {
  const userId = req.user.id; 

  const query = `
    SELECT 
      u.id, u.username, u.email, u.profileImage, u.role, u.firstName, u.lastName, u.phone,
      a.street, a.streetNumber, a.city, a.provinceCode, a.zipcode, a.country
    FROM users u
    LEFT JOIN addresses a ON u.id = a.user_id
    WHERE u.id = ?
  `;

  db.get(query, [userId], (err, row) => {
    if (err) return res.status(500).json({ message: 'Errore DB', error: err.message });
    if (!row) return res.status(404).json({ message: 'Utente non trovato' });

    const address = row.street ? new Address(row) : null;

    const userProfile = new User({
      ...row,
      shippingAddress: address
    });

    res.status(200).json(userProfile);
  });
};

exports.getPublicProfile = (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({ message: 'ID utente mancante' });
        }

        const query = `SELECT id, username, firstName, lastName, profileImage FROM users WHERE id = ?`;

        db.get(query, [userId], (err, row) => {
            if (err) {
                return res.status(500).json({ message: 'Errore nel recupero del profilo', error: err.message });
            }
            if (!row) {
                return res.status(404).json({ message: 'Utente non trovato' });
            }

            return res.json({
                id: row.id,
                username: row.username,
                firstName: row.firstName,
                lastName: row.lastName,
                profileImage: row.profileImage
            });
        });
    } catch (err) {
        return res.status(500).json({ message: 'Errore interno del server', error: err.message });
    }
};

exports.updateUser = (req, res) => {
    const userId = req.user.id;

    const allowedUserFields = [
        'username',
        'email',
        'firstName',
        'lastName',
        'phone'
    ];

    const allowedAddressFields = [
        'street',
        'streetNumber',
        'city',
        'provinceCode',
        'zipcode',
        'country'
    ];

    const user = req.body;
    const address = req.body.shippingAddress;

    const userKeys = Object.keys(user).filter(k => allowedUserFields.includes(k));
    
    for (const key of userKeys) {
        if (user[key] === undefined || user[key] === null || String(user[key]).trim() === '') {
            return res.status(400).json({ message: 'I campi utente non possono essere vuoti' });
        }
    }

    let addrKeys = [];
    if (address) {
        addrKeys = Object.keys(address).filter(k => allowedAddressFields.includes(k));
        
        for (const key of addrKeys) {
            if (address[key] === undefined || address[key] === null || String(address[key]).trim() === '') {
                return res.status(400).json({ message: "I campi dell'indirizzo non possono essere vuoti" });
            }
        }
    }

    if (userKeys.length === 0 && addrKeys.length === 0) {
        return res.status(400).json({ message: 'Nessuna modifica rilevata' });
    }

    db.run("BEGIN TRANSACTION", (errTx) => {
        if (errTx) return res.status(500).json({ message: 'Errore transazione', error: errTx.message });

        const updateAddressStep = () => {
            if (addrKeys.length > 0) {
                const setClause = addrKeys.map(k => `${k} = ?`).join(', ');
                const values = addrKeys.map(k => address[k]);
                const sql = `UPDATE addresses SET ${setClause} WHERE user_id = ?`;

                db.run(sql, [...values, userId], function (err) {
                    if (err) {
                        db.run("ROLLBACK");
                        return res.status(500).json({ message: 'Errore aggiornamento indirizzo', error: err.message });
                    }
                    
                    db.run("COMMIT");
                    return res.status(200).json({ message: 'Utente e indirizzo aggiornati con successo', userId });
                });
            } else {
                db.run("COMMIT");
                return res.status(200).json({ message: 'Utente aggiornato con successo', userId });
            }
        };

        if (userKeys.length > 0) {
            const setClause = userKeys.map(k => `${k} = ?`).join(', ');
            const values = userKeys.map(k => user[k]);
            const sql = `UPDATE users SET ${setClause} WHERE id = ?`;

            db.run(sql, [...values, userId], function (err) {
                if (err) {
                    db.run("ROLLBACK");
                    if (err.message.includes("UNIQUE")) {
                        if (err.message.includes("email")) {
                            return res.status(409).json({ message: 'Email già in uso' });
                        }
                        return res.status(409).json({ message: 'Username già in uso' });
                    }
                    return res.status(500).json({ message: 'Errore aggiornamento utente', error: err.message });
                }
                updateAddressStep();
            });
        } else {
            updateAddressStep();
        }
    });
};

exports.updateProfileImage = (req, res) => {
    const userId = req.user.id;

    if (!req.file) {
        return res.status(400).json({ error: 'Nessun file caricato' });
    }

    const newImagePath = `/uploads/${req.file.filename}`;
    const defaultImage = '/uploads/default.png';

    db.get(
        `SELECT profileImage FROM users WHERE id = ?`,
        [userId],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (!user) {
                return res.status(404).json({ message: 'Utente non trovato' });
            }

            if (user.profileImage && user.profileImage !== defaultImage) {
                const oldPath = path.join(
                    __dirname,
                    '..',
                    user.profileImage.replace(/^\//, '')
                );

                fs.unlink(oldPath, () => {});
            }

            db.run(
                `UPDATE users SET profileImage = ? WHERE id = ?`,
                [newImagePath, userId],
                function (err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    return res.status(200).json({
                        profileImage: newImagePath
                    });
                }
            );
        }
    );
};

exports.deleteAccount = (req, res) => {
    const userId = req.user?.id; 

    if (!userId) {
        return res.status(401).json({ message: "Utente non autenticato o token non valido" });
    }

    db.run(
        "DELETE FROM users WHERE id = ?",
        [userId],
        function (err) {
            if (err) {
                console.error("Errore DB durante l'eliminazione utente:", err.message);
                return res.status(500).json({ error: err.message });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ message: "Utente non trovato" });
            }

            res.json({ message: "Account eliminato con successo" });
        }
    );
};

exports.removeProfileImage = (req, res) => {

    const userId = req.user.id;
    const defaultImage = '/uploads/default.png';

    db.get(
        `SELECT profileImage FROM users WHERE id = ?`,
        [userId],
        (err, user) => {

            if (err)
                return res.status(500).json({ error: err.message });

            if (!user)
                return res.status(404).json({ message: 'Utente non trovato' });

            if (
                user.profileImage &&
                user.profileImage !== defaultImage
            ) {
                const filePath = path.join(
                    __dirname,
                    '..',
                    user.profileImage.replace(/^\//, '')
                );

                fs.unlink(filePath, () => {});
            }

            db.run(
                `UPDATE users SET profileImage = ? WHERE id = ?`,
                [defaultImage, userId],
                function (err) {

                    if (err)
                        return res.status(500).json({ error: err.message });

                    res.json({
                        profileImage: defaultImage
                    });
                }
            );
        }
    );
};