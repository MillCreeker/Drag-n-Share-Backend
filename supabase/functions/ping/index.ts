import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(() => {
  const timestamp = new Date().getTime();

  return new Response(
    timestamp.toString(),
    { headers: { "Content-Type": "text" } },
  )
})