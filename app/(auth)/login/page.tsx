"use client"
import image from '@/public/image.png'

import React from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Image from 'next/image'

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'




function Login() {
    const router = useRouter()
    const formSchema = z.object({
        username: z.string().min(2).max(50),
        password: z.string().min(4).max(20)
    })
    
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: ""
        },
    })
    
    
    async function onSubmit(values: z.infer<typeof formSchema>) {
        const response = await fetch('/api/auth/login',{
            method:'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({username:values.username,password:values.password})
        })
        
        const data = await response.json();
        console.log('Data is this ',data.VerificationRequired);
        
        
        if(data.VerificationRequired){
            router.push(`/verify/${data.verificationId}`)
        }
        else if(data.susscess){
            router.push('/')
        }else{
            console.error('Failed to authenticate')
        }
    }
    
    return (
        <div className=' p-5 border  items-center flex justify-center h-screen w-full'>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 border-black border-2\">
           <Image className='select-none justify-self-center flex content-center' src={image} height={100} width={100} alt='icon'/>
            <h1 className='text-3xl font-semibold font-sans'>Login in to Reels</h1>
                    <FormField
                    
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem className='text-xl'>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input placeholder="username" {...field} />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input placeholder="password" {...field} />
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

export default Login