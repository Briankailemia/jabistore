'use client';

import { useState, useCallback, memo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useCart } from '@/lib/apiService';

const Navbar = memo(function Navbar() {
  const { data: session } = useSession();
  const { cart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const cartItemCount = cart?.reduce((total, item) => total + item.quantity, 0) || 0;

  const toggleMobileMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const closeUserMenu = useCallback(() => {
    setIsUserMenuOpen(false);
  }, []);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-900 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">DS</span>
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent hidden xs:block">
              Dilitech Solutions
            </span>
            <span className="text-sm font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent xs:hidden">
              DS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-purple-600 transition-colors">
              Products
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-purple-600 transition-colors">
              Categories
            </Link>
            <Link href="/brands" className="text-gray-700 hover:text-purple-600 transition-colors">
              Brands
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-purple-600 transition-colors">
              Contact
            </Link>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search */}
            <Link href="/search" className="p-2 text-gray-700 hover:text-purple-600 transition-colors rounded-lg hover:bg-gray-100">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-gray-700 hover:text-purple-600 transition-colors rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {session ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 p-1 text-gray-700 hover:text-purple-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs sm:text-sm font-medium">
                      {session.user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={closeUserMenu}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={closeUserMenu}
                    >
                      Orders
                    </Link>
                    {session.user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={closeUserMenu}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        closeUserMenu();
                        signOut();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  href="/auth/signin"
                  className="text-sm text-gray-700 hover:text-purple-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-purple-600 text-white px-3 py-2 text-sm rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-700 hover:text-purple-600 transition-colors rounded-lg hover:bg-gray-100"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-3 pt-2 pb-3 space-y-1">
              <Link
                href="/products"
                className="block px-3 py-3 text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={closeMobileMenu}
              >
                Products
              </Link>
              <Link
                href="/categories"
                className="block px-3 py-3 text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={closeMobileMenu}
              >
                Categories
              </Link>
              <Link
                href="/brands"
                className="block px-3 py-3 text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={closeMobileMenu}
              >
                Brands
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-3 text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={closeMobileMenu}
              >
                Contact
              </Link>
              
              {/* Mobile User Menu */}
              {session ? (
                <div className="pt-2 border-t mt-2">
                  <div className="flex items-center px-3 py-2 mb-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-medium">
                        {session.user.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{session.user.name}</div>
                      <div className="text-xs text-gray-500">{session.user.email}</div>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="block px-3 py-3 text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-3 py-3 text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Orders
                  </Link>
                  {session.user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="block px-3 py-3 text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={closeMobileMenu}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      signOut();
                    }}
                    className="block w-full text-left px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t mt-2 space-y-1">
                  <Link
                    href="/auth/signin"
                    className="block px-3 py-3 text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block px-3 py-3 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors text-center"
                    onClick={closeMobileMenu}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
});

export default Navbar;
