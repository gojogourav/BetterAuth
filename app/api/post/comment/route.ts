import { NextRequest, NextResponse } from "next/server";
import { CreateCommentInputType, db, getUserIdFromRequest } from "@/lib/utils";
import { handleApiError, NotFoundError } from "@/lib/api-utils";
import { CreateCommentSchema } from "@/lib/validators/comment";
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const validationResult = CreateCommentSchema.safeParse(body);
        if(!validationResult.success) throw new Error("failed to validate data");
        
        const userId = await getUserIdFromRequest(request);
        const   {parentId,comment}:CreateCommentInputType = validationResult.data;
        const newComment = await CreateComment(userId,parentId,comment)

        return NextResponse.json({ newComment }, { status: 200 })

    } catch (error:unknown) {
        return handleApiError(error)
    }
}


async function CreateComment(userId:string,parentId:string,content:string) {
    const parentReel = await db.uploadedReel.findUnique({
        where: {
            id: parentId
        },
        select:{id:true}
    })


    if(!parentReel){
        throw new NotFoundError("Parent reel")
    }

    try{
        const newComment = await db.comments.create({
            data:{
                content,
                user:{connect:{id:userId}},
                parentReel:{connect:{id:parentId}}
            },
            select:{
                id:true,
                content:true,
                createdAt:true,
                userId:true,
                parentReel:true
            }
        })

        return newComment;
    }catch(error){
        console.error("Database error creating comment:", error);
         handleApiError(error)
    }
}