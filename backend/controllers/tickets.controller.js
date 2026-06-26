const db = require("../database/db");
const Ticket = require('../models/ticket.model');
const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');

exports.search = (req, res) => {
    const term = req.params.term;
    
    if (!term || term === "all_events_list") {
        db.all("SELECT t.*, a.name as artist_name FROM tickets t JOIN artists a ON t.artist_id = a.id", [], (err, rows) => {
            if (err) 
                return res.status(500).json({ error: err.message });
            res.json(rows.map(row => new Ticket(row)));
        });
    } else {
        db.all(
            "SELECT t.*, a.name as artist_name FROM tickets t JOIN artists a ON t.artist_id = a.id WHERE t.event_name LIKE ? OR t.place LIKE ?",
            [`%${term}%`, `%${term}%`],
            (err, rows) => {
                if (err) 
                    return res.status(500).json({ error: err.message });
                res.json(rows.map(row => new Ticket(row)));
            }
        );
    }
};

exports.create = (req, res) => {
    const { id_artista, type, event_name, place, date, price } = req.body;

    db.run(
        `INSERT INTO tickets (artist_id, type, event_name, place, date, price) VALUES (?, ?, ?, ?, ?, ?)`,
        [id_artista, type, event_name, place, date, price],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const newTicketId = this.lastID;
            
            const createdTicket = new Ticket({ id: newTicketId, artist_id: id_artista, type, event_name, place, date, price });

            db.get('SELECT name FROM artists WHERE id = ?', [id_artista], (errArtist, artistRow) => {
                if (errArtist || !artistRow) {
                    console.error('Impossibile recuperare il nome artista per la notifica');
                    return res.json(createdTicket);
                }

                const artistName = artistRow.name;

                const queryTokens = `
                    SELECT u.push_token 
                    FROM likes l
                    JOIN users u ON l.user_id = u.id
                    WHERE l.artist_id = ? AND u.push_token IS NOT NULL
                `;

                db.all(queryTokens, [id_artista], (errLikes, rows) => {
                    if (errLikes) {
                        console.error('Errore nel recupero dei token dei fan:', errLikes);
                        return res.json(createdTicket);
                    }

                    const tokens = rows.map(row => row.push_token);

                    if (tokens.length === 0) {
                        console.log(`Nessun fan con dispositivo mobile registrato per l'artista ${artistName}`);
                        return res.json(createdTicket);
                    }

                    const message = {
                        notification: {
                            title: 'Nuovo Evento! 🎫',
                            body: `È appena stato aggiunto un nuovo evento per: ${artistName}!`
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

                    return res.json(createdTicket);
                });
            });
        }
    );
};

exports.update = (req, res) => {
    const { id } = req.params;
    
    const allowedFields = ['type', 'event_name', 'place', 'price', 'date'];
    const fields = Object.keys(req.body).filter(k => allowedFields.includes(k));
    
    if (fields.length === 0) return res.status(400).json({ message: 'Nessun campo modificato' });

    const setClause = fields.map(k => `${k} = ?`).join(', ');
    const values = fields.map(k => req.body[k]);

    db.run(`UPDATE tickets SET ${setClause} WHERE id = ?`, [...values, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Ticket modificato con successo' });
    });
};

exports.remove = (req, res) => {
    db.run(
        "DELETE FROM tickets WHERE id = ?",
        [req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ message: "Ticket non trovato" });
            res.json({ message: "Deleted" });
        }
    );
};