const express = require('express');
const router = express.Router();
const { cassandraClient } = require('../config/cassandra');
const cassandra = require('cassandra-driver');

// POST: Registrar inscripción (Fase C - Inmutable)
router.post('/', async (req, res) => {
  try {
    const { institucion, email, nombre, apellido, programa } = req.body;

    if (!institucion || !email || !nombre || !apellido || !programa) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const query = `
      INSERT INTO inscripciones (
        institucion,
        email,
        id_inscripcion,
        nombre,
        apellido,
        programa,
        fecha_inscripcion
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const idInscripcion = cassandra.types.Uuid.random();
    const fechaInscripcion = new Date();

    const params = [
      institucion,
      email,
      idInscripcion,
      nombre,
      apellido,
      programa,
      fechaInscripcion
    ];

    await cassandraClient.execute(query, params, { prepare: true });

    res.status(201).json({
      message: 'Inscripción registrada correctamente (inmutable)',
      inscripcion: {
        institucion,
        email,
        id_inscripcion: idInscripcion.toString(),
        nombre,
        apellido,
        programa,
        fecha_inscripcion: fechaInscripcion.toISOString()
      }
    });
  } catch (error) {
    console.error('Error en enrollment POST:', error);
    res.status(500).json({ error: 'Error al registrar la inscripción' });
  }
});

// GET: Obtener inscripciones por institución
router.get('/institucion/:institucion', async (req, res) => {
  try {
    const { institucion } = req.params;

    const query = `
      SELECT * FROM inscripciones
      WHERE institucion = ?
    `;

    const result = await cassandraClient.execute(query, [institucion], { prepare: true });

    const inscripciones = result.rows.map(row => ({
      institucion: row.institucion,
      email: row.email,
      id_inscripcion: row.id_inscripcion.toString(),
      nombre: row.nombre,
      apellido: row.apellido,
      programa: row.programa,
      fecha_inscripcion: row.fecha_inscripcion.toISOString()
    }));

    res.json({
      institucion,
      total: inscripciones.length,
      inscripciones
    });
  } catch (error) {
    console.error('Error en enrollment GET by institucion:', error);
    res.status(500).json({ error: 'Error al obtener inscripciones' });
  }
});

// GET: Obtener todas las inscripciones (limitado)
router.get('/', async (req, res) => {
  try {
    // Nota: En Cassandra, hacer SELECT * sin WHERE puede ser costoso
    // Este endpoint es solo para demostración
    const query = `SELECT * FROM inscripciones LIMIT 100`;

    const result = await cassandraClient.execute(query);

    const inscripciones = result.rows.map(row => ({
      institucion: row.institucion,
      email: row.email,
      id_inscripcion: row.id_inscripcion.toString(),
      nombre: row.nombre,
      apellido: row.apellido,
      programa: row.programa,
      fecha_inscripcion: row.fecha_inscripcion.toISOString()
    }));

    res.json({
      total: inscripciones.length,
      inscripciones,
      nota: 'Limitado a 100 registros'
    });
  } catch (error) {
    console.error('Error en enrollment GET:', error);
    res.status(500).json({ error: 'Error al obtener inscripciones' });
  }
});

// GET: Obtener inscripciones por email dentro de una institución
router.get('/institucion/:institucion/email/:email', async (req, res) => {
  try {
    const { institucion, email } = req.params;

    const query = `
      SELECT * FROM inscripciones
      WHERE institucion = ? AND email = ?
    `;

    const result = await cassandraClient.execute(query, [institucion, email], { prepare: true });

    const inscripciones = result.rows.map(row => ({
      institucion: row.institucion,
      email: row.email,
      id_inscripcion: row.id_inscripcion.toString(),
      nombre: row.nombre,
      apellido: row.apellido,
      programa: row.programa,
      fecha_inscripcion: row.fecha_inscripcion.toISOString()
    }));

    res.json({
      total: inscripciones.length,
      inscripciones
    });
  } catch (error) {
    console.error('Error en enrollment GET by institucion and email:', error);
    res.status(500).json({ error: 'Error al obtener inscripciones' });
  }
});

module.exports = router;
