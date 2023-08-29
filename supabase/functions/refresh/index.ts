import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
    getErrorResponse,
    getSupabaseClient,
    genAccessKey,
} from "../_shared/functions.ts";

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
            .select("data ( id, name, timestamp )")
            .eq("token", ownerId);

        if (resp == null || resp.length == 0) {
            return getErrorResponse("No data found for ownerId", 401);
        }
        const respObj = JSON.parse(JSON.stringify(resp[0]));

        const body = {
            name: respObj.data.name,
            accessKey: genAccessKey(),
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

        if (lockEntry != null && lockEntry.length != 0) {
            await supabase
                .from("lock-entries")
                .delete()
                .eq("data-id", respObj.data.id);
        }

        // change name
        let newName: string;

        try {
            const request = await req.json();
            newName = request.name;
        } catch (_) {
            newName = "";
        }

        if (newName != "" && newName != body.name) {
            const { data: resp } = await supabase
                .from("data")
                .select("name")
                .eq("name", newName);

            if (resp != null && resp.length > 0) {
                return getErrorResponse(
                    "Name already exists, please choose a different one",
                    409
                );
            }

            await supabase
                .from("data")
                .update({ name: newName })
                .eq("id", respObj.data.id);

            body.name = newName;
        }

        // change access-key
        await supabase
            .from("access")
            .update({ "access-key": body.accessKey })
            .eq("token", ownerId);

        return new Response(JSON.stringify(body), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (_) {
        return getErrorResponse("An unexpected error occurred", 500);
    }
});
