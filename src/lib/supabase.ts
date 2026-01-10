// crear supabase client
import {createClient} from '@supabase/supabase-js'

export const supabase = createClient(
    // Supabase URL from environment variable sin Deno
    import.meta.env.VITE_SUPABASE_URL,
    // Supabase Anon Key from environment variable sin Deno
    import.meta.env.VITE_SUPABASE_ANON_KEY
)