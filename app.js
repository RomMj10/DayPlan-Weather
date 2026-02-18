const express = require('express');
const cors = require('cors');
const path = require('path');
const weatherRoutes = require('./routes/weather.routes');
const activityRoutes = require('./routes/activity.routes');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/v1/weather', weatherRoutes);
app.use('/v1/activities', activityRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;