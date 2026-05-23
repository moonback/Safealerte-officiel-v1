import React, { useState } from 'react';
import { ShieldAlert, Wifi, Mail, Lock, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

export default function OnboardingScreen() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrorMsg(error.message);
    } else {
      // Signup
      const { error, data } = await supabase.auth.signUp({
        email, 
        password,
        options: {
          data: { name }
        }
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        if (data?.session) {
           // Auto logged in
        } else {
           setSuccessMsg('Inscription réussie ! Vérifiez votre boîte mail pour confirmer votre compte.');
           setIsLogin(true);
           setPassword('');
        }
      }
    }
    setLoading(false);
  };

  const signInWithProvider = async (provider: 'google' | 'apple') => {
    // Requires Supabase configuration for Google/Apple
    await supabase.auth.signInWithOAuth({ provider });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-safe-red/20 via-safe-dark to-safe-dark">
      
      {/* Animated Rings Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-safe-red/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-safe-red/10 pointer-events-none" />

      <AnimatePresence mode="wait">
        {!showEmailForm ? (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center w-full max-w-sm"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex mb-8 relative"
            >
              <ShieldAlert size={80} className="text-safe-red" strokeWidth={1.5} />
              <Wifi size={32} className="text-white absolute -top-2 -right-4 animate-pulse" strokeWidth={2} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-center mb-16 z-10"
            >
              <h1 className="text-4xl font-bold tracking-tight text-white mb-4">Safe Alert</h1>
              <p className="text-gray-400 text-lg leading-relaxed max-w-[280px] mx-auto">
                Chaque seconde compte.<br/>Ensemble, soyons la différence.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="w-full space-y-4 z-10 mt-10"
            >
              <button 
                onClick={() => setShowEmailForm(true)}
                className="w-full flex items-center justify-center gap-2 bg-safe-red text-white font-semibold py-4 rounded-xl hover:bg-safe-red-hover active:scale-[0.98] transition-all"
              >
                <Mail size={20} />
                Continuer avec Email
              </button>
              <button 
                onClick={() => signInWithProvider('google')}
                className="w-full bg-[#ffffff] text-safe-dark font-semibold py-4 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all"
              >
                Continuer avec Google
              </button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="email-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full max-w-sm z-10"
          >
            <button 
              onClick={() => setShowEmailForm(false)}
              className="mb-8 p-2 bg-safe-card rounded-full inline-block"
            >
              <ArrowLeft size={20} />
            </button>

            <h2 className="text-3xl font-bold mb-2">{isLogin ? 'Bon retour' : 'Créer un compte'}</h2>
            <p className="text-gray-400 mb-8">
              {isLogin ? 'Connectez-vous pour continuer.' : 'Rejoignez la communauté Safe Alert.'}
            </p>

            {errorMsg && (
              <div className="bg-safe-red/20 border border-safe-red text-safe-red text-sm p-3 rounded-xl mb-4">
                {errorMsg}
              </div>
            )}
            
            {successMsg && (
              <div className="bg-safe-green/20 border border-safe-green text-safe-green text-sm p-3 rounded-xl mb-4">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Prénom & Nom"
                    className="w-full bg-safe-card border border-safe-border rounded-xl py-3 pl-12 pr-4 text-white focus:border-safe-red focus:outline-none transition-colors"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Adresse email"
                  className="w-full bg-safe-card border border-safe-border rounded-xl py-3 pl-12 pr-4 text-white focus:border-safe-red focus:outline-none transition-colors"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full bg-safe-card border border-safe-border rounded-xl py-3 pl-12 pr-4 text-white focus:border-safe-red focus:outline-none transition-colors"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-safe-red text-white font-bold py-4 rounded-xl mt-4 active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-gray-400 text-sm hover:text-white transition-colors"
              >
                {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  );
}
