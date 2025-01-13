"use client";

import React from "react";
import { signInWithCredentials } from "@/features/auth/auth";
import AuthForm from "@/features/auth/Form";
import { signInSchema } from "@/features/auth/validations";

const Page = () => (
  <AuthForm
    type="SIGN_IN"
    schema={signInSchema}
    defaultValues={{
      email: "",
      password: "",
    }}
    onSubmit={signInWithCredentials}
  />
);

export default Page;