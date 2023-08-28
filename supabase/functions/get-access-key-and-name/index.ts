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

serve(async (req) => {
    try {
        const ownerId = req.headers.get("access");

        if (ownerId == null || ownerId == "") {
            return getErrorResponse("No ownerId received", 400);
        }

        // get data
        const { data: resp } = await supabase
            .from("access")
            .select("access-key, data ( id, name, timestamp )")
            .eq("token", ownerId);

        if (resp == null || resp.length == 0) {
            return getErrorResponse("No data found for ownerId", 401);
        }
        const respObj = JSON.parse(JSON.stringify(resp[0]));

        const body = {
            accessKey: respObj["access-key"],
            name: respObj.data.name,
        };

        // check if is expired
        const now = new Date().valueOf();
        const timestamp = new Date(respObj.data.timestamp).valueOf();
        if (now - timestamp > 300000) {
            await supabase.from("data").delete().eq("id", respObj.data.id);
            return getErrorResponse("Data has expired", 410);
        }

        // check if data is locked
        const { data: lockEntry } = await supabase
            .from("lock-entries")
            .select("data-id")
            .eq("data-id", respObj.data.id);

        if (lockEntry == null || lockEntry.length != 0) {
            return getErrorResponse(
                "Data is currently locked, please refresh acceess key",
                409
            );
        }

        return new Response(JSON.stringify(body), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (_) {
        return getErrorResponse("An unexpected error occurred", 500);
    }
});
