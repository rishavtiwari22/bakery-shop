import { MapPin, Phone, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-orange-100 pt-12 pb-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          
          {/* Brand & Contact */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white text-xl">
                🧁
              </div>
              <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                SweetBites
              </span>
            </div>
            <p className="text-gray-500 mb-6 max-w-sm">
              Crafting premium delights and artisanal breads fresh for you every single day.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-gray-600">
                <MapPin className="text-orange-500 mt-1" size={18} />
                <span className="text-sm">NavGurukul Jashpur Campus, Chhattisgarh</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="text-orange-500" size={18} />
                <span className="text-sm">+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="text-orange-500" size={18} />
                <span className="text-sm">hello@sweetbites.com</span>
              </div>
            </div>
          </div>

          {/* Map Embed */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Find Us Here</h3>
            <div className="rounded-2xl overflow-hidden border border-orange-100 shadow-sm h-64 w-full">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5618.859823836278!2d84.16777752426556!3d22.883512479483667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x398a67fe85537e61%3A0xcde76dde993fd6f7!2sNavGurukul%20Jashpur%20Campus!5e1!3m2!1sen!2sin!4v1774617156305!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} SweetBites Bakery. Made with ❤️ for Jashpur.
          </p>
        </div>
      </div>
    </footer>
  )
}
