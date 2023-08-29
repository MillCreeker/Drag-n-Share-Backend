import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getErrorResponse, getSupabaseClient } from "../_shared/functions.ts";

const supabase = getSupabaseClient();

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        let name: string;

        try {
            const request = await req.json();
            name = request.name;
        } catch (_) {
            return getErrorResponse("Invalid body", 400);
        }

        if (typeof name == "undefined" || name == null || name == "") {
            return getErrorResponse("No name received", 400);
        }

        // check name exists
        const resp = await supabase
            .from("data")
            .select("id, name, timestamp")
            .eq("name", name);

        if (resp == null || resp.data == null || resp.data.length == 0) {
            return getErrorResponse("Name not found", 404);
        }

        const respObj = resp.data[0];

        // check if is expired
        const now = new Date().valueOf();
        const timestamp = new Date(respObj.timestamp).valueOf();
        if (now - timestamp > 300000) {
            await supabase.from("data").delete().eq("id", respObj.id);
            return getErrorResponse("Data has expired", 410);
        }

        // check if data is locked
        const { data: lockEntry } = await supabase
            .from("lock-entries")
            .select("data-id")
            .eq("data-id", respObj.id);

        if (lockEntry != null && lockEntry.length != 0) {
            return getErrorResponse(
                "Data is currently locked. Refresh on other device.",
                403
            );
        }

        return new Response("Name found", {
            headers: { ...corsHeaders, "Content-Type": "text" },
        });
    } catch (_) {
        return getErrorResponse("An unexpected error occurred", 500);
    }
});
