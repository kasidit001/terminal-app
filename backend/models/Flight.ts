import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum FlightStatus {
  BOARDING = 'boarding',
  IN_FLIGHT = 'in-flight',
  LANDED = 'landed',
  CANCELLED = 'cancelled',
}

interface FlightAttributes {
  id: string;
  departureCode: string;
  arrivalCode: string;
  taskCategory: string;
  plannedDuration: number; // in minutes
  status: FlightStatus;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

interface FlightCreationAttributes extends Optional<FlightAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class Flight extends Model<FlightAttributes, FlightCreationAttributes> implements FlightAttributes {
  public id!: string;
  public departureCode!: string;
  public arrivalCode!: string;
  public taskCategory!: string;
  public plannedDuration!: number;
  public status!: FlightStatus;

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
    departureCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    arrivalCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    taskCategory: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    plannedDuration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(FlightStatus)),
      defaultValue: FlightStatus.BOARDING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'flights',
    timestamps: true,
  }
);

export default Flight;