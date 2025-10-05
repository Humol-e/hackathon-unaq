require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = 3000;
app.use(express.static(__dirname));
app.get('/asteroids', async (req, res) => {
    const page = req.query.page || 0;
    const apiKey = process.env.API_KEY;
    const url = `https://api.nasa.gov/neo/rest/v1/neo/browse?page=${page}&api_key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({error: 'Error al obtener datos'});
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});