import { db } from "@/lib/utils";
import { v2 as cloudinary } from 'cloudinary'
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})


interface cloudinaryResult {
    public_id: string;
    bytes: number;
    duration?: number;
}

export async function POST(request: NextRequest) {
    try {

        const secret = new TextEncoder().encode(process.env.JWT_SECRET)

        const access_token = request.cookies.get('access_token')?.value
        if (!access_token) throw new Error("unauthorized access")
        const { payload } = await jwtVerify(access_token, secret)

        const userId = payload.userId
        if (!userId) throw new Error('userId not provided')

        try {
            const formData = await request.formData();
            const file = formData.get('file') as File | null;
            const title = formData.get('title') as string
            const description = formData.get('description') as string | null
            const orignalSize = formData.get('size') as string;

            if (!file) throw new Error('error file not provided')

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const currentTime = new Date();
            

            const result = await new Promise<cloudinaryResult>((resolve,reject)=>{
                    const upload_stream = cloudinary.uploader.upload_stream(
                    {
                        resource_type:'video',
                        transformation:[
                            {quality:"auto",fetch_format:"mp4"}
                        ],
                        folder:`mp4_${userId}/reel/${currentTime}_${title}`
                    },
                    (error:string,result:cloudinaryResult)=>{
                        if (error) reject(error);
                        else resolve(result as cloudinaryResult)
                    }
                )
                upload_stream.end(buffer)
                }
            )
        } catch (error) {

        }
    }
    catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 400 })
    }

}