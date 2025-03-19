import { NextRequest } from "next/server";
import {redis} from '@/lib/redis'

export async function POST(request:NextRequest,{params}:{params:Promise<{verificationId:string}>}) {
    try{
        const verificationId = await params;
        const {otp} = await request.json();
        
        const otpData = await redis.get(`otp:${verificationId}`)
    }catch(error){

    }
}