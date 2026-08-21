const express = require("express");
const authService = require("../services/authService");
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const token = await authService.register(req.body);
    res.status(201).json({ token });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await authService.login(email, password);
    res.json({ token });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

module.exports = router;
