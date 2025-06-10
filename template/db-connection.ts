import mysql from 'mysql2';
import * as dotenv from 'dotenv';

dotenv.config();

export default class DBConnection {
  private db;

  constructor() {
    this.db = mysql.createPool({
      connectionLimit: 200, // Aumentado o limite de conexões
      host: process.env.DB_HOST || '0.0.0.0',
      user: process.env.DB_USER || 'csa',
      password: process.env.DB_PASS || 'password',
      database: process.env.DB_DATABASE || 'test',
    });
  }

  checkConnection() {
    this.db.getConnection((err, connection) => {
      if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
          console.error('Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
          console.error('Database has too many connections.');
          // Adicionar lógica de retentativa para o erro "Too many connections"
          setTimeout(() => {
            this.checkConnection(); // Tentar estabelecer a conexão novamente após um curto período
          }, 5000); // Aguardar 5 segundos antes de tentar novamente
        }
        if (err.code === 'ECONNREFUSED') {
          console.error('Database connection was refused.');
        }
      }
      if (connection) {
        connection.release();
      }
    });
  }

  async query(sql: string, values: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const callback = (
        error: mysql.QueryError | null,
        result:
          | mysql.RowDataPacket[][]
          | mysql.RowDataPacket[]
          | mysql.OkPacket
          | mysql.OkPacket[]
          | mysql.ResultSetHeader,
      ) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      };

      // execute will internally call prepare and query
      this.db.execute(sql, values, callback);
    })
    .catch(err => {
      const mysqlErrorList = Object.keys(HttpStatusCodes);
      // convert mysql errors which in the mysqlErrorList list to http status code
      err.status = mysqlErrorList.includes(err.code) ? HttpStatusCodes[err.code] : err.status;

      throw err;
    })
    .finally(() => {
      // Liberar a conexão após a execução da consulta
      this.db.getConnection((err, connection) => {
        if (connection) {
          connection.release();
        }
      });
    });
  }
}

// like ENUM
const HttpStatusCodes: any = Object.freeze({
  ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: 422,
  ER_DUP_ENTRY: 409,
});