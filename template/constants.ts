const config = {
  app: {
    domain: '0.0.0.0',
    port: 3021,
    kind: 'developement',
    backlog: 511,
    debug: process.env.debug,
  },
  jwt: { secret: '1q@w3e4r5t6y', expires: '24h' },
  db_system: {
    host: process.env.BD_HOST,
    port: process.env.BD_PORT,
    user: process.env.BD_USER,
    password: process.env.BD_PASS,
    database: process.env.BD_NAME,
  },
  db_tenant: {
    host: process.env.BD_TENANT_HOST,
    port: process.env.BD_TENANT_PORT,
    user: process.env.BD_TENANT_USER,
    password: process.env.BD_TENANT_PASS,
    database: process.env.BD_TENANT_NAME,
  },
  utils: { cloudinary: '' },
};

export default config;
