import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Users, Zap, Clock, DollarSign, Target, CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <Brain className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">Pai</span>
        </div>
        <div className="hidden md:flex space-x-8">
          <Link href="#features" className="text-gray-600 hover:text-blue-600">Features</Link>
          <Link href="#how-it-works" className="text-gray-600 hover:text-blue-600">How It Works</Link>
          <Link href="#pricing" className="text-gray-600 hover:text-blue-600">Pricing</Link>
        </div>
        <div className="space-x-4">
          <Button variant="outline" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center py-20 px-6 max-w-6xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
          Next-Generation
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
            Market Research
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Turn real people into rich, queryable digital personas. Get instant, nuanced consumer insights without the delays and limitations of traditional surveys.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/demo">Start Free Trial <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="#how-it-works">See How It Works</Link>
          </Button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Traditional Market Research is Broken</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Recall-based surveys are expensive, slow, fraudulent, and suffer from low attention spans.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <DollarSign className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <CardTitle className="text-red-500">Expensive</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">$50k - $200k for a 1,000-person custom study</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Clock className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <CardTitle className="text-red-500">Slow</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">12-18 weeks to final insights. Your market moved months ago.</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Target className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <CardTitle className="text-red-500">Fraudulent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">15-30% of respondents are bots or click-farmers</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <CardTitle className="text-red-500">Low Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">25-45% of humans fail basic checks</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="features" className="py-20 px-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Pai Solves This</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            AI-driven digital twins built from real people with connected financial data, personality insights, and deep qualitative interviews.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <DollarSign className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-green-500">Low-Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Market research at a fraction of traditional costs</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Zap className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-green-500">Instant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Get insights in minutes, not months</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Target className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-green-500">Infinitely Queryable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Ask questions anytime across categories and demographics</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Brain className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-green-500">Perfect Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Each Pai is always "on" with no survey fatigue</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">How Pais Are Created</h2>
          
          <div className="space-y-8">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Sign-up</h3>
                <p className="text-gray-600">Users join the platform and provide basic demographic information (age, gender, location, income, etc.).</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Core Profile Build</h3>
                <p className="text-gray-600">Users take a personality test and answer questions about general behaviors and outlook on life. This defines their core persona.</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Category Opt-ins</h3>
                <p className="text-gray-600">Users choose categories (skincare, fitness, finance) for 15-30 minute deep dives exploring attitudes and behaviors.</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Ongoing Updates</h3>
                <p className="text-gray-600">Monthly 5-10 minute surveys across opted categories ensure data stays fresh and up-to-date.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Pricing Tiers</h2>
          <p className="text-xl text-gray-600 mb-12">Choose the plan that fits your research needs</p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>Perfect for small teams</CardDescription>
                <div className="text-3xl font-bold">$499/mo</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> 1,000 query tokens</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Access to Beauty panel</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Basic analytics</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-600 border-2">
              <CardHeader>
                <CardTitle>Professional</CardTitle>
                <CardDescription>Most popular for agencies</CardDescription>
                <div className="text-3xl font-bold">$1,999/mo</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> 5,000 query tokens</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> All category panels</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Advanced analytics</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Custom surveys</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>For large organizations</CardDescription>
                <div className="text-3xl font-bold">Custom</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Unlimited tokens</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Custom panels</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> White-label options</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Dedicated support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Market Research?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Join forward-thinking brands and agencies already using Pai to get instant, reliable consumer insights.
        </p>
        <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
          <Link href="/signup">Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" /></Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold">Pai</span>
            </div>
            <p className="text-gray-400">Next-generation market research platform</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="#features" className="hover:text-white">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/demo" className="hover:text-white">Demo</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
              <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
              <li><Link href="/api" className="hover:text-white">API</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; 2024 Pai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
