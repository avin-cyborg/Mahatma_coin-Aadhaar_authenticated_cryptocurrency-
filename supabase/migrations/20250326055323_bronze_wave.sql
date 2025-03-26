/*
  # Update profiles table RLS policies

  1. Changes
    - Add INSERT policy for authenticated users to create their own profile
    - Update existing SELECT and UPDATE policies for better clarity

  2. Security
    - Maintains RLS enabled on profiles table
    - Ensures users can only access and modify their own data
    - Allows initial profile creation during signup
*/

-- Drop existing policies to recreate them with better names and conditions
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create comprehensive policies for all necessary operations
CREATE POLICY "Enable users to create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable users to view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable users to update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);