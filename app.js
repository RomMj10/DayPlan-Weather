const express = require('express');
const weatherRoutes = require('./routes/weather.routes');
const activityRoutes = require('./routes/activity.routes');
const app = express();

app.use(express.json());

app.use('/v1/weather', weatherRoutes);
app.use('/v1/activities', activityRoutes);


module.exports = app;