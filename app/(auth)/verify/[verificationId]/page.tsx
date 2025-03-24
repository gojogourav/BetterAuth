'use client'
import React from 'react'
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"


import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"
import { Button } from "@/components/ui/button"

import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'

const FormSchema = z.object({
    pin: z.string().min(6, {
        message: "Your one-time password must be 6 characters.",
    }),
})


function page({ params }: { params: { verificationId: string } }) {
    const router = useRouter()
    const verificationId = params.verificationId
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            pin: "",
        },
    })
    async function onSubmit(data: z.infer<typeof FormSchema>) {
        const response = await fetch(`/api/auth/verify/${verificationId}/`,{
            method:"POST",
            headers: { 'Content-Type': 'application/json' },
            body:JSON.stringify({otp:data.pin})
        })

        if(response.ok){
            router.push('/')
        }
    }

    return (
        <div className='h-screen justify-center w-full flex items-center'>
            <Form {...form}>

                <form onSubmit={form.handleSubmit(onSubmit)} className=" space-y-8">
                    <FormField
                        control={form.control}
                        name="pin"
                        render={({ field }) => (
                            <FormItem>
                                <div></div>
                                <FormLabel className='text-2xl mb-5'>One-Time Password</FormLabel>
                                {/* <FormLabel className='text-2xl mb-5'>{verificationId}</FormLabel> */}
                                <FormControl>
                                    <InputOTP maxLength={6} {...field}>
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                            <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className='bg-[#ff0050] w-full cursor-pointer'>Submit</Button>
                </form>
            </Form>

        </div>
    )
}

export default page