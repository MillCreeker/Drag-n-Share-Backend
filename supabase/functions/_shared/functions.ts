import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";
import { corsHeaders } from "../_shared/cors.ts";

export function getSupabaseClient() {
    return createClient(
        Deno.env.get("_SUPABASE_URL")!,
        Deno.env.get("_SUPABASE_SERVICE_KEY")!,
        { auth: { persistSession: false } }
    );
}

export function getErrorResponse(message: string, code: number) {
    return new Response(message, {
        headers: { ...corsHeaders, "Content-Type": "text" },
        status: code,
    });
}

// deno-lint-ignore no-explicit-any
export function isInitial(value: any) {
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

export function genAccessKey() {
    return Math.random().toString().substring(2, 8);
}