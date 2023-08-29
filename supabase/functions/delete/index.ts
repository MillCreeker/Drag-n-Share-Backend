import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getErrorResponse, getSupabaseClient } from "../_shared/functions.ts";

const supabase = getSupabaseClient();

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const ownerId = req.headers.get("access");

        if (ownerId == null || ownerId == "") {
            return getErrorResponse("No ownerId received", 400);
        }

        // get data
        const { data: resp } = await supabase
            .from("access")
            .select("data ( id )")
            .eq("token", ownerId);

        if (resp == null || resp.length == 0) {
            return getErrorResponse("No data found for ownerId", 401);
        }
        const respObj = JSON.parse(JSON.stringify(resp[0]));

        // delete
        await supabase.from("data").delete().eq("id", respObj.data.id);

        return new Response("Successfully deleted", {
            headers: { ...corsHeaders, "Content-Type": "text" },
        });
    } catch (_) {
        return getErrorResponse("An unexpected error occurred", 500);
    }
});
