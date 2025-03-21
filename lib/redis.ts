import { createClient } from "redis";

export const redis = createClient()

redis.on('error', (err) => console.error('Redis Client Error', err));
const connectRedis = async ()=>{
    await redis.connect();
}

connectRedis;