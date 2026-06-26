const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/database.db', (err) => {
    if (err) {
        console.error("Errore durante l'apertura del DB:", err.message);
    } else {
        db.run("PRAGMA foreign_keys = ON;", (pragmaErr) => {
            if (pragmaErr) {
                console.error("Errore nell'attivazione delle Foreign Keys:", pragmaErr.message);
            }
        });
    }
});

module.exports = db;