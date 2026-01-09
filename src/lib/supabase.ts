// Documentación: src/lib/supabase.ts
// Inicialización centralizada de Supabase para MCP forzagro
// Autor: GitHub Copilot

import {createClient} from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

