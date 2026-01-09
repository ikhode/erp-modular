import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, Receipt } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

const POS: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');

  const products: Product[] = [
    { id: '1', name: 'Coco Rallado 500g', price: 35.00, category: 'rallado' },
    { id: '2', name: 'Coco Rallado 1kg', price: 65.00, category: 'rallado' },
    { id: '3', name: 'Coco Deshidratado 250g', price: 45.00, category: 'deshidratado' },
    { id: '4', name: 'Coco Deshidratado 500g', price: 85.00, category: 'deshidratado' },
    { id: '5', name: 'Aceite de Coco 250ml', price: 120.00, category: 'aceite' },
    { id: '6', name: 'Aceite de Coco 500ml', price: 220.00, category: 'aceite' },
    { id: '7', name: 'Leche de Coco 400ml', price: 28.00, category: 'leche' },
    { id: '8', name: 'Agua de Coco 500ml', price: 18.00, category: 'bebida' },
  ];

  const categories = [
    { value: 'todos', label: 'Todos' },
    { value: 'rallado', label: 'Coco Rallado' },
    { value: 'deshidratado', label: 'Deshidratado' },
    { value: 'aceite', label: 'Aceite' },
    { value: 'leche', label: 'Leche' },
    { value: 'bebida', label: 'Bebidas' },
  ];

  const filteredProducts = selectedCategory === 'todos' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    
    const total = getTotal();
    const ticketNumber = Math.floor(Math.random() * 10000);
    
    alert(`Venta procesada exitosamente!\nTicket: ${ticketNumber}\nTotal: $${total.toFixed(2)}\nMétodo: ${paymentMethod}`);
    setCart([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Terminal de Caja</h1>
        <div className="text-sm text-gray-500">
          Caja 1 - Sesión: {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Filter */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => addToCart(product)}
              >
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-2xl font-bold text-blue-600">${product.price.toFixed(2)}</p>
                  <button className="mt-2 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1">
                    <Plus className="h-4 w-4" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          {/* Cart Items */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Carrito ({cart.length} items)
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Carrito vacío</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">${item.price.toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-gray-500 hover:text-red-600"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-gray-500 hover:text-green-600"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-gray-500 hover:text-red-600 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pago</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${getTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {paymentMethod === 'efectivo' ? <DollarSign className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                <span>Procesar Venta</span>
              </button>

              <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                <Receipt className="h-4 w-4" />
                <span>Imprimir Ticket</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;