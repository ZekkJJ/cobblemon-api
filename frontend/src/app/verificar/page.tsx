'use client';

import { useState, useEffect } from 'react';
import { verificationAPI, authAPI } from '@/lib/api-client';
import { playSound } from '@/lib/sounds';

interface LocalUser {
  discordId: string;
  discordUsername: string;
  nickname?: string;
  avatar?: string;
  minecraftUuid?: string;
  isMinecraftVerified?: boolean;
}

export default function VerificarPage() {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('cobblemon_user');
    if (stored) {
      try {
        setLocalUser(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!localUser) {
      setResult({ error: 'You must sign in with Discord first' });
      playSound('cancel');
      return;
    }

    if (code.length !== 5 || !/^\d+$/.test(code)) {
      setResult({ error: 'Code must be 5 numeric digits' });
      playSound('cancel');
      return;
    }

    setVerifying(true);
    setResult(null);

    try {
      const data = await verificationAPI.verify({
        code,
        discordId: localUser.discordId,
      });

      if (data.success) {
        setResult({
          success: true,
          message: `Verification successful! Your Minecraft account is linked.`,
        });
        playSound('confirm');

        // Actualizar usuario en localStorage
        const updatedUser = {
          ...localUser,
          minecraftUuid: data.minecraftUuid,
          isMinecraftVerified: true,
        };
        localStorage.setItem('cobblemon_user', JSON.stringify(updatedUser));
        setLocalUser(updatedUser);
      } else {
        setResult({ error: data.error || 'Verification error' });
        playSound('cancel');
      }
    } catch (error: any) {
      setResult({ error: error.message || 'Connection error' });
      playSound('cancel');
    } finally {
      setVerifying(false);
    }
  };

  const handleDiscordLogin = () => {
    try {
      const authUrl = authAPI.getDiscordAuthUrl();
      window.location.href = authUrl;
    } catch (e: any) {
      setResult({ error: e.message || 'Error connecting to server' });
      playSound('cancel');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-poke-blue border-t-transparent mb-4"></div>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-poke-blue to-cyan-500 flex items-center justify-center">
              <i className="fas fa-link text-white text-2xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verify Account</h1>
            <p className="text-slate-400">
              Link your Minecraft account with Discord
            </p>
          </div>

          {/* Steps */}
          <div className="bg-slate-700/50 rounded-lg p-4 mb-6 text-sm">
            <p className="text-slate-300 mb-3 font-medium">Steps:</p>
            <ol className="space-y-2 text-slate-400">
              <li className="flex items-start gap-2">
                <span className="bg-poke-blue/20 text-poke-blue w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0">1</span>
                <span>Join the Minecraft server</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-poke-blue/20 text-poke-blue w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0">2</span>
                <span>A 5-digit code will appear</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-poke-blue/20 text-poke-blue w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0">3</span>
                <span>Enter the code below</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-poke-blue/20 text-poke-blue w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0">4</span>
                <span>Done! You can now move around the server</span>
              </li>
            </ol>
          </div>

          {/* Login with Discord if not logged in */}
          {!localUser ? (
            <button
              onClick={handleDiscordLogin}
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <i className="fab fa-discord"></i>
              Sign in with Discord
            </button>
          ) : (
            <>
              {/* User info */}
              <div className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3 mb-6">
                {localUser.avatar && (
                  <img
                    src={localUser.avatar}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <p className="text-white font-medium">
                    {localUser.nickname || localUser.discordUsername}
                  </p>
                  <p className="text-slate-400 text-sm">Discord linked</p>
                </div>
                <i className="fas fa-check-circle text-poke-green"></i>
              </div>

              {/* Code input form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-2">
                    Verification code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="12345"
                    className="w-full bg-slate-700 text-white text-center text-2xl tracking-[0.5em] py-4 px-4 rounded-lg border border-slate-600 focus:border-poke-blue focus:outline-none placeholder:text-slate-500 placeholder:tracking-normal"
                    maxLength={5}
                    disabled={verifying}
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifying || code.length !== 5}
                  className="w-full bg-gradient-to-r from-poke-blue to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-700 text-white py-3 px-4 rounded-lg font-medium transition-all disabled:cursor-not-allowed"
                >
                  {verifying ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check mr-2"></i>
                      Verify Account
                    </>
                  )}
                </button>
              </form>

              {/* Result message */}
              {result && (
                <div
                  className={`mt-4 p-4 rounded-lg text-center ${result.success
                      ? 'bg-poke-green/20 border border-poke-green/50 text-poke-green'
                      : 'bg-poke-red/20 border border-poke-red/50 text-poke-red'
                    }`}
                >
                  <i className={`fas ${result.success ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
                  {result.success ? result.message : result.error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Help text */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Problems? Use <code className="text-slate-400 bg-slate-800 px-2 py-1 rounded">/codigo</code> in the server to see your code again.
        </p>
      </div>
    </div>
  );
}
