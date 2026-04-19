const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes will be added here
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/cars', require('./routes/carRoutes'));
app.use('/api/rentals', require('./routes/rentalRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => console.log(`Server started on port ${PORT}`));
