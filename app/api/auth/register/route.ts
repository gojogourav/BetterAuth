import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import * as z from 'zod'

const userSchema = z.object({
    username: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username cannot exceed 20 characters"),
    email: z.string().email("Invalid email address"),
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name cannot exceed 50 characters")
        .optional(),
    password: z.string()
        .min(6, "Password must be at least 6 characters")
})

const prisma = new PrismaClient()
export async function POST(request: NextRequest) {
    try {
        const body= await request.json();
        
        const validation = userSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.format() },
                { status: 400 }
            );
        }

        const { username, email, name, password } = validation.data;

        const user = await prisma.user.findFirst({
            where: { OR: [{username}, {email}] }
        })
        if (user) return NextResponse.json({ error: "please use unique email & username " }, { status: 401 })

        const passwordHash = await bcrypt.hash(password, 12)

        await prisma.user.create({
            data: {
                username,
                email,
                name,
                passwordHash,
                emailVerified: false
            }
        })

        return NextResponse.json({ message: "Please continue to login :)" }, { status: 200 })

    } catch (error) {
        console.log('Error registering the user ', error);
        NextResponse.json({ error: "Error registering the user" }, { status: 500 })
    }
}