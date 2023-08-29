import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const supabase = createClient(
    Deno.env.get("_SUPABASE_URL")!,
    Deno.env.get("_SUPABASE_SERVICE_KEY")!,
    { auth: { persistSession: false } }
);

function getErrorResponse(message: string, code: number) {
    return new Response(message, {
        headers: { "Content-Type": "text" },
        status: code,
    });
}

serve(async (_) => {
    try {
        const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();

        await supabase.from("data").delete().lt("timestamp", fiveMinAgo);

        return new Response("Done", {
            headers: { "Content-Type": "text" },
        });
    } catch (_) {
        return getErrorResponse("An unexpected error occurred", 500);
    }
});
