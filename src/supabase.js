//@ts-nocheck

import { createClient } from '@supabase/supabase-js'

// supabse db

const supabaseUrl = 'https://aladwvdyiujcdoezjxwq.supabase.co'
//anon key  public
const supabaseKey = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsYWR3dmR5aXVqY2RvZXpqeHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjY1NDYsImV4cCI6MjA2ODM0MjU0Nn0.iMfr8fW3KdmLQ-O1rQcsHaygkVbcmSe8xy02LPKiqQA
const supabase = createClient(supabaseUrl, supabaseKey)

//
