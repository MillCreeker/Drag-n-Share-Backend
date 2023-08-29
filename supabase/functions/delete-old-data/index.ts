import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getErrorResponse, getSupabaseClient } from "../_shared/functions.ts";

const supabase = getSupabaseClient();

serve(async () => {
    try {
        const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();

        await supabase.from("data").delete().lt("timestamp", fiveMinAgo);

        return new Response("Done", {
            headers: { ...corsHeaders, "Content-Type": "text" },
        });
    } catch (_) {
        return getErrorResponse("An unexpected error occurred", 500);
    }
});
