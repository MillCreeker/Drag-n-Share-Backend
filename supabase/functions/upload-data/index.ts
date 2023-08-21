// import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as uuid from "https://deno.land/std@0.194.0/uuid/mod.ts";

const supabase = createClient(
    Deno.env.get("_SUPABASE_URL")!,
    Deno.env.get("_SUPABASE_SERVICE_KEY")!
);

// deno-lint-ignore no-explicit-any
function isInitial(value: any) {
    if (
        typeof value == "undefined" ||
        value == null ||
        value == "" ||
        value.length == 0
    ) {
        return true;
    }

    return false;
}

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
        let request;
        let name;
        let data;
        let isTextOnly;

        try {
            request = await req.json();
            name = request.name;
            data = request.data;
            isTextOnly = request.isTextOnly;
        } catch (_) {
            return getErrorResponse("Invalid body", 400);
        }

        if (isInitial(name)) {
            return getErrorResponse("Name empty", 400);
        }

        const { data: resp } = await supabase
            .from("data")
            .select("name")
            .eq("name", name);
        
        if (resp != null) {
            if (resp.length > 0) {
                return getErrorResponse("Name already exists", 409);
            }
        }

        if (isInitial(data)) {
            return getErrorResponse("Data missing", 400);
        }

        if (typeof isTextOnly != "boolean") {
            return getErrorResponse("Wrong data type for isTextOnly", 400);
        }

        if (!isTextOnly) {
            // TODO some more checks for files
        }

        if (data.length > 1073741824) {
            return getErrorResponse("Maximum data size (1GB) exceeded", 413);
        }

        const id = uuid.v1.generate();
        const ownerId = uuid.v1.generate();

        await supabase.from("data").insert([
            {
                id: id,
                name: name,
                data: data,
                "is-text-only": isTextOnly,
            },
        ]);

        await supabase
            .from("access")
            .insert([
                { "data-id": id, token: ownerId, "access-key": genAccessKey() },
            ]);

        return new Response(ownerId.toString(), {
            headers: { "Content-Type": "text" },
        });
    } catch (_) {
        return getErrorResponse("An unexpected error occurred", 500);
    }
});
