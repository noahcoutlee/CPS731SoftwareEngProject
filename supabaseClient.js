import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://qcdbyhxyebapfbaknkvc.supabase.co"
const supabaseKey = process.env.Supabase_Key

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
