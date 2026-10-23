const express = require('express');
const cors = require('cors');
const cloudRoutes = require('./routes/cloudRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api', cloudRoutes);

app.get('/', (req, res) => {
    res.json({ status: 'SmartCloud Optimizer Backend Running' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});