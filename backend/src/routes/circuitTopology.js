const express = require('express');
const router = express.Router();
const circuitEngine = require('../services/circuitTopologyEngine');

/**
 * GET /api/v3/circuit/status
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'ACTIVE',
    engine: 'Neural Circuit Topology & Pinout Interconnect Validator',
    version: '3.2.0-PROD',
    supportedComponents: Object.keys(circuitEngine.catalog).length,
    standardsCompliance: ['IEEE 1149.1', 'JEDEC JESD8C.01', 'I2C Bus Spec UM10204']
  });
});

/**
 * GET /api/v3/circuit/presets
 */
router.get('/presets', (req, res) => {
  try {
    const presets = circuitEngine.getPresetProjects();
    res.json({
      success: true,
      presets
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v3/circuit/validate
 */
router.post('/validate', (req, res) => {
  try {
    const { components = [] } = req.body || {};
    const validation = circuitEngine.validateTopology(components);
    res.json(validation);
  } catch (err) {
    console.error('Circuit topology validation error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
