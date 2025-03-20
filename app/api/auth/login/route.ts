import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server"
import * as jose from 'jose'
import { RateLimiterRedis } from "rate-limiter-flexible";
import { NextApiResponse } from "next";
import * as crypto from 'crypto'
import { Resend } from "resend";
import { EmailTemplate } from "@/components/email-template";
import { redis } from "@/lib/redis";

import * as z from 'zod'


const prisma = new PrismaClient()

//TODO:this is the rate limiter reddis

const ratelimiter = new RateLimiterRedis({
    points: 5,
    duration: 60,
    blockDuration: 300,
    storeClient: redis
})

const resend = new Resend(process.env.RESEND_API_KEY);

const bodySchema = z.object({
        username: z.string()
            .min(3, "Username must be at least 3 characters")
            .max(20, "Username cannot exceed 20 characters"),
        password: z.string()
            .min(6, "Password must be at least 6 characters")
})


export async function POST(request: NextRequest) {
    const forwardedHeader = request.headers.get("x-forwarded-for") || "";
    const ip = forwardedHeader.split(',')[0] || "unknown";
    //this is how u get ip address

    try {
        await ratelimiter.consume(ip);
    } catch (error) {
        return NextResponse.json({ error: "Error too many requests" },{status:429})
    }

    try {
        const body = await request.json();
        const validation = bodySchema.safeParse(body)
        if(!validation.success) return NextResponse.json({error:"enter full details"})
        const {username,password} = validation.data

        const userCache = await redis.get(`user:${username}`)
        //redis chache check hoga
        let user = userCache ? JSON.parse(userCache) : null;

        if (!user) {
            user = await prisma.user.findFirst({
                where: {
                    username
                },
            })
        }



        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }else redis.setEx(`user:${username}`, 300, JSON.stringify(user))


        const lockedUntil = await redis.get(`lock:${user.id}`)
        if (Date.now() <= parseInt(lockedUntil!)) {
            return NextResponse.json(
                { error: "Account temporarily locked" },
                { status: 403 }
            );
        }


        const loginAttempts = await redis.lRange(`attempts:${user.id}`, 0, 9)
        const Suspecius = loginAttempts.every(attempt => JSON.parse(attempt).success === false)

        const passwordValid = await bcrypt.compare(password, user?.passwordHash)

        if (!passwordValid) {
            const loginAttempt = {
                userId: user?.id,
                ipAddress: ip,
                success: false,
                verifiedUser: false
            }

            await redis.lPush(`attempts:${user.id}`, JSON.stringify(loginAttempt))
            await redis.lTrim(`attempts:${user.id}`, 0, 9)
            const failedAttempts = await redis
            .multi()
            .incr(`failed_attempts:${user.id}`)
            .expire(`failed_attempts:${user.id}`, 3600, 'NX')
            .exec();

            if(!failedAttempts) 

            if (failedAttempts >= 5) {
                await redis.setEx(`lock:${user.id}`, 900,String( Date.now() + 900000));
                await redis.del(`failed_attempts:${user.id}`);
            }

            return NextResponse.json({ error: "Unauthorized Access" },{status:500})

        }

        if (Suspecius) {
            const otp = crypto.randomInt(100000, 999999).toString();
            const verificationId = crypto.randomUUID();

            const otpCount = await redis.keys(`otp:${verificationId}`);
            if(otpCount.length>=5){
                await redis.setEx(`lock:${user.id}`, 900,String( Date.now() + 900000));
            } 

            await redis.setEx( `otp:${verificationId}`,900,JSON.stringify({
                userId:user.id,
                otpHash:await bcrypt.hash(otp,12),
                ip:ip,
            }))


            const { data, error } = await resend.emails.send({
                from: 'Acme <onboarding@resend.dev>',
                to: [user?.email!],
                subject: 'Hello world',
                react: await EmailTemplate({ otp: otp.toString() }),
            });


            if (error) {
                return NextResponse.json({ error:"Error logging inn" },{status:500})
            }


            return NextResponse.json({ VerificationRequired: true, verificationId },{status:200})

        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const access_token = await new jose.SignJWT({
            userId: user.id,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime('15m')
            .sign(secret);



        const refresh_token =await new jose.SignJWT({userId:user.id})
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime('15m')
        .sign(secret);
        
        await redis.setEx(`session:${user.id}`, 604800, JSON.stringify({ // 7 days
            refresh_token,
            ipAddress: ip,
            lastAccessed: Date.now()
        }));

        const response = NextResponse.json({ susscess: true });
        response.cookies.set('access_token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60,
            sameSite: 'strict'
        })
        response.cookies.set('refresh_token', refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 24 * 60 * 60,
            sameSite: 'strict'
        })
        await redis.del(`failed_attempts:${user.id}`);
        await redis.del(`lock:${user.id}`);
        await redis.del(`user:${username}`); // Invalidate cache


        return response;

    } catch (error) {
        console.error("Error in server",error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}