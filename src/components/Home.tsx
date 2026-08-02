import React, { useState, useEffect } from "react";
import { brand } from "../config/brand";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Building2,
  Users,
  Award,
  TrendingUp,
  MapPin,
  Building,
  Phone,
  CheckCircle,
  Shield,
  Target,
  Hammer,
  Home as HomeIcon,
  BadgeCheck,
  Briefcase,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion, AnimatePresence } from "framer-motion";


interface HomeProps {
  navigateTo: (
    page: any,
    projectId?: string,
    clientId?: string,
    tab?: string,
    searchParams?: any,
  ) => void;
}

export function Home({ navigateTo }: HomeProps) {
  const propertyImage1 = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&auto=format";
  const propertyImage2 = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&auto=format";
  const propertyImage3 = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&auto=format";

  const [stats, setStats] = useState({
    total: 0,
    buyers: 0,
    sellers: 0,
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [propertyImage1, propertyImage2, propertyImage3];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-64143980/clients/stats`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch stats: ${errorText}`,
          );
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Professional Builder Focus */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
            }}
          ></div>
        </div>

        {/* Architectural Grid Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "linear-gradient(#16a34a 1px, transparent 1px), linear-gradient(90deg, #16a34a 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-white"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-full mb-6"
              >
                <BadgeCheck className="w-4 h-4 text-green-400" />
                <span className="text-sm tracking-wider text-green-300">
                  CERTIFIED REAL ESTATE DEVELOPERS
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl lg:text-6xl xl:text-7xl mb-6 leading-tight"
              >
                <span className="block text-white">
                  Building Your
                </span>
                <span className="block text-green-400">
                  Dream Future
                </span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <div className="h-1 w-20 bg-green-500 mb-6"></div>
                <p className="text-xl text-gray-300 leading-relaxed mb-4">
                  <strong className="text-white">
                    PINNACLE REALTY
                  </strong>{" "}
                  - Where construction expertise meets property
                  promotion excellence
                </p>
                <p className="text-lg text-gray-400 leading-relaxed">
                  With 15+ years of industry leadership, we
                  transform visions into reality through premium
                  construction, strategic site development, and
                  trusted property solutions across Australia's
                  most sought-after addresses.
                </p>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 h-14 text-lg group"
                  onClick={() => navigateTo("residential")}
                >
                  <Building className="w-5 h-5 mr-2" />
                  Explore Projects
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/10"
              >
                <div>
                  <div className="text-3xl text-green-400 mb-1">
                    250+
                  </div>
                  <div className="text-sm text-gray-400 uppercase tracking-wide">
                    Projects
                  </div>
                </div>
                <div>
                  <div className="text-3xl text-green-400 mb-1">
                    15+
                  </div>
                  <div className="text-sm text-gray-400 uppercase tracking-wide">
                    Years
                  </div>
                </div>
                <div>
                  <div className="text-3xl text-green-400 mb-1">
                    98%
                  </div>
                  <div className="text-sm text-gray-400 uppercase tracking-wide">
                    Satisfaction
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Feature Cards */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Carousel for Main Images */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[500px]">
                  {slides.map((slide, index) => (
                    <motion.div
                      key={index}
                      initial={false}
                      animate={{
                        opacity: currentSlide === index ? 1 : 0,
                        scale: currentSlide === index ? 1 : 1.1,
                      }}
                      transition={{ duration: 0.7, ease: "easeInOut" }}
                      className="absolute inset-0"
                      style={{ pointerEvents: currentSlide === index ? 'auto' : 'none' }}
                    >
                      <img
                        src={slide}
                        alt={`${brand.name} Property ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                    </motion.div>
                  ))}

                  {/* Navigation Arrows */}
                  <button
                    onClick={prevSlide}
                    className="absolute top-1/2 left-4 -translate-y-1/2 z-20 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute top-1/2 right-4 -translate-y-1/2 z-20 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Carousel Dots */}
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {slides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          currentSlide === index
                            ? 'bg-white w-8'
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Floating Info Card */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-xl z-10">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                        <Hammer className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg text-slate-900">
                          Construction Excellence
                        </h3>
                        <p className="text-sm text-slate-600">
                          Industry-leading quality
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Licensed | Award Winning</span>
                    </div>
                  </div>
                </div>

                {/* Floating Achievement Badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 1, type: "spring" }}
                  className="absolute -top-4 -right-4 bg-green-600 text-white rounded-full w-24 h-24 flex flex-col items-center justify-center shadow-2xl border-4 border-white z-20"
                >
                  <Star className="w-8 h-8 mb-1" />
                  <span className="text-xs uppercase tracking-wide">
                    Award
                  </span>
                  <span className="text-xs">Winning</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto">
            <path
              fill="#ffffff"
              d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Our Expertise Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl text-slate-900 mb-4">
              Our Core Expertise
            </h2>
            <div className="h-1 w-20 bg-green-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive real estate solutions combining
              construction mastery with strategic property
              development
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Hammer,
                title: "Construction",
                desc: "Premium quality construction with industry-leading standards",
                color: "from-green-500 to-emerald-600",
              },
              {
                icon: Building2,
                title: "Development",
                desc: "Strategic site development and project execution",
                color: "from-blue-500 to-cyan-600",
              },
              {
                icon: Shield,
                title: "Trust & Compliance",
                desc: "100% legal compliance and transparent transactions",
                color: "from-purple-500 to-pink-600",
              },
              {
                icon: Target,
                title: "Prime Locations",
                desc: "Properties in metropolitan prime addresses",
                color: "from-orange-500 to-red-600",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-t-4 border-transparent hover:border-green-600">
                  <CardContent className="p-8 text-center">
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                    >
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl text-slate-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl lg:text-5xl text-slate-900 mb-6">
                Welcome to{" "}
                <span className="text-green-600">
                  {brand.name}
                </span>
              </h2>
              <div className="h-1 w-20 bg-green-600 mb-8"></div>

              <div className="space-y-6 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  At{" "}
                  <strong className="text-slate-900">
                    {brand.name}
                  </strong>
                  , we believe in the transformative power of
                  finding the perfect home. Whether you're a
                  first-time buyer, seasoned investor, or
                  looking to sell your property, our team of
                  dedicated professionals is here to guide you
                  through every step of the real estate journey.
                </p>

                <p className="text-lg">
                  We understand the importance of investing your
                  hard-earned money in house & land. When it
                  comes to buying a property, a customer always
                  dreams of a lifestyle that is unconditional &
                  unrestricted.
                </p>

                <p className="text-lg">
                  We at {brand.name} are the most trusted plots
                  and real estate developers, bringing you
                  projects and properties in your favorite
                  metro's most prime & potential addresses. When
                  you purchase a property from us, we promise to
                  upgrade your next chapter in life.
                </p>

                <div className="bg-white border-l-4 border-green-600 p-6 rounded-r-lg shadow-md">
                  <p className="text-lg italic text-slate-800">
                    "From beachside villas on the Gold Coast to
                    inner-city apartments in Melbourne and Sydney
                    — we match every buyer with their perfect
                    Australian property."
                  </p>
                </div>

                <p className="text-lg">
                  <strong className="text-slate-900">
                    With combined expertise in construction and
                    site development
                  </strong>
                  , we are your one-stop solution for turning
                  your vision into reality and promoting it to
                  the world.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => navigateTo("about")}
                >
                  Learn More About Us
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="relative rounded-2xl overflow-hidden shadow-xl">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500"
                      alt="Construction Excellence"
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-4">
                      <span className="text-white text-sm">
                        Quality Construction
                      </span>
                    </div>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden shadow-xl">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1460317442991-0ec209397118?w=500"
                      alt="Happy Homeowners"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-4">
                      <span className="text-white text-sm">
                        Happy Homeowners
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-6 pt-12">
                  <div className="relative rounded-2xl overflow-hidden shadow-xl">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=500"
                      alt="Professional Team"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-4">
                      <span className="text-white text-sm">
                        Expert Team
                      </span>
                    </div>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden shadow-xl">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500"
                      alt="Modern Architecture"
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-4">
                      <span className="text-white text-sm">
                        Modern Design
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Element */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-green-600/10 rounded-full blur-3xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl mb-4">
              Why Choose {brand.name}
            </h2>
            <div className="h-1 w-20 bg-green-500 mx-auto mb-6"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Your trusted partner in building dreams and
              creating legacies
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Expert Team",
                desc: "Dedicated professionals with decades of combined experience in construction and real estate",
              },
              {
                icon: MapPin,
                title: "Prime Locations",
                desc: "Exclusive properties in metropolitan areas' most sought-after and potential addresses",
              },
              {
                icon: Award,
                title: "Excellence Standard",
                desc: "Award-winning quality, transparency, and customer satisfaction in every project",
              },
              {
                icon: BadgeCheck,
                title: "Trust & Transparency",
                desc: "100% legal compliance, nationally licensed, and transparent documentation process",
              },
              {
                icon: Briefcase,
                title: "End-to-End Solutions",
                desc: "From plot selection to final handover, we manage every aspect of your journey",
              },
              {
                icon: TrendingUp,
                title: "Investment Value",
                desc: "Properties strategically chosen for maximum appreciation and returns",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 h-full hover:bg-slate-800 transition-all duration-300 hover:border-green-600">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 bg-green-600/20 border border-green-600/30 rounded-lg flex items-center justify-center mb-6">
                      <item.icon className="w-7 h-7 text-green-400" />
                    </div>
                    <h3 className="text-xl text-white mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                value: "250+",
                label: "Projects Delivered",
                icon: Building2,
                color: "green",
              },
              {
                value: `${stats.total}+`,
                label: "Happy Clients",
                icon: Users,
                color: "blue",
              },
              {
                value: "15+",
                label: "Years Experience",
                icon: Award,
                color: "purple",
              },
              {
                value: "98%",
                label: "Satisfaction Rate",
                icon: TrendingUp,
                color: "orange",
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="text-center"
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 bg-${stat.color}-100 rounded-2xl mb-4`}
                >
                  <stat.icon
                    className={`h-8 w-8 text-${stat.color}-600`}
                  />
                </div>
                <div className="text-4xl text-slate-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Preview */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl text-slate-900 mb-4">
              Client Success Stories
            </h2>
            <div className="h-1 w-20 bg-green-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600">
              Hear from families we've helped achieve their
              property dreams
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {[
              {
                name: "James Whitfield",
                property: "Harborview Residences, Sydney",
                rating: 5,
                review:
                  `${brand.name} made buying our Sydney apartment completely stress-free. Responsive, honest, and guided us through every step. Couldn't be happier.`,
              },
              {
                name: "Sophie Nguyen",
                property: "Southbank Towers, Melbourne",
                rating: 5,
                review:
                  `As an investor I've dealt with many agencies — ${brand.name} stands out for transparency and market knowledge. Excellent rental yield from day one.`,
              },
              {
                name: "Emma Foster",
                property: "Kingston Foreshore, Canberra",
                rating: 5,
                review:
                  "Professional, transparent, and genuinely helpful. The team was always available and made the whole process smooth as a first-time buyer.",
              },
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map(
                        (_, i) => (
                          <Star
                            key={i}
                            className="w-5 h-5 text-yellow-400 fill-yellow-400"
                          />
                        ),
                      )}
                    </div>
                    <p className="text-gray-700 mb-6 italic leading-relaxed">
                      "{testimonial.review}"
                    </p>
                    <div className="border-t pt-4">
                      <div className="text-slate-900">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {testimonial.property}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Button
              onClick={() => navigateTo("testimonials")}
              variant="outline"
              size="lg"
              className="border-2 border-green-600 text-green-600 hover:bg-green-50"
            >
              View All Testimonials
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
        >
          <h2 className="text-4xl lg:text-5xl mb-6">
            Ready to Build Your Future?
          </h2>
          <p className="text-xl text-green-50 mb-10 leading-relaxed">
            Browse our exclusive collection of premium
            properties or connect with our construction experts
            to start your real estate journey today
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigateTo("residential")}
              className="bg-white text-green-700 hover:bg-gray-100 px-8 h-14 text-lg shadow-xl"
            >
              <Building className="w-5 h-5 mr-2" />
              Browse Projects
            </Button>
            <Button
              size="lg"
              onClick={() => navigateTo("seller")}
              className="bg-slate-900 text-white hover:bg-slate-800 px-8 h-14 text-lg shadow-xl"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Sell Your Property
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}