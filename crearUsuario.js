const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://matiasbarroso85:PFUaMG0SEFSqeXRh@cluster0.bwczxvy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function crearUsuario() {
  try {
    await client.connect();
    const db = client.db("miBaseDeDatos");
    const usuarios = db.collection("usuarios");

    const nuevoUsuario = {
      tipo: "dueño", // o "inquilino"
      nombre: "Juan Pérez",
      email: "juan@example.com",
      password: "123456"
    };

    const resultado = await usuarios.insertOne(nuevoUsuario);
    console.log("Usuario insertado con ID:", resultado.insertedId);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

crearUsuario();
