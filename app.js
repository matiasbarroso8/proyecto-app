const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const app = express();

const uri = "mongodb+srv://matiasbarroso85:PFUaMG0SEFSqeXRh@cluster0.bwczxvy.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

app.use(express.json());
app.use(express.static('public'));

let usuariosCollection;

async function run() {
  try {
    await client.connect();
    console.log("Conectado a MongoDB");

    const db = client.db("alquileres");
    usuariosCollection = db.collection("usuarios");

    app.listen(3000, () => {
      console.log('Servidor escuchando en http://localhost:3000');
    });
  } catch (e) {
    console.error(e);
  }
}
run().catch(console.dir);

// Ruta para registrar usuarios
app.post('/registro', async (req, res) => {
  try {
    const { nombre, email, password, tipo } = req.body;

    if (!nombre || !email || !password || !tipo) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
    }

    const existe = await usuariosCollection.findOne({ email });
    if (existe) {
      return res.status(400).json({ mensaje: 'El email ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await usuariosCollection.insertOne({ nombre, email, password: hashedPassword, tipo });

    res.status(200).json({ mensaje: 'Usuario registrado con éxito.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// Ruta para login de usuarios
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Email y contraseña requeridos.' });
  }

  try {
    const usuario = await usuariosCollection.findOne({ email });

    if (!usuario) {
      return res.status(401).json({ mensaje: 'Usuario no encontrado.' });
    }

    const esValida = await bcrypt.compare(password, usuario.password);

    if (!esValida) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta.' });
    }

    res.json({ mensaje: 'Login exitoso', usuario: { nombre: usuario.nombre, tipo: usuario.tipo } });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Error en el servidor.' });
  }
});
