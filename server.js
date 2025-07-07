// server.js
const dotenv = require('dotenv');
dotenv.config(); // ✅ This must come before anything that uses process.env

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const chatRoutes = require('./routes/chat');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', chatRoutes);
app.listen(5000, () => console.log('✅ Server running on http://localhost:5000'));
