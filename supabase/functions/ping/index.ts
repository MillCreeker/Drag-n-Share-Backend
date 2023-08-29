import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve((req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const timestamp = new Date().getTime();

    return new Response(timestamp.toString(), {
        headers: { ...corsHeaders, "Content-Type": "text" },
    });
});
