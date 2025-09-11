import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, TrendingUp, Star, Clock } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productService, categoryService } from '../services/api';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        
        // Cargar datos en paralelo
        const [productsResponse, categoriesResponse] = await Promise.all([
          productService.getAll({ limit: 12 }),
          categoryService.getActive()
        ]);

        // Ordenar productos alfabéticamente según consigna TPO
        const sortedProducts = productsResponse.sort((a, b) => 
          a.nombre.localeCompare(b.nombre)
        );

        setFeaturedProducts(sortedProducts);
        setCategories(categoriesResponse);
        
        // Filtrar productos con descuento para la sección de ofertas
        const productsWithDiscount = sortedProducts.filter(
          product => product.precioOriginal && product.precioOriginal > product.precio
        );
        setOffers(productsWithDiscount.slice(0, 6));

      } catch (err) {
        console.error('Error loading home data:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ml-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="ml-button-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner principal */}
      <section className="bg-gradient-to-r from-ml-blue to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Bienvenido a ML Marketplace
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Descubrí millones de productos con la mejor calidad y precios
            </p>
            <Link
              to="/categorias"
              className="inline-flex items-center bg-ml-yellow text-gray-900 px-8 py-3 rounded-md font-semibold hover:bg-yellow-300 transition-colors"
            >
              Explorar categorías
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categorías destacadas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Categorías populares
          </h2>
          <Link
            to="/categorias"
            className="text-ml-blue hover:text-blue-700 font-medium flex items-center"
          >
            Ver todas
            <ChevronRight className="ml-1 w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              to={`/categoria/${category.id}`}
              className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="text-center">
                <img
                  src={category.imagen}
                  alt={category.nombre}
                  className="w-16 h-16 mx-auto mb-3 object-cover rounded-lg group-hover:scale-105 transition-transform"
                />
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-ml-blue">
                  {category.nombre}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Ofertas del día */}
      {offers.length > 0 && (
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <TrendingUp className="w-6 h-6 text-ml-blue mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Ofertas del día
                </h2>
              </div>
              <Link
                to="/ofertas"
                className="text-ml-blue hover:text-blue-700 font-medium flex items-center"
              >
                Ver todas las ofertas
                <ChevronRight className="ml-1 w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {offers.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  className="h-full"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Productos destacados */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Star className="w-6 h-6 text-ml-blue mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">
              Productos destacados
            </h2>
          </div>
          <Link
            to="/productos"
            className="text-ml-blue hover:text-blue-700 font-medium flex items-center"
          >
            Ver todos
            <ChevronRight className="ml-1 w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 8).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              className="h-full"
            />
          ))}
        </div>
      </section>

      {/* Sección de beneficios */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              ¿Por qué elegir ML Marketplace?
            </h2>
            <p className="text-xl opacity-90">
              La mejor experiencia de compra online
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-ml-blue rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Mejores precios</h3>
              <p className="opacity-75">
                Comparamos precios para ofrecerte las mejores ofertas del mercado
              </p>
            </div>

            <div className="text-center">
              <div className="bg-ml-green rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Calidad garantizada</h3>
              <p className="opacity-75">
                Todos nuestros vendedores están verificados y los productos tienen garantía
              </p>
            </div>

            <div className="text-center">
              <div className="bg-ml-yellow rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-900" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Envío rápido</h3>
              <p className="opacity-75">
                Recibí tus productos en tiempo récord con nuestro sistema de envíos
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
