import express, { Request, Response } from 'express';
import Flight, { FlightStatus } from '../models/Flight';

const router = express.Router();

// POST /api/flights - Start a new flight
router.post('/flights', async (req: Request, res: Response) => {
  try {
    const { flightNumber, origin, destination, taskCategory } = req.body;
    const flight = await Flight.create({
      flightNumber,
      origin,
      destination,
      status: FlightStatus.ACTIVE,
      departureTime: new Date(),
      taskCategory,
    });
    res.status(201).json(flight);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create flight' });
  }
});

// PATCH /api/flights/:id/land - Land a flight
router.patch('/flights/:id/land', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const flight = await Flight.findByPk(id);
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }
    await flight.update({
      status: FlightStatus.LANDED,
      arrivalTime: new Date(),
    });
    res.json(flight);
  } catch (error) {
    res.status(500).json({ error: 'Failed to land flight' });
  }
});

export default router;
