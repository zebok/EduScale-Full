const express = require('express');
const router = express.Router();
const { neo4jDriver } = require('../config/neo4j');

// POST: Crear relación entre estudiante, institución y programa
router.post('/', async (req, res) => {
  const session = neo4jDriver.session();

  try {
    const { email_estudiante, institucion, programa } = req.body;

    if (!email_estudiante || !institucion || !programa) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Crear nodos y relaciones en una sola transacción
    const query = `
      MERGE (e:Estudiante {email: $email})
      MERGE (i:Institucion {nombre: $institucion})
      MERGE (p:Programa {nombre: $programa})
      MERGE (e)-[r1:POSTULA_A]->(i)
      MERGE (e)-[r2:INSCRITO_EN]->(p)
      MERGE (p)-[r3:PERTENECE_A]->(i)
      SET r1.fecha = datetime(),
          r2.fecha = datetime()
      RETURN e, i, p
    `;

    const result = await session.run(query, {
      email: email_estudiante,
      institucion: institucion,
      programa: programa
    });

    res.status(201).json({
      message: 'Relación creada correctamente',
      relacion: {
        estudiante: email_estudiante,
        institucion: institucion,
        programa: programa
      }
    });
  } catch (error) {
    console.error('Error en relations POST:', error);
    res.status(500).json({ error: 'Error al crear la relación' });
  } finally {
    await session.close();
  }
});

// GET: Obtener relaciones de un estudiante
router.get('/:email', async (req, res) => {
  const session = neo4jDriver.session();

  try {
    const { email } = req.params;

    const query = `
      MATCH (e:Estudiante {email: $email})-[:POSTULA_A]->(i:Institucion)
      MATCH (e)-[:INSCRITO_EN]->(p:Programa)-[:PERTENECE_A]->(i)
      RETURN e.email as estudiante, i.nombre as institucion, p.nombre as programa
    `;

    const result = await session.run(query, { email });

    const relaciones = result.records.map(record => ({
      estudiante: record.get('estudiante'),
      institucion: record.get('institucion'),
      programa: record.get('programa')
    }));

    res.json({
      total: relaciones.length,
      relaciones
    });
  } catch (error) {
    console.error('Error en relations GET:', error);
    res.status(500).json({ error: 'Error al obtener relaciones' });
  } finally {
    await session.close();
  }
});

// GET: Obtener todos los estudiantes de una institución
router.get('/institucion/:nombre', async (req, res) => {
  const session = neo4jDriver.session();

  try {
    const { nombre } = req.params;

    const query = `
      MATCH (e:Estudiante)-[:POSTULA_A]->(i:Institucion {nombre: $nombre})
      RETURN e.email as estudiante
    `;

    const result = await session.run(query, { nombre });

    const estudiantes = result.records.map(record => ({
      email: record.get('estudiante')
    }));

    res.json({
      institucion: nombre,
      total: estudiantes.length,
      estudiantes
    });
  } catch (error) {
    console.error('Error en relations GET institucion:', error);
    res.status(500).json({ error: 'Error al obtener estudiantes de la institución' });
  } finally {
    await session.close();
  }
});

// GET: Obtener programas más populares
router.get('/stats/programas-populares', async (req, res) => {
  const session = neo4jDriver.session();

  try {
    const query = `
      MATCH (e:Estudiante)-[:INSCRITO_EN]->(p:Programa)
      RETURN p.nombre as programa, count(e) as cantidad
      ORDER BY cantidad DESC
      LIMIT 10
    `;

    const result = await session.run(query);

    const programas = result.records.map(record => ({
      programa: record.get('programa'),
      cantidad: record.get('cantidad').toNumber()
    }));

    res.json({
      programas_populares: programas
    });
  } catch (error) {
    console.error('Error en relations GET stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  } finally {
    await session.close();
  }
});

// GET: Obtener todas las instituciones
router.get('/stats/instituciones', async (req, res) => {
  const session = neo4jDriver.session();

  try {
    const query = `
      MATCH (i:Institucion)
      OPTIONAL MATCH (e:Estudiante)-[:POSTULA_A]->(i)
      RETURN i.nombre as institucion, count(e) as estudiantes
      ORDER BY estudiantes DESC
    `;

    const result = await session.run(query);

    const instituciones = result.records.map(record => ({
      institucion: record.get('institucion'),
      estudiantes: record.get('estudiantes').toNumber()
    }));

    res.json({
      total: instituciones.length,
      instituciones
    });
  } catch (error) {
    console.error('Error en relations GET instituciones:', error);
    res.status(500).json({ error: 'Error al obtener instituciones' });
  } finally {
    await session.close();
  }
});

module.exports = router;
