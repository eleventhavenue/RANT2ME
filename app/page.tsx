// app/page.tsx
import { auth } from "@/app/auth"
import ClientComponent from "@/components/ClientComponent"
import { fetchAccessToken } from "hume"
import { redirect } from "next/navigation"

export default async function Page() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  let accessToken: string | null = null
  let error: string | null = null

  try {
    accessToken = await fetchAccessToken({
      apiKey: process.env.HUME_API_KEY!,
      secretKey: process.env.HUME_SECRET_KEY!,
    })

    if (!accessToken) {
      throw new Error("Access token is null")
    }
  } catch (e) {
    console.error("Error fetching access token:", e)
    error = e instanceof Error ? e.message : "An unknown error occurred"
  }

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-8">
        <div className="max-w-md mx-auto mt-8 p-6 bg-white/80 backdrop-blur shadow-lg rounded-2xl border border-red-200">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">Failed to fetch access token: {error}</p>
          <p className="mt-2 text-red-600">Please check your environment variables and try again.</p>
        </div>
      </div>
    )
  }

  return <ClientComponent accessToken={accessToken} />
}