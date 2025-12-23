'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = () => {
      try {
        // Verificar si hay error
        const errorParam = searchParams.get('error');
        if (errorParam) {
          setError(decodeURIComponent(errorParam));
          setProcessing(false);
          return;
        }

        // El backend redirige con los datos del usuario en query params
        const userDataStr = searchParams.get('user');
        
        if (!userDataStr) {
          setError('No se recibieron datos del usuario');
          setProcessing(false);
          return;
        }

        // Decodificar y parsear datos del usuario
        const userData = JSON.parse(decodeURIComponent(userDataStr));
        
        // Guardar en localStorage con la clave correcta (debe ser 'user' para que Navbar lo detecte)
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Redirigir a la página principal con reload completo para que Navbar detecte el cambio
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } catch (error: any) {
        console.error('Error handling auth callback:', error);
        setError(error.message || 'Error al procesar la autenticación');
        setProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900">
        <div className="card max-w-md text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-poke-red mb-4"></i>
          <h2 className="text-2xl font-bold mb-4">Error de Autenticación</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <a href="/" className="btn-primary inline-block">
            <i className="fas fa-home mr-2"></i>
            Volver al Inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-poke-blue border-t-transparent mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">
          {processing ? 'Autenticando...' : '¡Autenticación exitosa!'}
        </h2>
        <p className="text-slate-300">Redirigiendo a la página principal</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-poke-blue border-t-transparent mb-4"></div>
          <p className="text-xl">Cargando...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
