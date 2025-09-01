"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "../components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../components/ui/form"
import { PhoneNumberInput } from "./phoneInput"
import { Checkbox } from "./ui/checkbox"
import Link from "next/link"
import { appConfig } from "../config"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Calendar } from "./ui/calendar"
import { cn } from "../lib/utils"
import { format } from "date-fns"
import { IconRenderer } from "./iconRenderer/renderer"
import { completeOnboarding } from "../lib/actions/onboarding.actions"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useState } from "react"

const formSchema = z.object({
    mobile: z.string({
        message: "Please enter your mobile number"
    }).min(13).max(13),
    dateOfBirth: z.date({
        message: "We'd like to know your birthday"
    }),
    tosConfirmation: z.boolean().refine(val => val === true, {
        message: "You must agree to the terms and conditions"
    })
})

export const OnboardingForm = () => {    
    const [error, setError] = useState('')
    const { user } = useUser()
    const router = useRouter()

    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            mobile: "",
            dateOfBirth: undefined,
            tosConfirmation: false,
        },
    })

    // 2. Define a submit handler.
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        // Do something with the form values.
        const formData = new FormData()
        formData.append("mobile", values.mobile)
        formData.append("dateOfBirth", values.dateOfBirth.toISOString())
        formData.append("tosConfirmation", values.tosConfirmation ? "true" : "false")

        const res = await completeOnboarding(formData)

        if (res?.message) {
            // Reloads the user's data from the Clerk API
            await user?.reload()
            router.push('/')
        }
        if (res?.error) {
            setError(res?.error)
        }
    }

    const isSubmitting = form.formState.isSubmitting

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                                <PhoneNumberInput {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Date of birth</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full flex justify-between pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <IconRenderer name="cake" className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        captionLayout="dropdown"
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="tosConfirmation"
                    render={({ field }) => (
                        <div className="flex items-start gap-3">
                            <FormItem>
                                <FormControl>
                                    <div className="flex gap-2">
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            ref={field.ref}
                                            name={field.name}
                                            disabled={field.disabled}
                                        />
                                        <p className="text-muted-foreground text-xs">
                                            By clicking this checkbox, you agree to our <Link href={appConfig.webApp.tos} className="text-blue-500 underline">terms and conditions</Link>.
                                        </p>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </div>
                    )}
                />
                <div className="flex">
                    <Button type="submit" className="w-full">
                        Complete Onboarding
                        {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    </Button>
                </div>
            </form>
        </Form>
    )
}