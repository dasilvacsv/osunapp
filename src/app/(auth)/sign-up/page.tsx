"use client";

import { signUp } from "@/features/auth/auth";
import AuthForm from "@/features/auth/Form";
import { signUpSchema } from "@/features/auth/validations";




const Page = () => (
  <AuthForm
    type="SIGN_UP"
    schema={signUpSchema}
    defaultValues={{
      email: "",
      password: "",
      fullName: "",
    }}
    onSubmit={signUp}
  />
);

export default Page;