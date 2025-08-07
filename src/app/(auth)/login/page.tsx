'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { showToast } from '@/lib/showToast';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const loginUser = async (formData: FormData) => {
    setIsLoading(true);
    const username = formData.get('username');
    const password = formData.get('password');

    if (typeof username !== 'string' || typeof password !== 'string') {
      console.error('Invalid username or password');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user);
        showToast('success', `Selamat datang ${data.user.username}`);
        data.user.role === 'admin' ? router.push('/dashboard') : router.push('/transaksi/penjualan');
      } else {
        showToast('warning', 'Terjadi Kesalahan');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 luxury-card p-10 rounded-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-accent-300">Toko Emas</h2>
          <h2 className="text-center text-3xl font-extrabold text-accent-300">Sabar 2</h2>
        </div>
        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            loginUser(new FormData(e.currentTarget));
          }}
        >
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Nama Pengguna
              </label>
              <input
                id="username"
                name="username"
                type="username"
                autoComplete="username"
                required
                className="luxury-input appearance-none rounded-t-md relative block w-full px-3 py-2 focus:outline-none focus:z-10 sm:text-sm"
                placeholder="Nama Pengguna"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Kata Sandi
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="luxury-input appearance-none rounded-b-md relative block w-full px-3 py-2 focus:outline-none focus:z-10 sm:text-sm"
                placeholder="Kata Sandi"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-accent-300 hover:text-accent-200">
                Lupa kata sandi?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className={`luxury-button group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-luxury-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-400 ${
                isLoading ? 'animate-pulse' : ''
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Sedang Masuk...' : 'Masuk'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <p className="text-sm text-luxury-200">
            Belum punya akun?{' '}
            <Link href="/register" className="font-medium text-accent-300 hover:text-accent-200">
              Daftar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
