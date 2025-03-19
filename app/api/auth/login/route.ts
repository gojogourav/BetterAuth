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




const prisma = new PrismaClient()

//TODO:this is the rate limiter reddis

const ratelimiter = new RateLimiterRedis({
    points: 5,
    duration: 60,
    blockDuration: 300,
    storeClient: redis
})

const resend = new Resend(process.env.RESEND_API_KEY);


export async function POST(request: NextRequest, res: NextApiResponse) {
    const forwardedHeader = request.headers.get("x-forwarded-for") || "";
    const ip = forwardedHeader.split(',')[0] || "unknown";
    //this is how u get ip address

    try {
        await ratelimiter.consume(ip);
    } catch (error) {
        return res.status(429).json({ error: "Error too many requests" })
    }

    try {
        const { username, password } = await request.json();

        const userCache = await redis.get(`user:${username}`)
        //redis chache check hoga
        let user = userCache ? JSON.parse(userCache) : null;

        if (!user) {
            user = await prisma.user.findFirst({
                where: {
                    username
                },
                include: {
                    loginAttempt: {
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    }
                }
            })
        }


        if (user) {
            return redis.setEx(`user:${username}`, 300, JSON.stringify(user))
        }

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }

        const lockedUntil = await redis.get(`lock:${user.id}`)
        if (Date.now() <= parseInt(lockedUntil!.toString())) {
            return NextResponse.json(
                { error: "Account temporarily locked" },
                { status: 403 }
            );
        }


        const loginAttempts = await redis.lRange(`attempts:${user.id}`, 0, 9)
        const Suspecius = loginAttempts.every(attempt => JSON.parse(attempt).success === false)

        const passwordValid = await bcrypt.compare(password, user?.passwordHash)

        if (!passwordValid) {
            await prisma.user.update({
                where: { id: user?.id },
                data: {
                    failedAttempts: { increment: 1 },
                    lockedUntil: user?.failedAttempts! >= 4 ? new Date(Date.now() + 15 * 60 * 1000) : null
                }
            })

            const loginAttempt = {
                userId: user?.id,
                ipAddress: ip,
                success: false,
                verifiedUser: false
            }

            await redis.lPush(`attempts:${user.id}`, JSON.stringify(loginAttempt))
            await redis.lTrim(`attempts:${user.id}`, 0, 9)
            const failedAttempts = await redis.incr(`failed_attempts:${user.id}`);


            if (failedAttempts >= 5) {
                await redis.setEx(`lock:${user.id}`, 900,String( Date.now() + 900000));
                await redis.del(`failed_attempts:${user.id}`);
            }

            return res.status(500).json({ error: "Unauthorized Access" })

        }

        if (Suspecius) {
            const otp = crypto.randomInt(100000, 999999).toString();
            const verificationId = crypto.randomUUID();

            await redis.setEx(`otp:${verificationId}`, 900, JSON.stringify({
                userId: user.id,
                otpHash: await bcrypt.hash(otp, 12),
                ipAddress: ip
            }));


            //idhar email verification code send hoyego
            // github work ni krrra

            const { data, error } = await resend.emails.send({
                from: 'Acme <onboarding@resend.dev>',
                to: [user?.email!],
                subject: 'Hello world',
                react: await EmailTemplate({ otp: otp.toString() }),
            });

            if (error) {
                return res.status(500).json({ error })
            }


            return res.status(200).json({ VerificationRequired: true, verificationId })

        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const access_token = await new jose.SignJWT({
            userId: user.id,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime('15m')
            .sign(secret);



        const refresh_token = crypto.randomBytes(64).toString('hex')
        const refresh_token_hash = await bcrypt.hash(refresh_token, 12)

        await redis.setEx(`session:${user.id}`, 604800, JSON.stringify({ // 7 days
            refresh_token_hash,
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
        response.cookies.set('refresh_token', access_token, {
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
        console.error(error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}