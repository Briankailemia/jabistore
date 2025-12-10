'use client';

// API service layer for database interactions
class ApiService {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Generic fetch with caching and error handling
  async fetchWithCache(url, options = {}) {
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && (typeof window !== 'undefined') && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        credentials: 'include', // Always include cookies for session
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        // Handle 401 specifically for better error messages
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful GET requests (client-side only)
      if (typeof window !== 'undefined' && (!options.method || options.method === 'GET')) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
      }

      return data;
    } catch (error) {
      console.error('API Service Error:', error);
      throw error;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Products API
  async getProducts(filters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    const url = `/api/products${queryString ? `?${queryString}` : ''}`;
    
    return this.fetchWithCache(url);
  }

  async getProduct(id) {
    return this.fetchWithCache(`/api/products/${id}`);
  }

  async createProduct(productData) {
    this.clearCache(); // Clear cache after mutations
    return this.fetchWithCache('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id, productData) {
    this.clearCache();
    return this.fetchWithCache(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id) {
    this.clearCache();
    return this.fetchWithCache(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories API
  async getCategories(filters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    const url = `/api/categories${queryString ? `?${queryString}` : ''}`;
    
    return this.fetchWithCache(url);
  }

  async createCategory(categoryData) {
    this.clearCache();
    return this.fetchWithCache('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  // Brands API
  async getBrands(filters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    const url = `/api/brands${queryString ? `?${queryString}` : ''}`;
    
    return this.fetchWithCache(url);
  }

  async createBrand(brandData) {
    this.clearCache();
    return this.fetchWithCache('/api/brands', {
      method: 'POST',
      body: JSON.stringify(brandData),
    });
  }

  // Orders API
  async getOrders(filters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    const url = `/api/orders${queryString ? `?${queryString}` : ''}`;
    
    return this.fetchWithCache(url, { credentials: 'include' });
  }

  async createOrder(orderData) {
    this.clearCache();
    return this.fetchWithCache('/api/orders', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(orderData),
    });
  }

  async getOrderDetail(orderId) {
    const response = await fetch(`/api/orders/${orderId}`, { 
      cache: 'no-store',
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to fetch order');
    }
    return response.json();
  }

  async trackOrder(orderNumber) {
    const response = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}`, {
      cache: 'no-store',
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to track order');
    }
    return response.json();
  }

  async updateOrder(orderId, orderData) {
    this.clearCache();
    return this.fetchWithCache(`/api/orders/${orderId}`, {
      method: 'PUT',
      credentials: 'include',
      body: JSON.stringify(orderData),
    });
  }

  // Users API (Admin only)
  async getUsers(filters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    const url = `/api/users${queryString ? `?${queryString}` : ''}`;
    
    return this.fetchWithCache(url, { credentials: 'include' });
  }

  async getUser(userId) {
    return this.fetchWithCache(`/api/users/${userId}`, { credentials: 'include' });
  }

  async updateUser(userId, userData) {
    this.clearCache();
    return this.fetchWithCache(`/api/users/${userId}`, {
      method: 'PUT',
      credentials: 'include',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    this.clearCache();
    return this.fetchWithCache(`/api/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  }

  // Admin Stats API
  async getAdminStats() {
    return this.fetchWithCache('/api/admin/stats', { credentials: 'include' });
  }

  // Coupons API (Admin only)
  async getCoupons(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    const queryString = params.toString();
    const url = `/api/coupons${queryString ? `?${queryString}` : ''}`;
    return this.fetchWithCache(url, { credentials: 'include' });
  }

  async createCoupon(couponData) {
    this.clearCache();
    return this.fetchWithCache('/api/coupons', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(couponData),
    });
  }

  async updateCoupon(couponId, couponData) {
    this.clearCache();
    return this.fetchWithCache(`/api/coupons/${couponId}`, {
      method: 'PUT',
      credentials: 'include',
      body: JSON.stringify(couponData),
    });
  }

  async deleteCoupon(couponId) {
    this.clearCache();
    return this.fetchWithCache(`/api/coupons/${couponId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  }

  // Reviews API (Admin)
  async getAllReviews(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    const queryString = params.toString();
    const url = `/api/reviews${queryString ? `?${queryString}` : ''}`;
    return this.fetchWithCache(url, { credentials: 'include' });
  }

  async deleteReview(reviewId) {
    this.clearCache();
    return this.fetchWithCache(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  }

  // Search API
  async search(query, filters = {}) {
    return this.getProducts({
      search: query,
      ...filters,
    });
  }

  // Featured content
  async getFeaturedProducts() {
    return this.getProducts({ featured: true, limit: 8 });
  }

  async getFeaturedCategories() {
    return this.getCategories({ featured: true });
  }

  async getFeaturedBrands() {
    return this.getBrands({ featured: true });
  }

  // Cart API
  async getCart() {
    const response = await fetch('/api/cart', {
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to fetch cart');
    }
    return response.json();
  }

  async addToCart(productId, quantity = 1) {
    this.clearCache();
    const response = await fetch('/api/cart', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity })
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to add to cart');
    }
    return response.json();
  }

  async updateCartItem(itemId, quantity) {
    this.clearCache();
    const response = await fetch(`/api/cart/${itemId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity })
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to update cart item');
    }
    return response.json();
  }

  async removeFromCart(itemId) {
    this.clearCache();
    const response = await fetch(`/api/cart/${itemId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to remove from cart');
    }
    return response.json();
  }

  async clearCart() {
    this.clearCache();
    const response = await fetch('/api/cart', {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to clear cart');
    }
    return response.json();
  }

  // Wishlist API
  async getWishlist() {
    const response = await fetch('/api/wishlist', {
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to fetch wishlist');
    }
    return response.json();
  }

  async addToWishlist(productId) {
    this.clearCache();
    const response = await fetch('/api/wishlist', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to add to wishlist');
    }
    return response.json();
  }

  async removeFromWishlist(itemId) {
    this.clearCache();
    const response = await fetch(`/api/wishlist/${itemId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to remove from wishlist');
    }
    return response.json();
  }

  async clearWishlist() {
    this.clearCache();
    const response = await fetch('/api/wishlist', {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to clear wishlist');
    }
    return response.json();
  }

  // Reviews API
  async getReviews(productId, limit = 10, offset = 0) {
    const params = new URLSearchParams();
    if (productId) params.append('productId', productId);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await fetch(`/api/reviews?${params.toString()}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to fetch reviews');
    }
    return response.json();
  }

  async createReview(reviewData) {
    this.clearCache();
    const response = await fetch('/api/reviews', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to create review');
    }
    return response.json();
  }

  async updateReview(reviewId, reviewData) {
    this.clearCache();
    const response = await fetch(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to update review');
    }
    return response.json();
  }

  async deleteReview(reviewId) {
    this.clearCache();
    const response = await fetch(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to delete review');
    }
    return response.json();
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

// React hooks for API calls
import { useState, useEffect, useMemo, useCallback } from 'react';

export const useProducts = (filters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiService.getProducts(filters);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filtersString, filters]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getProducts(filters);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};

// Cart hooks
export const useCart = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getCart();
      // Extract cart items from API response (which has structure { success: true, data: [...] })
      const cartItems = Array.isArray(result) ? result : (result?.data || []);
      setData(cartItems);
    } catch (err) {
      // Don't set error for unauthorized - just return empty array
      if (err.message === 'UNAUTHORIZED' || err.message.includes('401')) {
        setData([]);
        setError(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Expose a method to manually refresh cart (for when items are added)
  const refreshCart = async () => {
    await fetchCart();
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      await apiService.addToCart(productId, quantity);
      await fetchCart(); // Refresh cart
    } catch (err) {
      // Re-throw to let calling component handle redirect
      throw err;
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      await apiService.updateCartItem(itemId, quantity);
      await fetchCart(); // Refresh cart
    } catch (err) {
      throw err;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await apiService.removeFromCart(itemId);
      await fetchCart(); // Refresh cart
    } catch (err) {
      setError(err.message);
    }
  };

  const clearCart = async () => {
    try {
      await apiService.clearCart();
      await fetchCart(); // Refresh cart
    } catch (err) {
      setError(err.message);
    }
  };

  // Ensure data is always an array
  const cartItems = Array.isArray(data) ? data : [];
  
  return { 
    data: cartItems,
    loading, 
    error, 
    refetch: fetchCart,
    refreshCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
  };
};

// Wishlist hooks
export const useWishlist = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getWishlist();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const addToWishlist = async (productId) => {
    try {
      await apiService.addToWishlist(productId);
      await fetchWishlist(); // Refresh wishlist
    } catch (err) {
      setError(err.message);
    }
  };

  const removeFromWishlist = async (itemId) => {
    try {
      await apiService.removeFromWishlist(itemId);
      await fetchWishlist(); // Refresh wishlist
    } catch (err) {
      setError(err.message);
    }
  };

  const clearWishlist = async () => {
    try {
      await apiService.clearWishlist();
      await fetchWishlist(); // Refresh wishlist
    } catch (err) {
      setError(err.message);
    }
  };

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist
  };
};

// Reviews hooks
export const useReviews = (productId, limit = 10) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(
    async (offset = 0) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiService.getReviews(productId, limit, offset);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [productId, limit]
  );

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId, limit, fetchReviews]);

  const createReview = async (reviewData) => {
    try {
      await apiService.createReview(reviewData);
      await fetchReviews(); // Refresh reviews
    } catch (err) {
      setError(err.message);
    }
  };

  const updateReview = async (reviewId, reviewData) => {
    try {
      await apiService.updateReview(reviewId, reviewData);
      await fetchReviews(); // Refresh reviews
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await apiService.deleteReview(reviewId);
      await fetchReviews(); // Refresh reviews
    } catch (err) {
      setError(err.message);
    }
  };

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchReviews,
    createReview,
    updateReview,
    deleteReview
  };
};

export const useProduct = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiService.getProduct(id);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { data, loading, error };
};

export const useCategories = (filters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiService.getCategories(filters);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [filtersString, filters]);

  return { data, loading, error };
};

export const useBrands = (filters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiService.getBrands(filters);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, [filtersString, filters]);

  return { data, loading, error };
};

export const useOrders = (filters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getOrders(filters);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { data, loading, error };
};

export const useUsers = (filters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getUsers(filters);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { data, loading, error, refetch: fetchUsers };
};

export const useAdminStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getAdminStats();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
};

export const useCoupons = (filters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getCoupons(filters);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  return { data, loading, error, refetch: fetchCoupons };
};

export const useAllReviews = (filters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getAllReviews(filters);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { data, loading, error, refetch: fetchReviews };
};
