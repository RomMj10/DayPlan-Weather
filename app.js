const express = require('express');
const weatherRoutes = require('./routes/weather.routes');
const app = express();

app.use(express.json());

app.use('/v1/weather', weatherRoutes);


module.exports = app;