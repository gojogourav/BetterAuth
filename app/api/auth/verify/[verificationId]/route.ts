import { redis } from "@/lib/redis";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import * as jose from 'jose'
import * as crypto from 'crypto'
import { PrismaClient } from "@prisma/client";

if(!redis.isReady){
    await redis.connect();
}
const prisma = new PrismaClient()
export async function POST(request: NextRequest, { params }: { params: { verificationId: string } }) {
    try {
        const { verificationId } = await params;
        const { otp } = await request.json();


        const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

        const redisData = await redis.get(`otp:${verificationId}`)
        if(!redisData){
            return NextResponse.json({error:"Unauthorized access "},{status:401})
        }
        const data = JSON.parse(redisData)
        console.log('THIS IS REDIS DATAAAA BROOOOOOOOOOOOOOOOOOOOOO', redisData);

        //ab kya kru mental block hogya bc
        
        const isOtpCorrect = await bcrypt.compare(otp, data?.otpHash)
        console.log('kuch err 1');
        
        if (!isOtpCorrect) {
            console.log('kuch err 2');

            const failed_attempts = await redis
            .multi()
            .incr(`failed_attempts:${data.userId}`)
            .expire(`failed_attempts:${data.userid}`, 3600, 'NX')
            .exec();
          
            if(!failed_attempts) 

            if (failed_attempts[0] > 5) {
                await redis.setEx(`lock:${data.userId}`, 900, String(Date.now() + 900000));
            }
            return NextResponse.json({ error: "Error verification failed" }, { status: 401 })
        }

        await prisma.user.update({
            where:{id:data.userId},
            data:{
                emailVerified:true

            }
        })

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        if(!secret) console.log('secret hi available nhi h pancho');
        
        console.log('kuch err 3');
        console.log('THIS IS USERID ',data.userId);
        

        const access_token = await new jose.SignJWT({
            userId: data.userId
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime('15m')
            .sign(secret);
            console.log('kuch err 4');

        const refresh_token = await new jose.SignJWT({ userId: data.userId })
                    .setProtectedHeader({ alg: "HS256" })
                    .setExpirationTime('15d')
                    .sign(secret);
        
        console.log('kuch err 5');

        await redis.setEx(`session:${data.userId}`, 604800, JSON.stringify({ // 7 days
            refresh_token,
            ipAddress: ip,
            lastAccessed: Date.now()
        }));
        console.log('kuch err 6');
        const response = NextResponse.json({ susscess: true },{status:200});
        response.cookies.set('access_token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60,
            sameSite: 'strict'
        })
        console.log('kuch err 7');
        response.cookies.set('refresh_token', refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 24 * 60 * 60,
            sameSite: 'strict'
        })
        console.log('kuch err 8');
        await redis.del(`failed_attempts:${data.userId}`);
        await redis.del(`lock:${data.userId}`);
        // await redis.del(`user:${username}`); // Invalidate cache

        return response;



    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "internal server error" }, { status: 500 })
    }
}