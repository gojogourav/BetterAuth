import { NextRequest, NextResponse } from "next/server";
import * as jose from 'jose'
export default async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname
    console.log('This is pathname in middlewares ', path);

    const isProtectedRoute = path.startsWith('/auth') || path.startsWith('/api/auth')
    if (isProtectedRoute) return NextResponse.next()

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET)


        const access_token = request.cookies.get('access_token')?.value
        const access_token_data = await jose.jwtVerify(access_token!, secret)


        const refresh_token = request.cookies.get('refresh_token')?.value
        const refresh_token_data = await jose.jwtVerify(refresh_token!, secret)
        if (!access_token) {
            if (refresh_token) {
                const new_access_token = new jose.SignJWT({ userId: access_token_data.payload.userId })
                    .setProtectedHeader({ alg: "HS256" })
                    .setExpirationTime('15m')
                    .sign(secret);


                const response = NextResponse.next()
                if (!new_access_token)
                    response.cookies.set('access_token', new_access_token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        maxAge: 15 * 60,
                        sameSite: 'strict'
                    })
                return response;

            }
            throw new Error('Error no token provided')
        }
        const response = NextResponse.next();
        return response;


    } catch (error) {
        console.log(error);

    }

}

