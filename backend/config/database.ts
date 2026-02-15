import { Sequelize } from 'sequelize';
import path from 'path';

let sequelize: Sequelize;

// Use SQLite by default for development simplicity, but prefer Postgres if configured
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
} else {
  // Fallback to SQLite
  console.log('No DATABASE_URL found, falling back to SQLite for local development.');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: false,
  });
}

export default sequelize;