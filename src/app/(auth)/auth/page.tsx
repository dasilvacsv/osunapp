import AuthForm from "@/features/auth/AuthForm";



export default function AuthPage({ searchParams }: { searchParams: { message?: string } }) {
  return <AuthForm searchParams={searchParams} />
}

