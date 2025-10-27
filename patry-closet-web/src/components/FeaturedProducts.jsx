const products = [
    { id: 1, name: 'Vestido Elegante', price: 59.99, image: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' },
    { id: 2, name: 'Camisa Moderna', price: 39.99, image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' },
    { id: 3, name: 'Pantalón Trendy', price: 49.99, image: 'https://images.unsplash.com/photo-1594633312681-86309903deb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' },
    { id: 4, name: 'Accesorio Chic', price: 19.99, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' },
    // Agrega más para llenar el grid
];

const FeaturedProducts = () => {
    return (
        <section className="py-16 bg-white"> {/* Fondo claro para modernidad */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Productos Destacados</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {products.map(product => (
                        <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 hover:shadow-2xl transition duration-300 ease-in-out">
                            <img src={product.image} alt={product.name} className="w-full h-80 object-cover" />
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                                <p className="text-lg text-gray-700 mb-4">${product.price.toFixed(2)}</p>
                                <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200">Añadir al Carrito</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;