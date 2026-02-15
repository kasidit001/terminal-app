import express, { Request, Response } from 'express';
import Flight, { FlightStatus } from '../models/Flight';

const router = express.Router();

// POST /api/flights - Start a flight (boarding/active)
router.post('/flights', async (req: Request, res: Response) => {
  try {
    const { departureCode, arrivalCode, taskCategory, plannedDuration } = req.body;
    
    // Create new flight
    const flight = await Flight.create({
      departureCode,
      arrivalCode,
      taskCategory,
      plannedDuration: parseInt(plannedDuration),
      status: FlightStatus.IN_FLIGHT, // Start in-flight or allow manual start? Plan says "Start a session"
    });
    
    res.status(201).json(flight);
  } catch (error) {
    console.error('Error creating flight:', error);
    res.status(500).json({ error: 'Failed to create flight' });
  }
});

// PATCH /api/flights/:id/land - End a flight
router.patch('/flights/:id/land', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const flight = await Flight.findByPk(id);
    
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }
    
    await flight.update({
      status: FlightStatus.LANDED
    });
    
    res.json(flight);
  } catch (error) {
    console.error('Error landing flight:', error);
    res.status(500).json({ error: 'Failed to land flight' });
  }
});

export default router;