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
        let key: string;

        try {
            const request = await req.json();
            name = request.name;
            key = request.key;
        } catch (_) {
            return getErrorResponse("Invalid body", 400);
        }

        if (typeof name == "undefined" || name == null || name == "") {
            return getErrorResponse("No name received", 400);
        }

        if (typeof key == "undefined" || key == null || key == "") {
            return getErrorResponse("No key received", 400);
        }

        // check name exists
        const resp = await supabase
            .from("data")
            .select("id, name, timestamp, access ( access-key )")
            .eq("name", name);

        if (resp == null || resp.data == null || resp.data.length == 0) {
            return getErrorResponse("Name not found", 404);
        }

        const respObj = JSON.parse(JSON.stringify(resp.data[0]));

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

        // check key is correct
        if (key != respObj.access["access-key"]) {
            await supabase
                .from("lock-entries")
                .insert({ "data-id": respObj.id });
            return getErrorResponse(
                "Wrong access key. Data is locked. Refresh on other device.",
                401
            );
        }

        // get data
        const dataResp = await supabase
            .from("data")
            .select("data, is-text-only")
            .eq("id", respObj.id);
        const dataRespObj = JSON.parse(JSON.stringify(dataResp.data))[0];

        const body = {
            name: respObj.name,
            data: dataRespObj.data,
            isTextOnly: dataRespObj["is-text-only"],
        };

        return new Response(JSON.stringify(body), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (_) {
        return getErrorResponse("An unexpected error occurred", 500);
    }
});
