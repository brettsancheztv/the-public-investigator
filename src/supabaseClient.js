import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = 'https://lehifcqxbhwaomdxaqmk.supabase.co'
   const supabaseKey = 'sb_publishable_TvZFOIFa4d7K6bTuDkKl_w_CxItdJbd'

   export const supabase = createClient(supabaseUrl, supabaseKey)
   