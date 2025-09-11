import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CreditCard, Truck, Shield } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { productService } from '../services/api';

const Cart = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal, 
    getCartItemsCount 
  } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const item = cartItems.find(item => item.id === itemId);
    if (!item) return;

    try {
      // Verificar stock disponible
      const product = await productService.getById(itemId);
      if (newQuantity > product.stock) {
        alert(`Solo hay ${product.stock} unidades disponibles`);
        return;
      }
      
      updateQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Error al actualizar cantidad');
    }
  };

  const handleRemoveItem = (itemId) => {
    if (window.confirm('¿Estás seguro de que querés eliminar este producto del carrito?')) {
      removeFromCart(itemId);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('¿Estás seguro de que querés vaciar todo el carrito?')) {
      clearCart();
    }
  };

  const validateStock = async () => {
    try {
      for (const item of cartItems) {
        const product = await productService.getById(item.id);
        if (product.stock < item.quantity) {
          throw new Error(`No hay suficiente stock de "${item.nombre}". Stock disponible: ${product.stock}`);
        }
      }
      return true;
    } catch (error) {
      setCheckoutError(error.message);
      return false;
    }
  };

  const updateProductStock = async (productId, quantityToSubtract) => {
    try {
      const product = await productService.getById(productId);
      const newStock = product.stock - quantityToSubtract;
      
      await productService.update(productId, {
        ...product,
        stock: Math.max(0, newStock)
      });
      
      return true;
    } catch (error) {
      console.error(`Error updating stock for product ${productId}:`, error);
      return false;
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      // 1. Validar stock
      const stockValid = await validateStock();
      if (!stockValid) {
        setIsCheckingOut(false);
        return;
      }

      // 2. Crear orden (simulada)
      const order = {
        id: Date.now(),
        userId: user.id,
        items: cartItems.map(item => ({
          productId: item.id,
          nombre: item.nombre,
          precio: item.precio,
          quantity: item.quantity,
          subtotal: item.precio * item.quantity
        })),
        total: getCartTotal(),
        fecha: new Date().toISOString(),
        estado: 'confirmada'
      };

      // 3. Descontar stock de cada producto
      for (const item of cartItems) {
        const stockUpdated = await updateProductStock(item.id, item.quantity);
        if (!stockUpdated) {
          throw new Error(`Error al actualizar stock de ${item.nombre}`);
        }
      }

      // 4. Limpiar carrito
      clearCart();

      // 5. Mostrar mensaje de éxito y redirigir
      alert(`¡Compra realizada con éxito! 
Total: ${formatPrice(order.total)}
Número de orden: ${order.id}

Los productos se descontaron del stock.`);
      
      navigate('/', { replace: true });

    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(error.message || 'Error al procesar la compra');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">
                Carrito de compras
              </h1>
              <Link
                to="/"
                className="flex items-center text-ml-blue hover:text-blue-700"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Seguir comprando
              </Link>
            </div>
          </div>

          {/* Carrito vacío */}
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Tu carrito está vacío
            </h2>
            <p className="text-gray-600 mb-8">
              ¡Agregá productos y comenzá a comprar!
            </p>
            <Link
              to="/"
              className="inline-flex items-center bg-ml-blue text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
            >
              Explorar productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const shipping = subtotal > 50000 ? 0 : 5000; // Envío gratis para compras > $50.000
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Carrito de compras
              </h1>
              <p className="text-gray-600 mt-1">
                {getCartItemsCount()} producto{getCartItemsCount() !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleClearCart}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Vaciar carrito
              </button>
              <Link
                to="/"
                className="flex items-center text-ml-blue hover:text-blue-700"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Seguir comprando
              </Link>
            </div>
          </div>
        </div>

        {/* Error de checkout */}
        {checkoutError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error en el checkout
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  {checkoutError}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de productos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {cartItems.map((item, index) => (
                <div key={item.id} className={`p-6 ${index !== cartItems.length - 1 ? 'border-b border-gray-200' : ''}`}>
                  <div className="flex items-center">
                    {/* Imagen del producto */}
                    <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden bg-gray-100">
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100x100?text=Imagen+no+disponible';
                        }}
                      />
                    </div>

                    {/* Información del producto */}
                    <div className="ml-6 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            <Link 
                              to={`/product/${item.id}`}
                              className="hover:text-ml-blue"
                            >
                              {item.nombre}
                            </Link>
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.categoria || 'Sin categoría'}
                          </p>
                          <p className="text-lg font-semibold text-gray-900 mt-2">
                            {formatPrice(item.precio)}
                          </p>
                        </div>

                        {/* Controles de cantidad */}
                        <div className="flex items-center ml-6">
                          <div className="flex items-center border border-gray-300 rounded-md">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 border-x border-gray-300 text-center min-w-[60px]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="px-3 py-2 text-gray-600 hover:text-gray-800"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="ml-4 p-2 text-red-600 hover:text-red-700"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Subtotal: {formatPrice(item.precio * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen de compra */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Resumen de compra
              </h2>

              {/* Desglose de precios */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío:</span>
                  <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                    {shipping === 0 ? 'Gratis' : formatPrice(shipping)}
                  </span>
                </div>
                {shipping === 0 && (
                  <p className="text-sm text-green-600">
                    ¡Envío gratis por compra superior a $50.000!
                  </p>
                )}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Beneficios */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Truck className="w-4 h-4 mr-2 text-green-600" />
                  Envío a domicilio
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="w-4 h-4 mr-2 text-blue-600" />
                  Compra protegida
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CreditCard className="w-4 h-4 mr-2 text-purple-600" />
                  Múltiples medios de pago
                </div>
              </div>

              {/* Botón de checkout */}
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || cartItems.length === 0}
                className="w-full bg-ml-blue text-white py-4 px-6 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isCheckingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Finalizar compra
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Al continuar, aceptás nuestros términos y condiciones
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
