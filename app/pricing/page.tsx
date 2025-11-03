import Link from 'next/link'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon py-20">
      <div className="container mx-auto px-6">
        <h1 className="font-fredoka text-5xl text-coral text-center mb-4">
          Choose Your Plan
        </h1>
        <p className="font-nunito text-xl text-gray-700 text-center mb-12 max-w-2xl mx-auto">
          Create unlimited magical stories for your children
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="card text-center">
            <h3 className="font-fredoka text-3xl text-coral mb-4">Single Story</h3>
            <div className="mb-6">
              <span className="font-fredoka text-5xl text-gray-800">$1.99</span>
              <span className="font-nunito text-gray-600">/story</span>
            </div>
            <ul className="text-left space-y-3 mb-8 font-nunito">
              <li className="flex items-center">
                <span className="text-turquoise mr-2">✓</span>
                One custom story
              </li>
              <li className="flex items-center">
                <span className="text-turquoise mr-2">✓</span>
                AI-generated images
              </li>
              <li className="flex items-center">
                <span className="text-turquoise mr-2">✓</span>
                Audio narration
              </li>
              <li className="flex items-center">
                <span className="text-turquoise mr-2">✓</span>
                PDF/ePub export
              </li>
            </ul>
            <Link href="/api/checkout/single" className="btn-primary w-full block">
              Buy Now
            </Link>
          </div>

          <div className="card text-center border-4 border-turquoise relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-turquoise text-white px-4 py-1 rounded-full font-fredoka text-sm">
              POPULAR
            </div>
            <h3 className="font-fredoka text-3xl text-turquoise mb-4">Unlimited</h3>
            <div className="mb-6">
              <span className="font-fredoka text-5xl text-gray-800">$9.99</span>
              <span className="font-nunito text-gray-600">/month</span>
            </div>
            <ul className="text-left space-y-3 mb-8 font-nunito">
              <li className="flex items-center">
                <span className="text-turquoise mr-2">✓</span>
                Unlimited stories
              </li>
              <li className="flex items-center">
                <span className="text-turquoise mr-2">✓</span>
                All premium features
              </li>
              <li className="flex items-center">
                <span className="text-turquoise mr-2">✓</span>
                Priority generation
              </li>
              <li className="flex items-center">
                <span className="text-turquoise mr-2">✓</span>
                Save all your stories
              </li>
            </ul>
            <Link href="/api/checkout/subscription" className="btn-secondary w-full block">
              Subscribe
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

