import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rhghtegxlamvhxytwomx.supabase.co'
const supabaseAnonKey = 'sb_publishable_OP0AtJCqePEAW7AyZgLAGw_NEy2OqRV'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
