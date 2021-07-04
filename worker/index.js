const redis = require("redis");
const keys = require("./keys");

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const redisClient = redis.createClient({
  host: keys.REDIS_HOST,
  port: keys.REDIS_PORT,
  retry_strategy: () => 1000,
});
const redisPublisher = redisClient.duplicate();

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

redisPublisher.on("message", async (channel, message) => {
  console.log("Value: "+message);
  await sleep(5000);
  const calculatedFib = fib(parseInt(message));
  console.log("Fib: "+calculatedFib);
  redisClient.hset("values", message, calculatedFib);
});

redisPublisher.subscribe("insert");
