const db = require("../database/db");
const Product = require("../models/product.model");
const fs = require("fs");
const path = require("path");
const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');

exports.getByArtist = (req, res) => {
    db.all("SELECT * FROM merchandising WHERE artist_id = ?", [req.params.artistId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(row => new Product(row)));
    });
};

exports.search = (req, res) => {
    const term = req.params.term;
    db.all("SELECT * FROM merchandising WHERE name LIKE ?", [`%${term}%`], (err, rows) => {
        
        if (err) 
            return res.status(500).json({ error: err.message });

        res.json(rows.map(row => new Product(row)));
    });
};

exports.create = (req, res) => {
    const body = req.body || {};
    const { artistId, name, price, description, stock } = body;
    const image = req.files?.image?.[0] ? `/uploads/merch_img/${req.files.image[0].filename}` : null;

    db.run(
        `INSERT INTO merchandising (artist_id, name, image, price, description, stock) VALUES (?, ?, ?, ?, ?, ?)`,
        [artistId, name, image, price, description, stock],
        function (err) {
            if (err) 
                return res.status(500).json({ error: err.message });
            
            const newProductId = this.lastID;
            const createdProduct = new Product({ id: newProductId, artistId, name, image, price, description, stock });

            db.get('SELECT name FROM artists WHERE id = ?', [artistId], (errArtist, artistRow) => {
                if (errArtist || !artistRow) {
                    console.error('Impossibile recuperare il nome artista per la notifica');
                    return res.json(createdProduct);
                }

                const artistName = artistRow.name;

                const queryTokens = `
                    SELECT u.push_token 
                    FROM likes l
                    JOIN users u ON l.user_id = u.id
                    WHERE l.artist_id = ? AND u.push_token IS NOT NULL
                `;

                db.all(queryTokens, [artistId], (errLikes, rows) => {
                    if (errLikes) {
                        console.error('Errore nel recupero dei token dei fan:', errLikes);
                        return res.json(createdProduct);
                    }

                    const tokens = rows.map(row => row.push_token);

                    if (tokens.length === 0) {
                        console.log(`Nessun fan con dispositivo mobile registrato per l'artista ${artistName}`);
                        return res.json(createdProduct);
                    }

                    const message = {
                        notification: {
                            title: 'Nuovo Merchandising! 👕',
                            body: `È appena stato aggiunto un nuovo prodotto per: ${artistName}!`
                        },
                        tokens: tokens
                    };

                    getMessaging().sendEachForMulticast(message)
                        .then((response) => {
                            console.log(`Notifiche inviate, successCount: ${response.successCount}, failureCount: ${response.failureCount}`);
                        })
                        .catch((error) => {
                            console.error('Errore invio notifiche:', error);
                        });

                    return res.json(createdProduct);
                });
            });
        }
    );
};

exports.update = (req, res) => {
    db.get("SELECT * FROM merchandising WHERE id = ?", [req.params.id], (err, oldMerch) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!oldMerch) return res.status(404).json({ message: "Prodotto non trovato" });

        const body = req.body || {};
        const allowedFields = ['name', 'price', 'description', 'stock'];
        const updates = {};

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        });

        const files = req.files || {};

        if (files.image) {
            if (oldMerch.image) {
                fs.unlink(path.join(__dirname, '..', oldMerch.image), () => {});
            }
            updates.image = `/uploads/merch_img/${files.image[0].filename}`;
        }

        const fields = Object.keys(updates);
        if (fields.length === 0) return res.status(400).json({ message: 'Nessun campo modificato' });

        const setClause = fields.map(k => `${k} = ?`).join(', ');
        const values = [...fields.map(k => updates[k]), req.params.id];

        db.run(
            `UPDATE merchandising SET ${setClause} WHERE id = ?`,
            values,
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Prodotto modificato con successo' });
            }
        );
    });
};

exports.remove = (req, res) => {
    const id = req.params.id;

    db.get("SELECT image FROM merchandising WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: "Prodotto non trovato" });

        db.run("DELETE FROM merchandising WHERE id = ?", [id], function (deleteErr) {
            if (deleteErr) return res.status(500).json({ error: deleteErr.message });
            if (this.changes === 0) return res.status(404).json({ message: "Prodotto non trovato" });

            if (row.image) {
                const imagePath = path.join(__dirname, '..', row.image);
                fs.unlink(imagePath, (unlinkErr) => {
                    if (unlinkErr) console.error(`Errore rimozione file immagine merchandising: ${unlinkErr.message}`);
                });
            }

            res.json({ message: "Deleted" });
        });
    });
};

exports.getById = (req, res) => {
    const id = req.params.id;

    db.get('SELECT * FROM merchandising WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ message: "Prodotto di merchandising non trovato" });
        }
        res.json(row);
    });
};