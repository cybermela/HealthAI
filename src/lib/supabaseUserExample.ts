import { supabase } from '@/integrations/supabase/client';

// Example code to query user signup data using Supabase client
// Adjusted to use 'profiles' table which is likely mapped in your Database type

export async function getUsers() {
  const { data, error } = await supabase
    .from('profiles') // Use 'profiles' table or your user table mapped in Database type
    .select('*');

  if (error) {
    console.error('Error fetching users:', error);
    return null;
  }

  return data;
}

// Usage example:
// getUsers().then(users => console.log(users));
