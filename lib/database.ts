import { Client } from "pg";

const client = new Client({
    host: "120.48.44.57",
    port: 3306,
    user: "oge",
    password: "ypfamily608",
    database: "oge",
});

client.connect();

export { client };
