const ForumPost = require('../models/forumPost.model'); 
const path = require('path');
const db = require('../database/db');

exports.getPostsByDecade = (req, res) => {
    try {
      const category = req.params.category;
      if (!category) {
        return res.status(400).json({ message: 'Categoria mancante' });
      }

      const query = `
        SELECT forum_posts.*, users.username, users.profileImage 
        FROM forum_posts 
        LEFT JOIN users ON forum_posts.user_id = users.id 
        WHERE forum_posts.category = ? 
        ORDER BY datetime(forum_posts.date) DESC
      `;
      
      db.all(query, [category], (err, rows) => {
        if (err) {
          return res.status(500).json({ message: 'Errore nel recupero dei post', error: err.message });
        }
        const posts = (rows || []).map(row => new ForumPost(row));
        return res.json(posts);
      });
    } catch (err) {
      return res.status(500).json({ message: 'Errore interno del controller', error: err.message });
    }
};

exports.createPost = (req, res) => {
    try {
      const { category, text } = req.body;
      
      const user_id = req.user?.id;
      const username = req.user?.username;

      if (!user_id) {
        return res.status(401).json({ message: 'Impossibile identificare l\'utente dal token' });
      }

      if (!category || !text || !text.trim()) {
        return res.status(400).json({ message: 'Testo o categoria mancanti' });
      }

      const currentDate = new Date().toISOString();
      const cleanText = text.trim();

      const query = `INSERT INTO forum_posts (category, user_id, text, date) VALUES (?, ?, ?, ?)`;
      const params = [category, user_id, cleanText, currentDate];

      db.run(query, params, function(err) {
        if (err) {
          console.error("Errore SQLite durante INSERT:", err.message);
          return res.status(500).json({ message: 'Errore nel salvataggio del post', error: err.message });
        }

        const post_id = this.lastID;

        const newPost = new ForumPost({
          id: post_id,
          category: category,
          user_id: user_id,
          username: username,
          text: cleanText,
          date: currentDate
        });

        return res.status(201).json(newPost);
      });

    } 
    catch (globalError) {
      return res.status(500).json({ message: 'Errore di runtime nel server', error: globalError.message });
    }
};

exports.deletePost = (req, res) => {
    try {
      const postId = req.params.id;

      if (!postId) {
        return res.status(400).json({ message: 'ID del post mancante' });
      }

      const query = `DELETE FROM forum_posts WHERE id = ?`;

      db.run(query, [postId], function(err) {
        if (err) {
          console.error("Errore SQLite durante DELETE:", err.message);
          return res.status(500).json({ message: 'Errore nell\'eliminazione del post', error: err.message });
        }

        if (this && this.changes === 0) {
          return res.status(404).json({ message: 'Post non trovato o già eliminato' });
        }

        return res.json({ message: 'Post eliminato con successo' });
      });

    } catch (globalError) {
      console.error("Crash nel Controller Delete:", globalError.message);
      return res.status(500).json({ message: 'Errore di runtime nel server', error: globalError.message });
    }
};