const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const port = 3000;

const uri = "mongodb+srv://matiasbarroso85:PFUaMG0SEFSqeXRh@cluster0.bwczxvy.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/registrar', async (req, res) => {
  try {
    await client.connect();
    const db = client.db("miBaseDeDatos");
    const usuarios = db.collection("usuarios");

    const nuevoUsuario = req.body;

    const resultado = await usuarios.insertOne(nuevoUsuario);
    res.json({ mensaje: "Usuario registrado con ID: " + resultado.insertedId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al registrar usuario" });
  } finally {
    await client.close();
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
