import { Pool } from "pg";

const pool = new Pool({
    host: "120.48.44.57",
    port: 3306,
    user: "oge",
    password: "ypfamily608",
    database: "oge",
    max: 20,
    idleTimeoutMillis: 0,
});

process.on('exit', () => {
    console.log("[Server]: exit application");
    pool.end();
})

export { pool };
