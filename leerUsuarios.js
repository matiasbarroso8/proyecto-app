const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://matiasbarroso85:PFUaMG0SEFSqeXRh@cluster0.bwczxvy.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function leerUsuarios() {
  try {
    await client.connect();
    const db = client.db("miBaseDeDatos");
    const usuarios = db.collection("usuarios");

    const lista = await usuarios.find({}).toArray();
    console.log("Usuarios encontrados:", lista);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

leerUsuarios();
