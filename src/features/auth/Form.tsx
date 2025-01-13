'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DefaultValues,
    FieldValues,
    Path,
    SubmitHandler,
    useForm,
    UseFormReturn,
} from "react-hook-form";
import { ZodType } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { FIELD_NAMES, FIELD_TYPES } from './contants';

interface Props<T extends FieldValues> {
    schema: ZodType<T>;
    defaultValues: T;
    onSubmit: (data: T) => Promise<{ success: boolean; error?: string }>;
    type: "SIGN_IN" | "SIGN_UP";
}

const AuthForm = <T extends FieldValues>({
    type,
    schema,
    defaultValues,
    onSubmit,
}: Props<T>) => {
    const router = useRouter();
    const isSignIn = type === "SIGN_IN";
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form: UseFormReturn<T> = useForm({
        resolver: zodResolver(schema),
        defaultValues: defaultValues as DefaultValues<T>,
    });
    
    const handleSubmit: SubmitHandler<T> = async (data) => {
        setIsSubmitting(true);
        try {
            const result = await onSubmit(data);
        
            if (result.success) {
                toast({
                    title: "Success",
                    description: isSignIn
                        ? "You have successfully signed in."
                        : "You have successfully signed up.",
                });
        
                router.push("/");
            } else {
                toast({
                    title: `Error ${isSignIn ? "signing in" : "signing up"}`,
                    description: result.error ?? "An error occurred.",
                    variant: "destructive",
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="border-none shadow-none">
            <CardHeader className="space-y-4">
                <CardTitle className="text-2xl font-bold">
                    {isSignIn ? "Welcome back to BookWise" : "Create your library account"}
                </CardTitle>
                <CardDescription>
                    {isSignIn
                        ? "Access the vast collection of resources, and stay updated"
                        : "Please complete all fields to gain access to the library"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isSignIn ? 'signin' : 'signup'}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(handleSubmit)}
                                className="space-y-6"
                            >
                                {Object.keys(defaultValues).map((field) => (
                                    <FormField
                                        key={field}
                                        control={form.control}
                                        name={field as Path<T>}
                                        render={({ field: formField }) => (
                                            <FormItem>
                                                <FormLabel className="capitalize">
                                                    {FIELD_NAMES[formField.name as keyof typeof FIELD_NAMES]}
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            required
                                                            type={
                                                                formField.name === 'password'
                                                                    ? (showPassword ? 'text' : 'password')
                                                                    : FIELD_TYPES[formField.name as keyof typeof FIELD_TYPES]
                                                            }
                                                            {...formField}
                                                            className="h-12"
                                                        />
                                                        {formField.name === 'password' && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="absolute right-0 top-0 h-12 w-12"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                            >
                                                                {showPassword ? (
                                                                    <EyeOffIcon className="h-4 w-4" />
                                                                ) : (
                                                                    <EyeIcon className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}

                                <Button 
                                    type="submit" 
                                    className="w-full h-12"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting 
                                        ? (isSignIn ? "Signing in..." : "Signing up...") 
                                        : (isSignIn ? "Sign In" : "Sign Up")}
                                </Button>

                                <p className="text-center text-sm">
                                    {isSignIn ? "New to BookWise? " : "Already have an account? "}
                                    <Link
                                        href={isSignIn ? "/sign-up" : "/sign-in"}
                                        className="font-bold text-primary hover:underline"
                                    >
                                        {isSignIn ? "Create an account" : "Sign in"}
                                    </Link>
                                </p>
                            </form>
                        </Form>
                    </motion.div>
                </AnimatePresence>
            </CardContent>
        </Card>
    );
};

export default AuthForm;