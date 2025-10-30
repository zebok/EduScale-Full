const express = require('express');
const router = express.Router();
const redisToEnrollmentWorker = require('../workers/redisToEnrollmentWorker');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * GET /api/worker/stats
 * Get worker statistics (admin only)
 */
router.get('/stats', authMiddleware, (req, res) => {
  // Only super_admin can access
  if (req.user.rol !== 'super_admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const stats = redisToEnrollmentWorker.getStats();

  res.json({
    worker: 'Redis → Cassandra Migration',
    stats: {
      ...stats,
      lastRunTimeFormatted: stats.lastRunTime
        ? new Date(stats.lastRunTime).toLocaleString('es-AR')
        : 'Never',
      lastRunDurationFormatted: `${(stats.lastRunDuration / 1000).toFixed(2)}s`,
      nextRunEstimate: stats.lastRunTime
        ? new Date(stats.lastRunTime.getTime() + stats.intervalMinutes * 60 * 1000).toLocaleString('es-AR')
        : 'Unknown'
    }
  });
});

/**
 * POST /api/worker/trigger
 * Manually trigger worker (admin only)
 */
router.post('/trigger', authMiddleware, async (req, res) => {
  // Only super_admin can trigger
  if (req.user.rol !== 'super_admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  try {
    // Trigger async (don't wait for completion)
    redisToEnrollmentWorker.triggerManually();

    res.json({
      message: 'Worker triggered successfully',
      note: 'Check logs for processing details'
    });
  } catch (error) {
    console.error('Error triggering worker:', error);
    res.status(500).json({ error: 'Error al ejecutar el worker' });
  }
});

module.exports = router;
