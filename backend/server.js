require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const admin = require('firebase-admin');
const firebaseServiceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!firebaseServiceAccountRaw) 
{
    console.error("ERRORE: La variabile FIREBASE_SERVICE_ACCOUNT non è definita nel file .env!");
    process.exit(1);
}

const serviceAccount = JSON.parse(firebaseServiceAccountRaw);

admin.initializeApp({
    credential: admin.cert(serviceAccount)
});

const db = require('./database/db');
const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: "Too Many Requests",
        message: "Hai inviato troppe richieste al server, riprova tra 15 minuti."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 3 * 60 * 1000,
    max: 15,
    message: {
        error: "Brute Force Protection",
        message: "Troppi tentativi di autenticazione da questo IP, accesso bloccato per 3 minuti."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        profileImage TEXT,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        phone TEXT NOT NULL,
        push_token TEXT
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        street TEXT NOT NULL,
        streetNumber INTEGER NOT NULL,
        city TEXT NOT NULL,
        provinceCode TEXT NOT NULL,
        zipcode TEXT NOT NULL,
        country TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS password_resets (
        email TEXT PRIMARY KEY,
        code_hash TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS artists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image TEXT,
        description TEXT,
        biography TEXT,
        awards TEXT,
        politica TEXT,
        genre TEXT,
        decade INTEGER,
        titleimg TEXT
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS radios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image TEXT,
        titleimg TEXT,
        description TEXT,
        hometown TEXT,
        decade INTEGER,
        biography TEXT,
        politica TEXT,
        awards TEXT
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS merchandising (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artist_id INTEGER,
        name TEXT NOT NULL,
        image TEXT,
        price REAL NOT NULL,
        description TEXT,
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artist_id INTEGER,
        type TEXT,
        event_name TEXT NOT NULL,
        place TEXT NOT NULL,
        date TEXT NOT NULL,
        price INTEGER NOT NULL,
        FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS likes (
        user_id INTEGER NOT NULL,
        artist_id INTEGER NOT NULL,
        PRIMARY KEY (user_id, artist_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        email TEXT NOT NULL,
        shipping_snapshot TEXT NOT NULL,
        total REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER,
        product_type TEXT,
        product_name TEXT NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS forum_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        date TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
`);

const authRoutes = require('./routes/auth.routes');
const userRoutes = require("./routes/user.routes")
const artistsRoutes = require("./routes/artists.routes");
const radiosRoutes = require("./routes/radios.routes");
const merchRoutes = require("./routes/merch.routes");
const ticketRoutes = require("./routes/tickets.routes");
const orderRoutes = require("./routes/orders.routes");
const forumRoutes = require("./routes/forum.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/auth', authLimiter);
app.use(generalLimiter);

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/artists", artistsRoutes);
app.use("/radios", radiosRoutes);
app.use("/merchandising", merchRoutes);
app.use("/tickets", ticketRoutes);
app.use("/orders", orderRoutes);
app.use("/forum", forumRoutes);

app.get('/', (req, res) => {
    res.send('Il server è attivo e funzionante!');
});

app.use((req, res, next) => {
    res.status(404).json({ 
        error: "Not Found",
        message: `L'endpoint [${req.method}] ${req.originalUrl} non esiste.` 
    });
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});