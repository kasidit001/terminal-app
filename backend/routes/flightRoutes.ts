import express, { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import Flight, { FlightStatus } from '../models/Flight.js';

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

// GET /api/flights/recent - Last 20 completed flights for logbook
router.get('/flights/recent', async (req: Request, res: Response) => {
  try {
    const flights = await Flight.findAll({
      where: {
        status: { [Op.in]: [FlightStatus.LANDED, FlightStatus.CANCELLED] },
      },
      order: [['completedAt', 'DESC']],
      limit: 20,
    });
    res.json(flights);
  } catch (error) {
    console.error('Error fetching recent flights:', error);
    res.status(500).json({ error: 'Failed to fetch recent flights' });
  }
});

// GET /api/stats - Aggregated focus statistics from DB
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalFlights = await Flight.count({
      where: { status: FlightStatus.LANDED },
    });

    const totalMinutesResult = await Flight.findOne({
      attributes: [[fn('SUM', col('plannedDuration')), 'totalMinutes']],
      where: { status: FlightStatus.LANDED },
      raw: true,
    }) as any;

    const totalMinutes = Math.round(Number(totalMinutesResult?.totalMinutes) || 0);

    // Activity breakdown
    const activityBreakdown = await Flight.findAll({
      attributes: [
        'focusActivity',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('plannedDuration')), 'totalMinutes'],
      ],
      where: { status: FlightStatus.LANDED },
      group: ['focusActivity'],
      raw: true,
    }) as any[];

    // Most flown route
    const topRoute = await Flight.findOne({
      attributes: [
        'departureCode',
        'arrivalCode',
        [fn('COUNT', col('id')), 'count'],
      ],
      where: { status: FlightStatus.LANDED },
      group: ['departureCode', 'arrivalCode'],
      order: [[literal('count'), 'DESC']],
      raw: true,
    }) as any;

    // Total distance
    const distanceResult = await Flight.findOne({
      attributes: [[fn('SUM', col('distance')), 'totalDistance']],
      where: { status: FlightStatus.LANDED },
      raw: true,
    }) as any;

    res.json({
      totalFlights,
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60),
      totalDistance: Math.round(Number(distanceResult?.totalDistance) || 0),
      activityBreakdown: activityBreakdown.map((a: any) => ({
        activity: a.focusActivity || 'Focus',
        count: Number(a.count),
        totalMinutes: Math.round(Number(a.totalMinutes)),
      })),
      topRoute: topRoute ? {
        route: `${topRoute.departureCode} → ${topRoute.arrivalCode}`,
        count: Number(topRoute.count),
      } : null,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
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
    const { departureCode, arrivalCode, taskCategory, plannedDuration, seatNumber, distance, focusActivity } = req.body;

    const flight = await Flight.create({
      departureCode,
      arrivalCode,
      taskCategory,
      plannedDuration: parseInt(plannedDuration),
      status: FlightStatus.IN_FLIGHT,
      seatNumber,
      distance: distance ? parseFloat(distance) : undefined,
      focusActivity: focusActivity || undefined,
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
