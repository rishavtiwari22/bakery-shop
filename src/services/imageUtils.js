/**
 * Optimizes a Cloudinary URL by adding auto-format and auto-quality parameters.
 * @param {string} url The original Cloudinary URL
 * @param {number} width Optional width for resizing
 * @returns {string} Optimized URL
 */
export const optimizeImage = (url, width) => {
  if (!url || !url.includes('cloudinary.com')) return url
  
  // Example: https://res.cloudinary.com/demo/image/upload/sample.jpg
  // Target: https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_500/sample.jpg
  
  const parts = url.split('/upload/')
  if (parts.length !== 2) return url
  
  const params = [`f_auto`, `q_auto`]
  if (width) params.push(`w_${width}`)
  
  return `${parts[0]}/upload/${params.join(',')}/${parts[1]}`
}
