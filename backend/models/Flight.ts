import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum FlightStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  LANDED = 'LANDED',
  CANCELLED = 'CANCELLED',
}

interface FlightAttributes {
  id: string;
  flightNumber: string;
  origin: string;
  destination: string;
  status: FlightStatus;
  departureTime?: Date;
  arrivalTime?: Date;
  taskCategory?: string; // Mentioned in UI phase
}

interface FlightCreationAttributes extends Optional<FlightAttributes, 'id' | 'status' | 'departureTime' | 'arrivalTime'> {}

class Flight extends Model<FlightAttributes, FlightCreationAttributes> implements FlightAttributes {
  public id!: string;
  public flightNumber!: string;
  public origin!: string;
  public destination!: string;
  public status!: FlightStatus;
  public departureTime?: Date;
  public arrivalTime?: Date;
  public taskCategory?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Flight.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    flightNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    origin: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    destination: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(FlightStatus)),
      defaultValue: FlightStatus.SCHEDULED,
      allowNull: false,
    },
    departureTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    arrivalTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    taskCategory: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'flights',
  }
);

export default Flight;
