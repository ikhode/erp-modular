import {serve} from "https://deno.land/std@0.168.0/http/server.ts"
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'
import {decode as base64Decode, encode as base64Encode} from 'https://deno.land/std@0.208.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Función para desencriptar datos usando AES-GCM
async function decryptData(encryptedData: string, key: string): Promise<Float32Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  const salt = base64Decode(encryptedData.split(':')[0])
  const iv = base64Decode(encryptedData.split(':')[1])
  const encrypted = base64Decode(encryptedData.split(':')[2])

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    derivedKey,
    encrypted
  )

  // Convertir de ArrayBuffer a Float32Array
  const floatArray = new Float32Array(decrypted)
  return floatArray
}

// Función para calcular distancia euclidiana entre dos descriptores faciales
function euclideanDistance(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error('Descriptors must have the same length')
  }

  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i]
    sum += diff * diff
  }

  return Math.sqrt(sum)
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

    const { action, faceDescriptor, userId } = await req.json()

    if (action === 'authenticate') {
      if (!faceDescriptor || !userId) {
        return new Response(
          JSON.stringify({ error: 'Missing faceDescriptor or userId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Obtener el descriptor facial encriptado del usuario
      const { data: userData, error: userError } = await supabaseClient
        .from('profiles')
        .select('face_data')
        .eq('id', userId)
        .single()

      if (userError || !userData?.face_data) {
        return new Response(
          JSON.stringify({ error: 'User not found or no face data registered' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Desencriptar el descriptor almacenado
      const storedDescriptor = await decryptData(userData.face_data, Deno.env.get('FACE_ENCRYPTION_KEY') ?? '')

      // Convertir el descriptor recibido a Float32Array
      const receivedDescriptor = new Float32Array(faceDescriptor)

      // Calcular la distancia
      const distance = euclideanDistance(storedDescriptor, receivedDescriptor)

      // Umbral de similitud (ajustable, típicamente 0.6 es un buen valor)
      const threshold = 0.6
      const isMatch = distance < threshold

      return new Response(
        JSON.stringify({
          match: isMatch,
          distance: distance,
          threshold: threshold
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'register') {
      if (!faceDescriptor || !userId) {
        return new Response(
          JSON.stringify({ error: 'Missing faceDescriptor or userId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Encriptar el descriptor antes de guardarlo
      const descriptorArray = new Float32Array(faceDescriptor)
      const encryptedDescriptor = await encryptData(descriptorArray, Deno.env.get('FACE_ENCRYPTION_KEY') ?? '')

      // Guardar el descriptor encriptado
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ face_data: encryptedDescriptor })
        .eq('id', userId)

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to save face data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Face auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Función para encriptar datos usando AES-GCM
async function encryptData(data: Float32Array, key: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )

  // Convertir Float32Array a ArrayBuffer
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    derivedKey,
    buffer
  )

  // Combinar salt:iv:encrypted en base64
  const saltB64 = base64Encode(salt)
  const ivB64 = base64Encode(iv)
  const encryptedB64 = base64Encode(new Uint8Array(encrypted))

  return `${saltB64}:${ivB64}:${encryptedB64}`
}
