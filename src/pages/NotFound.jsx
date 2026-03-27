import { Link } from 'react-router-dom'
import { ChefHat, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-orange-200 animate-bounce">
        <ChefHat size={40} />
      </div>
      <h1 className="text-6xl font-black text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
        404
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-md">
        Oops! It seems this treat is missing from our menu.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-200"
      >
        <ArrowLeft size={18} />
        Back to Catalog
      </Link>
    </div>
  )
}
