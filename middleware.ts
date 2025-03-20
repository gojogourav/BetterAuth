import { NextRequest, NextResponse } from "next/server";
import * as jose from 'jose'
import { redis } from "./lib/redis";
export async function middleware(request:NextRequest) {
    const path = request.nextUrl.pathname

    const isProtectedRoute = path.startsWith('/auth') || path.startsWith('/api/auth')
    if (!isProtectedRoute) return NextResponse.next()
    
    try{
            const access_token = request.cookies.get('access_token')?.value
            if(!access_token) throw new Error('no access token')
            
                const secret = new TextEncoder().encode(process.env.JWT_SECRET)
                const {payload} = await jose.jwtVerify(access_token,secret)
                const sessionKey = `session:${payload.userId}`;
                const sessionData = await redis.get(sessionKey);
                
                if (!sessionData) {
                    throw new Error('Session expired');
                }
        
        
                const refresh_token = request.cookies.get('refresh_token')?.value
                if(!refresh_token) throw new Error('Error authentication failed')
                const refresh_token_data = await jose.jwtVerify(refresh_token,secret)

                if(refresh_token&&!access_token){
                    const new_access_token = new jose.SignJWT({userId:refresh_token_data.payload.userId})
                    const response = NextResponse.next()
                    response.cookies.set('access_token', access_token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        maxAge: 15 * 60,
                        sameSite: 'strict'
                    })
                }
                

}catch(error){  

}

}