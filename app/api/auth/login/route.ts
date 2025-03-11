import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server"
import * as jose from 'jose'
import { RateLimiterMemory } from "rate-limiter-flexible";

const prisma = new PrismaClient()
const ratelimiter = new RateLimiterMemory{
    
}

export async function POST(request:NextRequest){
    try{
        const {username,password} = await request.json();
        const user = await prisma.user.findFirst({
            where:{
                username
            }
        })

        const passwordValid = await bcrypt.compare(password,user?.passwordHash||"")
        
        if (!passwordValid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 403 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET)
        const token = await new jose.SignJWT({})

    }catch(error){
        console.error(error);
        throw new Error("error")
    }
}