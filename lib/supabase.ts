import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fagjbhhmbpdsmoyjcood.supabase.co";
const supabasePublishableKey = "sb_publishable_9akcQKdMBZYFvwCbNvnW-A_n0rYOudi";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
