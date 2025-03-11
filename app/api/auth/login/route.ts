import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server"
import * as jose from 'jose'
import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextApiRequest, NextApiResponse } from "next";
import * as crypto from 'crypto'
import { Resend } from "resend";
import { EmailTemplate } from "@/components/email-template";


const prisma = new PrismaClient()
const ratelimiter = new RateLimiterMemory({
    points: 5,
    duration: 60,
    blockDuration: 300
})

const resend = new Resend(process.env.RESEND_API_KEY);


export async function POST(request: NextRequest, res: NextApiResponse) {
    const forwardedHeader = request.headers.get("x-forwarded-for") || "";
    const ip = forwardedHeader.split(',')[0] || "unknown";

    try {
        await ratelimiter.consume(ip);
    } catch (error) {
        return res.status(429).json({ error: "Error too many requests" })
    }

    try {

        const { username, password } = await request.json();
        const user = await prisma.user.findFirst({
            where: {
                username
            },
            include: {
                sessions: true,
                loginAttempt: true
            }
        })


        if (!user) {
            return res.status(404).json({ error: "Invalid credentials" })
        }
        const Suspecius = !user?.loginAttempt.some(attempt =>
            attempt.ipAddress === ip && attempt.success
        )
        const passwordValid = await bcrypt.compare(password, user?.passwordHash || "")

        if (!passwordValid) {
            await prisma.user.update({
                where: { id: user?.id },
                data: {
                    failedAttempts: { increment: 1 },
                    lockedUntil: user?.failedAttempts! >= 4 ? new Date(Date.now() + 15 * 60 * 1000) : null
                }
            })

            await prisma.loginAttempt.create({
                data: {
                    user: { connect: { id: user?.id } },
                    ipAddress: ip,
                    success: false,
                    verifiedUser: false
                }
            })

        }

        if (!Suspecius) {
            const newLoginAttempt = await prisma.loginAttempt.create({
                data: {
                    user: { connect: { id: user?.id } },
                    ipAddress: ip,
                    success: true,
                    verifiedUser: true
                }
            }
            )
            const date = new Date()

            const refreshToken = crypto.randomBytes(64).toString('hex');
            const refreshTokenHash = await bcrypt.hash(refreshToken, 12);


            const secret = new TextEncoder().encode(process.env.JWT_SECRET)
            const accessToken = await new jose.SignJWT({ userId: user?.id, role: "user" })
                .setProtectedHeader({ alg: 'HS256' })
                .setExpirationTime('15m')
                .sign(secret)


            const refreshTokenExpiry = date.setMonth(date.getMonth() + 1)
            const newSession = await prisma.session.create({
                data: {
                    user: { connect: { id: user?.id } },
                    ipAddress: ip,
                    refreshToken: refreshTokenHash,
                    refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    accessTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
                }
            })


            const response = NextResponse.json({ success: true });
            response.cookies.set('access_token', accessToken, {
                sameSite: 'strict',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 15
            });
            response.cookies.set('refresh_token', refreshToken, {
                sameSite: 'strict',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 15 * 60 * 60 * 24
            })

            return res.status(200).json({ success: true })

        } else {
            const otp = crypto.randomInt(100000, 999999).toString();
            const otpHashed = await bcrypt.hash(otp, 12)
            const verificationId = crypto.randomUUID();
            const loginattempt= await prisma.loginAttempt.create({
                data: {
                    user: { connect: { id: user?.id } },
                    ipAddress: ip,
                    success: false,
                    verifiedUser: false,
                    emailVerificationCode: otpHashed
                }
            })

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
            return res.status(200).json({ verificationLink: `${loginattempt.id}/${verificationId}/${otpHashed}` })


        }

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}