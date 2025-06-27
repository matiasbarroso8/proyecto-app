const express = require('express');
const { ObjectId } = require('mongodb');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const app = express();

const uri = "mongodb+srv://matiasbarroso85:PFUaMG0SEFSqeXRh@cluster0.bwczxvy.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

app.use(express.json());

// ✅ Esto sirve archivos como index.html, publicar.html, etc.
app.use(express.static('public'));

// ✅ Esto permite acceder a las imágenes por URL como /imagenes/archivo.jpg
app.use('/imagenes', express.static('public/imagenes'));

// Configurar almacenamiento de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/imagenes/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

let usuariosCollection;
let propiedadesCollection;
let favoritosCollection;

async function run() {
  try {
    await client.connect();
    console.log("Conectado a MongoDB");

    const db = client.db("alquileres");
    usuariosCollection = db.collection("usuarios");
    propiedadesCollection = db.collection("propiedades");
    favoritosCollection = db.collection("favoritos");

    app.listen(3000, () => {
      console.log('Servidor escuchando en http://localhost:3000');
    });
  } catch (e) {
    console.error(e);
  }
}
run().catch(console.dir);

// ---------------------- REGISTRO ----------------------
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

// ---------------------- LOGIN ----------------------
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

    res.json({
      mensaje: 'Login exitoso',
      usuario: {
        nombre: usuario.nombre,
        email: usuario.email,
        tipo: usuario.tipo
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Error en el servidor.' });
  }
});

// ---------------------- PUBLICAR PROPIEDAD (DUEÑO) ----------------------
app.post('/publicar', upload.single('imagen'), async (req, res) => {
  const { titulo, descripcion, direccion, precio, emailDueno } = req.body;
  const imagen = req.file ? `/imagenes/${req.file.filename}` : '';

  if (!titulo || !descripcion || !direccion || !precio || !emailDueno) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
  }

  try {
    await propiedadesCollection.insertOne({
      titulo,
      descripcion,
      direccion,
      precio: parseFloat(precio),
      emailDueno,
      imagen
    });
    res.status(200).json({ mensaje: 'Propiedad publicada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al publicar propiedad.' });
  }
});

// ---------------------- VER TODAS LAS PROPIEDADES ----------------------
app.get('/propiedades', async (req, res) => {
  try {
    const propiedades = await propiedadesCollection.find().toArray();
    res.json(propiedades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener propiedades.' });
  }
});

// ---------------------- VER PROPIEDADES DEL DUEÑO ----------------------
app.get('/mis-propiedades/:email', async (req, res) => {
  const email = req.params.email;

  try {
    const propiedades = await propiedadesCollection.find({ emailDueno: email }).toArray();
    res.json(propiedades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener propiedades del dueño.' });
  }
});

// ---------------------- ELIMINAR PROPIEDAD ----------------------
app.delete('/eliminar-propiedad/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const resultado = await propiedadesCollection.deleteOne({ _id: new ObjectId(id) });

    if (resultado.deletedCount === 1) {
      res.json({ mensaje: 'Propiedad eliminada correctamente.' });
    } else {
      res.status(404).json({ mensaje: 'Propiedad no encontrada.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar propiedad.' });
  }
});
