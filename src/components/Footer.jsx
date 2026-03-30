import { MapPin, Phone, Heart, ArrowRight, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSettingsStore } from '../store/useSettingsStore'
import bakeryData from '../data/bakeryData.json'

// Custom SVGs for better reliability with brand colors
const WhatsAppIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
)

const FacebookIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
)

const InstagramIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
)

export default function Footer() {
  const settings = useSettingsStore(s => s.settings) || bakeryData

  const SOCIAL_LINKS = [
    { 
      name: 'WhatsApp', 
      icon: WhatsAppIcon, 
      url: `https://wa.me/${settings.whatsapp}`, 
      color: 'hover:bg-green-500', 
      textColor: 'text-green-600' 
    },
    { 
      name: 'Facebook', 
      icon: FacebookIcon, 
      url: settings.social.facebook, 
      color: 'hover:bg-blue-600', 
      textColor: 'text-blue-600' 
    },
    { 
      name: 'Instagram', 
      icon: InstagramIcon, 
      url: settings.social.instagram, 
      color: 'hover:bg-pink-600', 
      textColor: 'text-pink-600' 
    },
    { 
      name: 'JustDial', 
      icon: ExternalLink, 
      url: settings.social.justdial, 
      color: 'hover:bg-blue-700', 
      textColor: 'text-blue-500' 
    },
  ]
  return (
    <footer className="bg-white border-t border-orange-100 pt-16 pb-8 mt-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-orange-100 group-hover:scale-110 transition-transform duration-500">
                {settings.logoEmoji || '🧁'}
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                {settings.name}
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed font-medium">
              {settings.description}
            </p>
            <div className="flex gap-4">
              {SOCIAL_LINKS.map((social) => (
                <a 
                  key={social.name} 
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 ${social.textColor} ${social.color} hover:text-white transition-all duration-300 transform hover:-translate-y-1`}
                  title={social.name}
                >
                  <social.icon size={20} />
                </a>
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
                  <p className="text-xs font-bold text-gray-700 leading-tight mt-0.5">{settings.address || settings.location?.full}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <Phone className="text-orange-500" size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Call Now</p>
                  <p className="text-xs font-bold text-gray-700 leading-tight mt-0.5">{settings.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Find Our Shop</h3>
            <div className="rounded-2xl overflow-hidden border border-orange-100 shadow-sm aspect-square relative group bg-gray-50">
              <iframe 
                src={settings?.location?.embedUrl || bakeryData.location.embedUrl}
                width="100%" 
                height="100%" 
                style={{ border: 0, filter: 'grayscale(0) contrast(1.1) brightness(1.1)' }} 
                allowFullScreen="" 
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Bakery Location"
                className="transition-all duration-1000 scale-105 group-hover:scale-100"
              ></iframe>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} {settings.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span>Made with</span>
              <Heart size={12} className="text-red-400 fill-red-400 animate-pulse" />
              <span>for {settings.city || 'Jashpur'}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
