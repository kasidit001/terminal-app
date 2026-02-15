import express from 'express';
import cors from 'cors';
import sequelize from './config/database';
import flightRoutes from './routes/flightRoutes';
import Flight from './models/Flight'; // Import to ensure model registration

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', flightRoutes);

// Sync database and start server
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync models - using force: false to avoid data loss
    await sequelize.sync({ force: false }); 
    console.log('Database synchronized.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();