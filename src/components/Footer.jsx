import { MapPin, Phone, Mail, Heart, ArrowRight, ShoppingBag, Info, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-orange-100 pt-16 pb-8 mt-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-orange-100 group-hover:scale-110 transition-transform duration-500">
                🧁
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                SweetBites
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed font-medium">
              Crafting premium delights and artisanal breads fresh for you every single day. Taste the passion in every bite.
            </p>
            <div className="flex gap-4">
              {[Globe, ShoppingBag, Info].map((Icon, i) => (
                <button key={i} className="w-9 h-9 flex items-center justify-center rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-300">
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Explore</h3>
            <ul className="space-y-4">
              {['Catalog', 'Special Offers', 'Our Story', 'Process'].map((item) => (
                <li key={item}>
                  <Link to="/" className="text-sm font-bold text-gray-600 hover:text-orange-500 flex items-center gap-2 group transition-colors">
                    <ArrowRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Connect</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <MapPin className="text-orange-500" size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Visit Us</p>
                  <p className="text-xs font-bold text-gray-700 leading-tight mt-0.5">NavGurukul Campus, Jashpur, Chhattisgarh</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <Phone className="text-orange-500" size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Call Now</p>
                  <p className="text-xs font-bold text-gray-700 leading-tight mt-0.5">+91 93366 48747</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Find Our Shop</h3>
            <div className="rounded-2xl overflow-hidden border border-orange-100 shadow-sm aspect-[4/3] relative group bg-gray-50">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5618.859823836278!2d84.16777752426556!3d22.883512479483667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x398a67fe85537e61%3A0xcde76dde993fd6f7!2sNavGurukul%20Jashpur%20Campus!5e1!3m2!1sen!2sin!4v1774617156305!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy"
                className="grayscale hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
              ></iframe>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} SweetBites Bakery. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span>Made with</span>
              <Heart size={12} className="text-red-400 fill-red-400 animate-pulse" />
              <span>for Jashpur</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
