const { Pool } = require("pg");
const redis = require("redis");
const keys = require("./keys");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const pgClient = new Pool({
  host: keys.PGHOST,
  port: keys.PGPORT,
  user: keys.PGUSER,
  password: keys.PGPASSWORD,
  database: keys.PGDATABASE,
});

pgClient.on("error", (err) => {
  console.log(err.message);
});

pgClient.query("CREATE TABLE IF NOT EXISTS values(number INT)").catch((err) => console.log(err));

const redisClient = redis.createClient({
  host: keys.REDIS_HOST,
  port: keys.REDIS_PORT,
  retry_strategy: () => 1000,
});
const redisPublisher = redisClient.duplicate();

app.get("/values/all",async (req,res) => {
    const result = await pgClient.query("SELECT * FROM values");
    res.send(result.rows);
})

app.get("/values/current", (req, res) => {
  redisClient.hgetall("values", (err,values) => {
    res.send(values);
  });
});

app.post('/values', async (req, res) => {
    const index = req.body.index;
  
    if (parseInt(index) > 40) {
      return res.status(422).send('Index too high');
    }
  
    redisClient.hset('values', index, 'Nothing yet!');
    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
  
    res.send({ working: true });
});

app.listen(5000, () => console.log("Server running..."))
