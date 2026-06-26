const db = require("../database/db");
const Radio = require("../models/radio.model");
const fs = require("fs");
const path = require("path");

exports.getByDecade = (req, res) => {
    const decade = parseInt(req.params.decade);
    db.all("SELECT * FROM radios WHERE decade = ?", [decade], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(row => new Radio(row)));
    });
};

exports.getById = (req, res) => {
    db.get("SELECT * FROM radios WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: "Not found" });
        res.json(new Radio(row));
    });
};

exports.search = (req, res) => {
    const term = req.params.term;
    db.all("SELECT * FROM radios WHERE name LIKE ?", [`%${term}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(row => new Radio(row)));
    });
};

exports.create = (req, res) => {
    const body = req.body || {};
    const { name, description, hometown, decade, biography, politica, awards } = body;
    const decadeInt = parseInt(decade);
    const image = req.files?.image?.[0] ? `/uploads/radios_img/${req.files.image[0].filename}` : null;
    const titleimg = req.files?.titleimg?.[0] ? `/uploads/radios_img/${req.files.titleimg[0].filename}` : null;

    db.run(
        `INSERT INTO radios (name, image, titleimg, description, hometown, decade, biography, politica, awards) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, image, titleimg, description, hometown, decadeInt, biography, politica, awards],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json(new Radio({ id: this.lastID, name, image, titleimg, description, hometown, decade: decadeInt, biography, politica, awards }));
        }
    );
};

exports.update = (req, res) => {
    db.get("SELECT * FROM radios WHERE id = ?", [req.params.id], (err, oldRadio) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!oldRadio) return res.status(404).json({ message: "Radio non trovata" });

        const body = req.body || {};
        const allowedFields = ['name', 'description', 'hometown', 'decade', 'biography', 'politica', 'awards'];
        const updates = {};

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updates[field] = field === 'decade' ? parseInt(body[field]) : body[field];
            }
        });

        const files = req.files || {};

        if (files.image) {
            if (oldRadio.image) {
                fs.unlink(path.join(__dirname, '..', oldRadio.image), () => {});
            }
            updates.image = `/uploads/radios_img/${files.image[0].filename}`;
        }

        if (files.titleimg) {
            if (oldRadio.titleimg) {
                fs.unlink(path.join(__dirname, '..', oldRadio.titleimg), () => {});
            }
            updates.titleimg = `/uploads/radios_img/${files.titleimg[0].filename}`;
        }

        const fields = Object.keys(updates);
        if (fields.length === 0) return res.status(400).json({ message: 'Nessun campo valido' });

        const setClause = fields.map(k => `${k} = ?`).join(', ');
        const values = [...fields.map(k => updates[k]), req.params.id];

        db.run(
            `UPDATE radios SET ${setClause} WHERE id = ?`,
            values,
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Radio modificata con successo' });
            }
        );
    });
};

exports.remove = (req, res) => {
    const id = req.params.id;

    db.get("SELECT image, titleimg FROM radios WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: "Radio non trovata" });

        db.run("DELETE FROM radios WHERE id = ?", [id], function (deleteErr) {
            if (deleteErr) return res.status(500).json({ error: deleteErr.message });

            if (row.image) {
                const imagePath = path.join(__dirname, '..', row.image);
                fs.unlink(imagePath, (unlinkErr) => {
                    if (unlinkErr) console.error(`Errore eliminazione copertina: ${unlinkErr.message}`);
                });
            }

            if (row.titleimg) {
                const titleImgPath = path.join(__dirname, '..', row.titleimg);
                fs.unlink(titleImgPath, (unlinkErr) => {
                    if (unlinkErr) console.error(`Errore eliminazione titleimg: ${unlinkErr.message}`);
                });
            }

            res.json({ message: "Deleted" });
        });
    });
};