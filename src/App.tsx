import React, { useEffect, useState } from 'react';
import { Wallet, Send, RadioReceiver as Receive, History, Settings, Lock, RefreshCw, Circle, ChevronDown, Shield } from 'lucide-react';
import { useWalletStore } from './store/walletStore';
import { supabase } from './lib/supabase';

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aadhaar, setAadhar] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isAadharVerified, setIsAadharVerified] = useState(false);

  const handleVerifyAadhar = async () => {
    const { data, error: aadharError } = await supabase
      .from('aadhaar') // Use the correct aadhaar table for verification
      .select('*')
      .eq('aadhaar_number', aadhaar)
      .single();

    console.log('Aadhaar verification data:', data); // Log the data for debugging
    console.log('Aadhaar verification error:', aadharError); // Log the error for debugging

    if (aadharError || !data) {
      setError('Invalid Aadhaar number');
      setIsAadharVerified(false);
    } else {
      setIsAadharVerified(true);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {        
        const { data, error: aadharError } = await supabase
          .from('aadhaar_table') // Replace with your actual table name
      .select('*')
      .eq('aadhaar_number', aadhaar)

          .single();

        if (aadharError || !data) {
          setError('Invalid Aadhaar number');
          setLoading(false);
          return;
        }

        // Proceed to prompt for OTP
        // Verify OTP logic here
        // After verifying OTP, proceed with sign-in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,

        });
        if (signUpError) throw signUpError;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6">
          {isLogin ? 'Login to Mahatma Coin' : 'Create Mahatma Coin Wallet'}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Aadhaar
            </label>
            <input
              type="text"
              value={aadhaar}
              onChange={(e) => setAadhar(e.target.value)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>

          {isAadharVerified && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
          )}
          <button
            type="button"
            onClick={handleVerifyAadhar}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Verify Aadhaar
          </button>

          {error && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Wallet')}
          </button>

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-gray-400 hover:text-white transition-colors text-sm"
          >
            {isLogin ? "Don't have a wallet? Create one" : 'Already have a wallet? Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

function WalletApp() {
  const {
    balance,
    isLocked,
    walletAddress,
    isLoading,
    error,
    initializeWallet,
    refreshBalance,
    toggleLock,
    sendTransaction
  } = useWalletStore();

  const [activeTab, setActiveTab] = useState('wallet');
  const [isSynced, setIsSynced] = useState(true);
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    initializeWallet();
  }, []);

  const handleRefresh = async () => {
    await refreshBalance();
  };

  const handleSendTransaction = async () => {
    if (!amount || !recipientAddress) return;
    await sendTransaction(recipientAddress, parseFloat(amount));
    setRecipientAddress('');
    setAmount('');
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const tabs = [
    { id: 'wallet', name: 'Wallet', icon: Wallet, content: 'Wallet Overview' },
    { id: 'send', name: 'Send', icon: Send, content: 'Send MHC' },
    { id: 'receive', name: 'Receive', icon: Receive, content: 'Receive MHC' },
    { id: 'history', name: 'History', icon: History, content: 'Transaction History' },
    { id: 'settings', name: 'Settings', icon: Settings, content: 'Wallet Settings' },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Mahatma Coin</h1>
          <div className="flex items-center text-sm text-gray-400">
            <Circle className="w-3 h-3 mr-2 text-green-500" />
            {isSynced ? 'Synchronized' : 'Synchronizing...'}
          </div>
        </div>

        <nav className="flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={handleSignOut}
          className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {isLocked ? '****.***** ' : `${balance} `}
              <span className="text-gray-400">MHC</span>
            </h2>
            <div className="flex items-center text-gray-400">
              <Shield className="w-4 h-4 mr-2" />
              <span>
                Wallet is encrypted and currently {isLocked ? 'locked' : 'unlocked'}
              </span>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={toggleLock}
              className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Lock className="w-4 h-4 mr-2" />
              {isLocked ? 'Unlock Wallet' : 'Lock Wallet'}
            </button>
          </div>
        </div>

        {/* Network Status */}
        <div className="bg-gray-800 p-4 rounded-lg mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-8">
                <div className="text-sm text-gray-400 mb-1">Network Status</div>
                <div className="flex items-center">
                  <Circle className="w-3 h-3 mr-2 text-green-500" />
                  Connected
                </div>
              </div>
              <div className="mr-8">
                <div className="text-sm text-gray-400 mb-1">Network Height</div>
                <div>2,543,678</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Connections</div>
                <div>8 peers</div>
              </div>
            </div>
            <button
              onClick={() => setShowNetworkDetails(!showNetworkDetails)}
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <span className="mr-2">Advanced network details</span>
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showNetworkDetails ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {showNetworkDetails && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Download Speed</div>
                  <div>1.2 MB/s</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Upload Speed</div>
                  <div>0.8 MB/s</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Last Block Time</div>
                  <div>2 minutes ago</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {activeTab === 'wallet' && (
            <>
              <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((tx) => (
                  <div key={tx} className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <div className="font-medium">Received Payment</div>
                      <div className="text-sm text-gray-400">March {tx}, 2024 12:0{tx} PM</div>
                    </div>
                    <div className="text-green-500">+123.456789 MHC</div>
                  </div>
                ))}
              </div>
            </>
          )}
          {activeTab === 'send' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Send MHC</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Recipient Address</label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                    placeholder="Enter MHC address"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Amount (MHC)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                    placeholder="0.00"
                  />
                </div>
                <button
                  onClick={handleSendTransaction}
                  disabled={isLoading || !amount || !recipientAddress}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Transaction'}
                </button>
              </div>
            </div>
          )}
          {activeTab === 'receive' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Receive MHC</h3>
              <div className="bg-gray-700 p-6 rounded-lg text-center">
                <div className="mb-4">Your Wallet Address:</div>
                <div className="bg-gray-800 p-4 rounded text-sm font-mono mb-4">
                  {walletAddress}
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Copy Address
                </button>
              </div>
            </div>
          )}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Transaction History</h3>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <div className="font-medium">{i % 2 === 0 ? 'Sent Payment' : 'Received Payment'}</div>
                      <div className="text-sm text-gray-400">March {i + 1}, 2024</div>
                    </div>
                    <div className={i % 2 === 0 ? 'text-red-500' : 'text-green-500'}>
                      {i % 2 === 0 ? '-' : '+'}123.456789 MHC
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Wallet Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium">Auto-lock wallet</div>
                    <div className="text-sm text-gray-400">Lock wallet after 10 minutes of inactivity</div>
                  </div>
                  <button className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    Configure
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium">Change Password</div>
                    <div className="text-sm text-gray-400">Update your wallet encryption password</div>
                  </div>
                  <button className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    Change
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium">Backup Wallet</div>
                    <div className="text-sm text-gray-400">Create a backup of your wallet file</div>
                  </div>
                  <button className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    Backup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return session ? <WalletApp /> : <AuthForm />;
}

export default App;
