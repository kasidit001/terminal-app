import express, { Request, Response } from 'express';
import Flight, { FlightStatus } from '../models/Flight';

const router = express.Router();

// GET /api/flights - List all flights
router.get('/flights', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = status;

    const flights = await Flight.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json(flights);
  } catch (error) {
    console.error('Error listing flights:', error);
    res.status(500).json({ error: 'Failed to list flights' });
  }
});

// GET /api/flights/:id - Get single flight
router.get('/flights/:id', async (req: Request, res: Response) => {
  try {
    const flight = await Flight.findByPk(req.params.id);
    if (!flight) return res.status(404).json({ error: 'Flight not found' });
    res.json(flight);
  } catch (error) {
    console.error('Error getting flight:', error);
    res.status(500).json({ error: 'Failed to get flight' });
  }
});

// POST /api/flights - Start a flight
router.post('/flights', async (req: Request, res: Response) => {
  try {
    const { departureCode, arrivalCode, taskCategory, plannedDuration, seatNumber, distance } = req.body;

    const flight = await Flight.create({
      departureCode,
      arrivalCode,
      taskCategory,
      plannedDuration: parseInt(plannedDuration),
      status: FlightStatus.IN_FLIGHT,
      seatNumber,
      distance: distance ? parseFloat(distance) : undefined,
      startedAt: new Date(),
    });

    res.status(201).json(flight);
  } catch (error) {
    console.error('Error creating flight:', error);
    res.status(500).json({ error: 'Failed to create flight' });
  }
});

// PATCH /api/flights/:id/land - Land a flight
router.patch('/flights/:id/land', async (req: Request, res: Response) => {
  try {
    const flight = await Flight.findByPk(req.params.id);
    if (!flight) return res.status(404).json({ error: 'Flight not found' });

    await flight.update({
      status: FlightStatus.LANDED,
      completedAt: new Date(),
    });

    res.json(flight);
  } catch (error) {
    console.error('Error landing flight:', error);
    res.status(500).json({ error: 'Failed to land flight' });
  }
});

// PATCH /api/flights/:id/cancel - Cancel a flight
router.patch('/flights/:id/cancel', async (req: Request, res: Response) => {
  try {
    const flight = await Flight.findByPk(req.params.id);
    if (!flight) return res.status(404).json({ error: 'Flight not found' });

    await flight.update({
      status: FlightStatus.CANCELLED,
      completedAt: new Date(),
    });

    res.json(flight);
  } catch (error) {
    console.error('Error cancelling flight:', error);
    res.status(500).json({ error: 'Failed to cancel flight' });
  }
});

export default router;
