const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Configuración para que el servidor entienda datos que le enviemos y sirva el HTML
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// 1. Conexión y Creación automática de la Base de Datos SQLite
const db = new sqlite3.Database('./bd_ferreteria.db', (err) => {
    if (err) console.error("Error al conectar la BD:", err.message);
    else console.log("🔌 Conectado con éxito a la base de datos SQLite.");
});

// 2. Crear la tabla de productos si no existe y meter inventario inicial
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE,
        stock INTEGER
    )`);

    // Insertamos productos de ferretería e iluminación LED de ejemplo si la tabla está vacía
    const insertarInicial = db.prepare(`INSERT OR IGNORE INTO productos (nombre, stock) VALUES (?, ?)`);
    insertarInicial.run("Foco LED 12W", 50);
    insertarInicial.run("Cable Eléctrico 10m", 20);
    insertarInicial.run("Cinta Aislante", 15);
    insertarInicial.finalize();
});

// Ruta principal: Entrega la página web al escribir http://localhost:3000
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. RUTA DEL BACKEND: Procesar la venta del formulario
app.post('/api/vender', (req, res) => {
    const { producto, cantidad } = req.body;
    const cantidadVenta = parseInt(cantidad);

    // Buscamos el producto en la base de datos
    db.get(`SELECT * FROM productos WHERE nombre = ?`, [producto], (err, fila) => {
        if (err) {
            return res.status(500).json({ error: "Error en la base de datos." });
        }

        // Si el producto no existe en la ferretería
        if (!fila) {
            return res.json({ exito: false, mensaje: `❌ El producto "${producto}" no existe en el inventario.` });
        }

        // Si existe, pero no hay suficiente stock
        if (fila.stock < cantidadVenta) {
            return res.json({ exito: false, mensaje: `❌ Stock insuficiente. Solo quedan ${fila.stock} unidades de ${producto}.` });
        }

        // Si todo está bien, restamos el stock actual en la base de datos (Sentencia UPDATE)
        const nuevoStock = fila.stock - cantidadVenta;
        db.run(`UPDATE productos SET stock = ? WHERE id = ?`, [nuevoStock, fila.id], (err2) => {
            if (err2) {
                return res.status(500).json({ error: "No se pudo actualizar el inventario." });
            }
            
            // Enviamos la respuesta de éxito al frontend
            return res.json({ 
                exito: true, 
                mensaje: `✅ ¡Venta registrada! Se vendieron ${cantidadVenta} unidades de ${producto}. Quedan ${nuevoStock} en almacén.` 
            });
        });
    });
});

// Encendemos el servidor en el puerto 3000
app.listen(PORT, () => {
    console.log(`🚀 Servidor de la ferretería corriendo en: http://localhost:${PORT}`);
});
