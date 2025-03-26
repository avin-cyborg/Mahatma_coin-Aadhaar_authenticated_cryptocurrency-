/*
  # Wallet Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, matches auth.users)
      - `wallet_address` (text, unique)
      - `balance` (numeric)
      - `is_locked` (boolean)
      - `auto_lock_minutes` (integer)
      - `last_active` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, foreign key)
      - `type` (text: 'send' or 'receive')
      - `amount` (numeric)
      - `recipient_address` (text)
      - `sender_address` (text)
      - `created_at` (timestamp)
      - `status` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for transaction history
*/

-- Create profiles table
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    wallet_address text UNIQUE NOT NULL,
    balance numeric DEFAULT 0 CHECK (balance >= 0),
    is_locked boolean DEFAULT true,
    auto_lock_minutes integer DEFAULT 10,
    last_active timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES profiles(id) NOT NULL,
    type text CHECK (type IN ('send', 'receive')) NOT NULL,
    amount numeric CHECK (amount > 0) NOT NULL,
    recipient_address text,
    sender_address text,
    created_at timestamptz DEFAULT now(),
    status text CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Transactions policies
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    TO authenticated
    USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
    ON transactions FOR INSERT
    TO authenticated
    WITH CHECK (profile_id = auth.uid());

-- Create function to update last_active
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for last_active updates
CREATE TRIGGER update_profile_last_active
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active();