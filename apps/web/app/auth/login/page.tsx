"use client"
import {toast} from "sonner";
import {loginApiV1AuthLoginPost} from '@repo/api-client'
import {useActionState} from 'react'
import {Input} from "@/components/ui/input";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";

const formAction = async (prevState: unknown, formData: FormData) => {

    console.log(prevState)
    const email = formData.get('email') as string
    const password = formData.get('password') as string


    const response = await loginApiV1AuthLoginPost({
        body: {
            email,
            password
        }
    })

    if (response.error?.detail) {
        toast.error(response.error.detail.toString())
    }

    const data = response.data

    return data
}

export default function LoginPage() {
    const [state, action] = useActionState(formAction, null)

    return (
        <div className={'h-screen w-full flex items-center justify-center'}>
            <Card>
                <CardHeader>
                    <CardTitle className={'text-center text-xl'}>Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={action} className={'max-w-lg space-y-2'}>
                        <Input placeholder={'Email or username'} name={'email'} className={'h-10'}/>
                        <Input placeholder={'Password'} name={'password'} className={'h-10'}/>
                        <Button className={'w-full h-10'} type={'submit'}>
                            Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )

}