import supabase from 'src/lib/supabase';

export async function deleteAccount(): Promise<boolean> {
  const { error } = await supabase.functions.invoke('delete-account');
  return !error;
}
