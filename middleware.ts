import { NextRequest, NextResponse } from "next/server";
import * as jose from 'jose'
export default async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname
    // console.log('This is pathname in middlewares ', path);
    const nonProtectedRoutes = ['/login', '/api/auth', '/register','/_next','.','/img','/api/auth/verify','/verify'];

    if(nonProtectedRoutes.some(route=>path.startsWith(route))) return NextResponse.next()

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET)


        const access_token = request.cookies.get('access_token')?.value
        console.log('error kidhar hai 1');
        const refresh_token = request.cookies.get('refresh_token')?.value
        console.log('error kidhar hai 2');
        
        if(access_token){
            await jose.jwtVerify(access_token!, secret,{ algorithms: ['HS256']})
            console.log('error kidhar hai 3');
            
        }
        else if(refresh_token){
            console.log('error kidhar hai 4');
            console.log(refresh_token);
            
            const {payload}= await jose.jwtVerify(refresh_token!, secret,{ algorithms: ['HS256']})
            console.log('error kidhar hai 5');
            const new_access_token =await new jose.SignJWT({ userId: payload.userId })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime('15m')
            .sign(secret);
            console.log('error kidhar hai 6');

            const response = NextResponse.next()
            response.cookies.set('access_token', new_access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 15 * 60,
                sameSite: 'strict'
            });

            return response;


        }

        return NextResponse.next()

    } catch (error) {
        console.log(error);
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('access_token');
        response.cookies.delete('refresh_token');
        return response;

    }

}

