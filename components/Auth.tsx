
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthComponent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setError('');
    setMessage('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } 
    setLoading(false);
  };

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Registre completat! Revisa el teu correu electrònic per confirmar el compte.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F5F9] relative overflow-hidden font-sans text-slate-800">
       {/* Background Elements similar to App.tsx */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-200/40 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10 w-full max-w-md p-8 md:p-12">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white/50 overflow-hidden p-8 md:p-10">
            
            {/* Header / Logo Area */}
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-slate-300 transform -rotate-6">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Benvingut/da</h1>
                <p className="text-slate-500">
                    {isSignUp ? 'Crea el teu compte de mestre' : 'Accedeix al teu espai docent'}
                </p>
            </div>

            <form className="space-y-5" onSubmit={isSignUp ? handleSignUp : handleLogin}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-3">Correu Electrònic</label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all shadow-inner"
                            placeholder="nom@escola.cat"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-3">Contrasenya</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all shadow-inner"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 flex items-center gap-2 animate-fadeIn">
                         <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         {error}
                    </div>
                )}
                {message && (
                    <div className="p-4 bg-green-50 text-green-600 text-sm rounded-2xl border border-green-100 flex items-center gap-2 animate-fadeIn">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-2xl text-white font-bold text-lg bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all shadow-lg transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                             Processant...
                        </span>
                    ) : (isSignUp ? 'Crear Compte' : 'Entrar')}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <button
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError('');
                        setMessage('');
                    }}
                    className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    {isSignUp ? (
                        <>Ja tens un compte? <span className="text-slate-900 font-bold underline decoration-indigo-200 underline-offset-4">Inicia sessió</span></>
                    ) : (
                        <>Encara no tens compte? <span className="text-slate-900 font-bold underline decoration-indigo-200 underline-offset-4">Registra't gratuïtament</span></>
                    )}
                </button>
            </div>
        </div>
        <p className="text-center text-slate-400 text-xs mt-6">
            Gestió d'avaluacions escolar segura i privada.
        </p>
      </div>
    </div>
  );
};

export default AuthComponent;
