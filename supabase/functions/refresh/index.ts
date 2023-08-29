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

function genAccessKey() {
    return Math.random().toString().substring(2, 8);
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
            headers: { "Content-Type": "application/json" },
        });
    } catch (_) {
        return getErrorResponse("An unexpected error occurred", 500);
    }
});
