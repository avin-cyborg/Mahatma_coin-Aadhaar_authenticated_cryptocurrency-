import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateUserBalances() {
  try {
    // Fetch all users
    const { data: users, error: fetchError } = await supabase
      .from('users') // Replace with your actual user table name
      .select('*');

    if (fetchError) throw fetchError;

    // Update each user's balance
    for (const user of users) {
      const newBalance = user.balance + 10; // Assuming 'balance' is the field name
      const { error: updateError } = await supabase
        .from('users') // Replace with your actual user table name
        .update({ balance: newBalance })
        .eq('id', user.id); // Assuming 'id' is the primary key

      if (updateError) throw updateError;
    }

    console.log('Successfully added 10 Mahatma coins to all users.');
  } catch (error) {
    console.error('Error updating user balances:', (error as Error).message);

  }
}

updateUserBalances();
