const db = require("../database/db");
const Artist = require("../models/artist.model");
const fs = require("fs");
const path = require("path");

exports.getByDecade = (req, res) => {
    const query = `
        SELECT artists.*, COUNT(likes.artist_id) AS likeCount
        FROM artists
        LEFT JOIN likes ON artists.id = likes.artist_id
        WHERE artists.decade = ?
        GROUP BY artists.id
    `;
    db.all(query, [req.params.decade], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(row => new Artist(row)));
    });
};

exports.getById = (req, res) => {
    db.get("SELECT * FROM artists WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: "Not found" });
        res.json(new Artist(row));
    });
};

exports.getTopArtists = (req, res) => {
    const sql = `
        SELECT a.*, COUNT(l.artist_id) as likeCount
        FROM artists a
        LEFT JOIN likes l ON a.id = l.artist_id
        GROUP BY a.id
        ORDER BY likeCount DESC
        LIMIT 5
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Errore nel recupero', error: err.message });
        res.status(200).json(rows.map(row => new Artist(row)));
    });
};

exports.search = (req, res) => {
    const term = req.params.term;
    if (!term) return res.status(400).json({ message: "Termine mancante" });

    db.all("SELECT * FROM artists WHERE name LIKE ?", [`%${term}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(row => new Artist(row)));
    });
};

exports.create = (req, res) => {
    const { name, description, biography, awards, politica, genre, decade } = req.body;
    const image = req.files?.image?.[0] ? `/uploads/artists_img/${req.files.image[0].filename}` : null;
    const titleimg = req.files?.titleimg?.[0] ? `/uploads/artists_img/${req.files.titleimg[0].filename}` : null;

    db.run(
        `INSERT INTO artists (name, image, description, biography, awards, politica, genre, decade, titleimg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, image, description, biography, awards, politica, genre, decade, titleimg],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json(new Artist({ id: this.lastID, name, image, description, biography, awards, politica, genre, decade, titleimg }));
        }
    );
};

exports.addLike = (req, res) => {
    const { artistId } = req.body;
    if (!artistId) return res.status(400).json({ message: 'ID Artista mancante' });

    db.run(`INSERT INTO likes (user_id, artist_id) VALUES (?, ?)`, [req.user.id, artistId], function (err) {
        if (err) return res.status(500).json({ message: 'Errore inserimento like', error: err.message });
        res.status(201).json({ message: 'Like aggiunto' });
    });
};

exports.removeLike = (req, res) => {
    db.run(`DELETE FROM likes WHERE user_id = ? AND artist_id = ?`, [req.user.id, req.body.artistId], function (err) {
        if (err) return res.status(500).json({ message: 'Errore rimozione like', error: err.message });
        res.status(200).json({ message: 'Like rimosso' });
    });
};

exports.checkIfLiked = (req, res) => {
    db.get(`SELECT 1 FROM likes WHERE user_id = ? AND artist_id = ?`, [req.user.id, req.params.artistId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ liked: !!row });
    });
};

exports.update = (req, res) => {
  db.get("SELECT * FROM artists WHERE id = ?", [req.params.id], (err, oldArtist) => {
    if (err) 
        return res.status(500).json({ error: err.message });
    if (!oldArtist) 
        return res.status(404).json({ message: "Artista non trovato" });

    const allowedFields = ['name', 'genre', 'decade', 'description', 'biography', 'awards', 'politica'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const files = req.files || {};

    if (files.image) {
      if (oldArtist.image) {
        fs.unlink(path.join(__dirname, '..', oldArtist.image), () => {});
      }
      updates.image = `/uploads/artists_img/${files.image[0].filename}`;
    }

    if (files.titleimg) {
      if (oldArtist.titleimg) {
        fs.unlink(path.join(__dirname, '..', oldArtist.titleimg), () => {});
      }
      updates.titleimg = `/uploads/artists_img/${files.titleimg[0].filename}`;
    }

    const fields = Object.keys(updates);
    if (fields.length === 0) return res.status(400).json({ message: 'Nessun campo valido' });

    const setClause = fields.map(k => `${k} = ?`).join(', ');
    const values = [...fields.map(k => updates[k]), req.params.id];

    db.run(
      `UPDATE artists SET ${setClause} WHERE id = ?`,
      values,
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Artista aggiornato con successo' });
      }
    );
  });
};

exports.remove = (req, res) => {
    const id = req.params.id;

    db.get("SELECT image, titleimg FROM artists WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: "Artista non trovato" });

        db.run("DELETE FROM artists WHERE id = ?", [id], function (deleteErr) {
            if (deleteErr) return res.status(500).json({ error: deleteErr.message });

            if (row.image) {
                const imagePath = path.join(__dirname, '..', row.image);
                fs.unlink(imagePath, (unlinkErr) => {
                    if (unlinkErr) console.error(`Errore rimozione immagine artista: ${unlinkErr.message}`);
                });
            }

            if (row.titleimg) {
                const titleImgPath = path.join(__dirname, '..', row.titleimg);
                fs.unlink(titleImgPath, (unlinkErr) => {
                    if (unlinkErr) console.error(`Errore rimozione titleimg artista: ${unlinkErr.message}`);
                });
            }

            res.json({ message: "Deleted" });
        });
    });
};