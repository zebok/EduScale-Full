const express = require('express');
const router = express.Router();
const { Expediente } = require('../config/mongodb');

// POST: Crear expediente de admisión (Fase B)
router.post('/', async (req, res) => {
  try {
    const { email, documentos, comentarios, estado } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El email es requerido' });
    }

    // Verificar si ya existe un expediente para este email
    const existingExpediente = await Expediente.findOne({ email });

    if (existingExpediente) {
      return res.status(409).json({
        error: 'Ya existe un expediente para este email',
        expediente: existingExpediente
      });
    }

    // Crear nuevo expediente
    const nuevoExpediente = new Expediente({
      email,
      documentos: documentos || '',
      comentarios: comentarios || '',
      estado: estado || 'pendiente',
      historial: [{
        accion: 'Creación de expediente',
        fecha: new Date(),
        usuario: 'Sistema',
        detalles: 'Expediente creado inicialmente'
      }]
    });

    await nuevoExpediente.save();

    res.status(201).json({
      message: 'Expediente creado correctamente',
      expediente: nuevoExpediente
    });
  } catch (error) {
    console.error('Error en admission POST:', error);
    res.status(500).json({ error: 'Error al crear el expediente' });
  }
});

// GET: Obtener todos los expedientes
router.get('/', async (req, res) => {
  try {
    const expedientes = await Expediente.find().sort({ 'metadata.fechaCreacion': -1 });

    res.json({
      total: expedientes.length,
      expedientes
    });
  } catch (error) {
    console.error('Error en admission GET:', error);
    res.status(500).json({ error: 'Error al obtener expedientes' });
  }
});

// GET: Obtener expediente por email
router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const expediente = await Expediente.findOne({ email });

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    res.json({ expediente });
  } catch (error) {
    console.error('Error en admission GET by email:', error);
    res.status(500).json({ error: 'Error al obtener el expediente' });
  }
});

// PUT: Actualizar expediente
router.put('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { documentos, comentarios, estado } = req.body;

    const expediente = await Expediente.findOne({ email });

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    // Actualizar campos
    if (documentos !== undefined) expediente.documentos = documentos;
    if (comentarios !== undefined) expediente.comentarios = comentarios;
    if (estado !== undefined) expediente.estado = estado;

    expediente.metadata.ultimaActualizacion = new Date();

    // Agregar al historial
    expediente.historial.push({
      accion: 'Actualización de expediente',
      fecha: new Date(),
      usuario: 'Sistema',
      detalles: `Estado: ${estado || expediente.estado}`
    });

    await expediente.save();

    res.json({
      message: 'Expediente actualizado correctamente',
      expediente
    });
  } catch (error) {
    console.error('Error en admission PUT:', error);
    res.status(500).json({ error: 'Error al actualizar el expediente' });
  }
});

// DELETE: Eliminar expediente
router.delete('/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const expediente = await Expediente.findOneAndDelete({ email });

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    res.json({
      message: 'Expediente eliminado correctamente',
      expediente
    });
  } catch (error) {
    console.error('Error en admission DELETE:', error);
    res.status(500).json({ error: 'Error al eliminar el expediente' });
  }
});

module.exports = router;
