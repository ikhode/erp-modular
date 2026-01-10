import {serve} from "https://deno.land/std@0.168.0/http/server.ts"
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { action, permissionData } = await req.json()

    if (action === 'check_permission') {
      const { userId, resource, action: actionName, terminalType } = permissionData

      let hasPermission = false

      if (terminalType) {
        // Verificar permiso con restricción de terminal
        const { data, error } = await supabaseClient
          .rpc('check_terminal_permission', {
            user_id: userId,
            terminal_type: terminalType,
            required_resource: resource,
            required_action: actionName
          })

        if (error) throw error
        hasPermission = data
      } else {
        // Verificar permiso base
        const { data, error } = await supabaseClient
          .rpc('check_permission', {
            user_id: userId,
            required_resource: resource,
            required_action: actionName
          })

        if (error) throw error
        hasPermission = data
      }

      return new Response(
        JSON.stringify({
          success: true,
          hasPermission: hasPermission
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'get_user_permissions') {
      const { userId } = permissionData

      // Obtener permisos del usuario
      const { data: permissions, error } = await supabaseClient
        .from('role_permissions')
        .select(`
          permissions(name, resource, action, description)
        `)
        .eq('role_id', supabaseClient.auth.user()?.user_metadata?.role_id)
        .eq('user_id', userId) // This needs to be adjusted based on your user-role relationship

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          permissions: permissions
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'update_role_permissions') {
      const { roleId, permissionIds } = permissionData

      // Eliminar permisos existentes del rol
      const { error: deleteError } = await supabaseClient
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)

      if (deleteError) throw deleteError

      // Insertar nuevos permisos
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map((permissionId: string) => ({
          role_id: roleId,
          permission_id: permissionId
        }))

        const { error: insertError } = await supabaseClient
          .from('role_permissions')
          .insert(rolePermissions)

        if (insertError) throw insertError
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Permisos del rol actualizados exitosamente'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'update_terminal_permissions') {
      const { terminalType, permissionUpdates } = permissionData

      // Actualizar permisos por terminal
      for (const update of permissionUpdates) {
        const { permissionId, allowed } = update

        const { error } = await supabaseClient
          .from('terminal_permissions')
          .upsert({
            terminal_type: terminalType,
            permission_id: permissionId,
            allowed: allowed
          }, {
            onConflict: 'terminal_type,permission_id'
          })

        if (error) throw error
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Permisos de terminal actualizados exitosamente'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'get_all_permissions') {
      // Obtener todos los permisos agrupados por recurso
      const { data: permissions, error } = await supabaseClient
        .from('permissions')
        .select('*')
        .order('resource', { ascending: true })
        .order('action', { ascending: true })

      if (error) throw error

      // Agrupar por recurso
      const groupedPermissions: Record<string, typeof permissions> = {}
      permissions.forEach(permission => {
        if (!groupedPermissions[permission.resource]) {
          groupedPermissions[permission.resource] = []
        }
        groupedPermissions[permission.resource].push(permission)
      })

      return new Response(
        JSON.stringify({
          success: true,
          permissions: groupedPermissions
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'get_role_permissions') {
      const { roleId } = permissionData

      // Obtener permisos asignados a un rol
      const { data: rolePermissions, error } = await supabaseClient
        .from('role_permissions')
        .select(`
          permission_id,
          permissions(name, resource, action, description)
        `)
        .eq('role_id', roleId)

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          rolePermissions: rolePermissions
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'get_terminal_permissions') {
      const { terminalType } = permissionData

      // Obtener permisos por terminal
      const { data: terminalPermissions, error } = await supabaseClient
        .from('terminal_permissions')
        .select(`
          permission_id,
          allowed,
          permissions(name, resource, action, description)
        `)
        .eq('terminal_type', terminalType)

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          terminalPermissions: terminalPermissions
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Acción no válida' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )

  } catch (error) {
    console.error('Error in permissions function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
