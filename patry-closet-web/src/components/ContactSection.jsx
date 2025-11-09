import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Carousel from 'infinite-react-carousel';
import { FaFacebook, FaInstagram, FaTwitter, FaCcVisa, FaCcMastercard, FaCcPaypal, FaCcApplePay } from 'react-icons/fa';

// Mock para posts de blog (extiende con API real)
const mockBlogPosts = [
    { id: 1, title: 'Tendencias de Moda Otoño 2025', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=500&q=80', excerpt: 'Descubre las últimas tendencias en colores y estilos.' },
    { id: 2, title: 'Guía de Estilos para Eventos', image: 'https://images.unsplash.com/photo-1529139574466-a303d20ff24f?auto=format&fit=crop&w=500&q=80', excerpt: 'Consejos para vestirte en bodas y fiestas.' },
    { id: 3, title: 'Sostenibilidad en la Moda', image: 'https://images.unsplash.com/photo-1520974735194-8d95cdf6d2ef?auto=format&fit=crop&w=500&q=80', excerpt: 'Cómo Patry Closet promueve la moda eco-friendly.' },
];

const ContactSection = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Nombre requerido';
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email válido requerido';
        if (!formData.message) newErrors.message = 'Mensaje requerido';
        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        // Mock submit (integra con API real aquí)
        console.log('Formulario enviado:', formData);
        setSubmitted(true);
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <section
            className="py-20 bg-cover bg-center relative"
            style={{ backgroundImage: "url('https://static.vecteezy.com/system/resources/thumbnails/032/936/961/small/elegant-clothing-collection-in-modern-boutique-store-free-photo.jpg')" }}
        >
            <div className="absolute inset-0 bg-black opacity-50"></div> {/* Overlay para legibilidad */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.h2
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-4xl font-bold text-center mb-16 text-white"
                >
                    Contáctanos y Descubre Más
                </motion.h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    {/* Formulario de Contacto */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="bg-white p-8 rounded-xl shadow-2xl"
                    >
                        <h3 className="text-2xl font-semibold mb-6 text-gray-800">Envíanos un Mensaje</h3>
                        {submitted && <p className="text-green-600 mb-4">¡Mensaje enviado con éxito!</p>}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Nombre</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600 ${errors.name ? 'border-red-500' : ''}`}
                                />
                                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600 ${errors.email ? 'border-red-500' : ''}`}
                                />
                                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Mensaje</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600 ${errors.message ? 'border-red-500' : ''}`}
                                    rows="4"
                                />
                                {errors.message && <p className="text-red-500 text-sm">{errors.message}</p>}
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                            >
                                <Send className="w-5 h-5 mr-2" /> Enviar
                            </button>
                        </form>
                    </motion.div>

                    {/* Información de la Tienda y Mapa */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="bg-white p-8 rounded-xl shadow-2xl">
                            <h3 className="text-2xl font-semibold mb-6 text-gray-800">Información de Contacto</h3>
                            <div className="space-y-4 text-gray-700">
                                <p className="flex items-center"><MapPin className="w-5 h-5 mr-2 text-blue-600" /> Calle Gran Vía 123, Madrid, España</p>
                                <p className="flex items-center"><Phone className="w-5 h-5 mr-2 text-blue-600" /> +34 912 345 678</p>
                                <p className="flex items-center"><Mail className="w-5 h-5 mr-2 text-blue-600" /> info@patrycloset.com</p>
                                <p>Horario: Lunes a Sábado, 10:00 - 20:00</p>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-2xl overflow-hidden">
                            <h3 className="text-2xl font-semibold mb-6 text-gray-800">Nuestra Ubicación</h3>
                            <motion.iframe
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.5 }}
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3037.347!2d-3.703790!3d40.416775!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd42287d0f0f1b4f%3A0x9a5d8ab1b4b1b4b!2sGran%20V%C3%ADa%2C%20Madrid%2C%20Spain!5e0!3m2!1sen!2sus!4v1699999999999"
                                width="100%"
                                height="300"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                className="rounded-lg"
                            ></motion.iframe>
                        </div>
                    </motion.div>
                </div>

                {/* Sección Avanzada: Métodos de Pago, Blog, Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Métodos de Pago */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="bg-white p-8 rounded-xl shadow-2xl text-center"
                    >
                        <h3 className="text-2xl font-semibold mb-6 text-gray-800">Métodos de Pago Seguros</h3>
                        <div className="flex justify-center space-x-6 text-4xl text-gray-700">
                            <FaCcVisa className="hover:text-blue-600 transition" />
                            <FaCcMastercard className="hover:text-blue-600 transition" />
                            <FaCcPaypal className="hover:text-blue-600 transition" />
                            <FaCcApplePay className="hover:text-blue-600 transition" />
                        </div>
                    </motion.div>

                    {/* Blog Teaser */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="bg-white p-8 rounded-xl shadow-2xl"
                    >
                        <h3 className="text-2xl font-semibold mb-6 text-gray-800">Nuestro Blog</h3>
                        <Carousel slidesToShow={1} arrows autoplay autoplaySpeed={3000}>
                            {mockBlogPosts.map(post => (
                                <div key={post.id} className="text-center">
                                    <img src={post.image} alt={post.title} className="w-full h-48 object-cover rounded-lg mb-4" />
                                    <h4 className="text-lg font-semibold">{post.title}</h4>
                                    <p className="text-gray-600">{post.excerpt}</p>
                                    <a href="/blog" className="text-blue-600 hover:underline">Leer Más</a>
                                </div>
                            ))}
                        </Carousel>
                    </motion.div>

                    {/* Links y Redes Sociales */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="bg-white p-8 rounded-xl shadow-2xl text-center"
                    >
                        <h3 className="text-2xl font-semibold mb-6 text-gray-800">Síguenos y Más</h3>
                        <div className="flex justify-center space-x-6 text-4xl text-gray-700 mb-4">
                            <a href="https://instagram.com" aria-label="Instagram"><FaInstagram className="hover:text-blue-600 transition" /></a>
                            <a href="https://facebook.com" aria-label="Facebook"><FaFacebook className="hover:text-blue-600 transition" /></a>
                            <a href="https://twitter.com" aria-label="Twitter"><FaTwitter className="hover:text-blue-600 transition" /></a>
                        </div>
                        <div className="space-y-2">
                            <a href="/blog" className="block text-blue-600 hover:underline">Blog</a>
                            <a href="/privacy" className="block text-blue-600 hover:underline">Política de Privacidad</a>
                            <a href="/terms" className="block text-blue-600 hover:underline">Términos de Servicio</a>
                            <a href="/faq" className="block text-blue-600 hover:underline">FAQ</a>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;