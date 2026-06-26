const db = require('../database/db');
const transporter = require('../config/mail');
const Order = require('../models/order.model');
const OrderItem = require('../models/orderItem.model');

exports.createOrder = (req, res) => {
  const { shipping, products, total } = req.body;

  if (!products || products.length === 0) {
    return res.status(400).json({ error: 'Nessun prodotto selezionato' });
  }

  const requestedQuantities = {};
  products.forEach(item => {
    if (!item.type || item.type === 'merch' || item.type === 'merchandising') {
      const qta = item.quantity || 1;
      requestedQuantities[item.id] = (requestedQuantities[item.id] || 0) + qta;
    }
  });

  const uniqueProductIds = Object.keys(requestedQuantities);
  
  const stockChecks = uniqueProductIds.map(productId => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT name, stock FROM merchandising WHERE id = ?`, [productId], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve();
        
        const totalRequested = requestedQuantities[productId];
        
        if (row.stock !== null && row.stock < totalRequested) {
          return reject({
            type: "OUT_OF_STOCK",
            product: { name: row.name, stock: row.stock }
          });
        }
        resolve();
      });
    });
  });

  Promise.all(stockChecks)
    .then(() => {
      const formattedAddress = `${shipping.via}, ${shipping.civico} - ${shipping.cap} ${shipping.citta} (${shipping.provincia}), ${shipping.paese}`;
      const shippingSnapshot = `${shipping.nome} ${shipping.cognome} | Tel: ${shipping.telefono} | Addr: ${formattedAddress}`;

      db.run(`INSERT INTO orders (user_id, email, shipping_snapshot, total) VALUES (?, ?, ?, ?)`, 
        [shipping.userId || null, shipping.email, shippingSnapshot, total], async function (err) {
          if (err) 
            return res.status(500).json({ error: 'Errore nel salvataggio dell\'ordine' });

          const orderId = this.lastID;
          let completedItems = 0;
          let hasError = false;
          let productsListHtml = '';

          products.forEach((item) => {
            productsListHtml += `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.price.toFixed(2)} €</td></tr>`;

            db.run(`INSERT INTO order_items (order_id, product_id, product_type, product_name, price) VALUES (?, ?, ?, ?, ?)`, 
              [orderId, item.id || null, item.type || 'merch', item.name, item.price], (itemErr) => {
                if (itemErr) {
                  hasError = true;
                  completedItems++;
                  if (completedItems === products.length) {
                    return res.status(500).json({ error: 'Errore salvataggio dettagli' });
                  }
                } else {
                  const quantityRequested = item.quantity || 1;
                  db.run(`UPDATE merchandising SET stock = stock - ? WHERE id = ?`, [quantityRequested, item.id], () => {
                    completedItems++;
                    if (completedItems === products.length) {
                      if (hasError) return res.status(500).json({ error: 'Errore salvataggio dettagli' });

                      transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: shipping.email,
                        subject: `Conferma Ordine #${orderId}`,
                        html: `
                        <div style="font-family: sans-serif; padding: 20px; line-height: 1.5;">
                            <h2>Grazie per il tuo ordine, ${shipping.nome}!</h2>
                            <p><strong>Ordine #${orderId}</strong></p>
                            
                            <table style="width: 100%; margin-bottom: 20px;">
                                ${productsListHtml}
                            </table>
                            
                            <h3>Totale: ${total.toFixed(2)} €</h3>
                            
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
                            
                            <h4 style="margin-bottom: 5px;">Indirizzo di Spedizione:</h4>
                            <p style="margin: 0;">
                                ${shipping.nome} ${shipping.cognome}<br>
                                ${shipping.via}, ${shipping.civico}<br>
                                ${shipping.cap} - ${shipping.citta} (${shipping.provincia})<br>
                                ${shipping.paese}<br>
                                Tel: ${shipping.telefono}
                            </p>
                        </div>
                        `
                    }, (mailErr) => {
                        res.status(200).json({ message: 'Ordine salvato', orderId });
                    });
                    }
                  });
                }
            });
          });
      });
    })
    .catch(err => {
      if (err.type === "OUT_OF_STOCK") {
        return res.status(400).json({
          error: "Out of Stock",
          outOfStockItem: {
            name: err.product.name,
            stock: err.product.stock
          }
        });
      }
      return res.status(500).json({ error: err.message });
    });
};

exports.getUserOrders = (req, res) => {
  if (!req.user?.id) return res.status(401).json({ error: 'Utente non autenticato' });

  db.all("SELECT id, total, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC", [req.user.id], (err, orders) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!orders.length) return res.status(200).json([]);

    const placeholders = orders.map(() => '?').join(',');
    db.all(`SELECT order_id, product_name, price FROM order_items WHERE order_id IN (${placeholders})`, orders.map(o => o.id), (err, items) => {
      if (err) return res.status(500).json({ error: err.message });

      const result = orders.map(order => new Order({
        ...order,
        products: items.filter(i => i.order_id === order.id)
      }));

      res.status(200).json(result);
    });
  });
};