import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://qcdbyhxyebapfbaknkvc.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZGJ5aHh5ZWJhcGZiYWtua3ZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDc2NTEyNSwiZXhwIjoyMDQ2MzQxMTI1fQ.xb7YEd9Zi7YZ5lm9WfgSRdXfQxRyWvGhW1v6ut4WkIU"

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase