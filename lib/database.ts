import { Client } from "pg";

const client = new Client({
    host: "125.220.153.28",
    port: 31340,
    user: "oge",
    password: "ypfamily608",
    database: "oge",
});

client.connect();

export { client };
