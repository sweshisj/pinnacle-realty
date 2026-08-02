import React, { useState } from "react";
import { brand } from "../config/brand";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Home,
  TrendingUp,
  Shield,
  Building2,
  Wrench,
  DollarSign,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EliteNRIEnquiryForm } from "./EliteNRIEnquiryForm";

interface EliteNRIProps {
  navigateTo: (page: any) => void;
  searchParams?: any;
}

export function EliteNRI({ navigateTo }: EliteNRIProps) {
  const services = [
    {
      icon: Home,
      title: "Buy Land & Properties",
      description:
        "Verified, Approved, and Handpicked locations in prime Australian suburbs.",
    },
    {
      icon: TrendingUp,
      title: "Sell Land & Properties",
      description:
        "End-to-end Resale Support with Complete Documentation.",
    },
    {
      icon: Building2,
      title: "Property Management",
      description:
        "Tenant screening, rent collection, periodic inspections, and property value optimization",
    },
    {
      icon: Shield,
      title: "Legal Support with Background Verification",
      description:
        "Every property undergoes Elite background and legal verification with LEGAL CARPET",
    },
    {
      icon: Wrench,
      title: "Construction & Interiors",
      description:
        "Premium design, timely delivery, transparent execution.",
    },
    {
      icon: DollarSign,
      title: "Serviced Apartment",
      description:
        "We help NRIs earn steady income by turning their homes into serviced apartments",
    },
  ];

  const challenges = [
    {
      challenge: "Lack of trusted local support",
      solution:
        "Dedicated Relationship Manager who represents you in Australia",
    },
    {
      challenge: "Fear of property fraud or fake titles",
      solution:
        "Every property undergoes elite background and legal verification with Legal Carpet",
    },
    {
      challenge: "Difficulty managing properties remotely",
      solution:
        "One-click access to your property's complete status",
    },
    {
      challenge: "Lack of time during Australia visits",
      solution:
        "End-to-End coordination — we provide pre requisite checklist for NRI people for their seamless process.",
    },
    {
      challenge: "No post-sale support",
      solution:
        "Continuous client care even after handover — resale, rentals, or maintenance covered.",
    },
    {
      challenge: "Hard to find premium & safe locations",
      solution:
        "Exclusive market analysis will be provided and suggestions will be shared.",
    },
    {
      challenge: "Poor maintenance of unoccupied homes",
      solution:
        "Full property management — cleaning, EB, water, and upkeep handled monthly.",
    },
    {
      challenge: "Lack of market insights",
      solution:
        "Data-driven reports on local trends, pricing, and future appreciation potential.",
    },
    {
      challenge: "Property encroachment or misuse",
      solution:
        "Periodic site inspections and monitoring to ensure your land remains safe and protected.",
    },
    {
      challenge:
        "Managing multiple vendors (contractor, builder, agent)",
      solution:
        `One single point of contact — ${brand.name} Elite manages all stakeholders for you.`,
    },
  ];

  const testimonials = [
    {
      name: "Mrs. Yamini Ramesh Babu",
      designation: "IT Professional, USA",
      text: `Customer satisfaction was their top priority, and they maintained transparency and trustworthiness throughout. After approaching ${brand.name}, we felt confident in our decision.`,
    },
    {
      name: "Mr. Venkatesh Babu",
      designation: "IT Professional, USA",
      text: `${brand.name} communication was always clear, respectful, and professional. They keep us updated daily with the ongoing work, making the entire process seamless`,
    },
    {
      name: "Mr. Iyappan",
      designation: "Program Manager, USA",
      text: `My experience with ${brand.name} and their team was exceptional. From selling my property to purchasing a new one, everything was handled seamlessly and professionally.`,
    },
    {
      name: "Cpt. Harish Venkatesh",
      designation: "Naval Officer, Singapore",
      text: `After experiencing ${brand.name}'s service, we decided to purchase a house through them. We had trust in ${brand.name}, which enabled us to buy our dream house with confidence.`,
    },
    {
      name: "Mr. Zubair",
      designation: "Qatar",
      text: `Outstanding service and support. ${brand.name} made my property investment journey smooth and worry-free.`,
    },
    {
      name: "Mr. Aandigiri",
      designation: "Shop Square IT CEO, Canada",
      text: `Professional, transparent, and trustworthy. ${brand.name} exceeded all my expectations in helping me invest in Australia.`,
    },
  ];

  const whyChooseUs = [
    "End-to-end property lifecycle support",
    "100% Background Verification with legal Advice",
    "Transparent communication & digital updates",
    "On-ground team you can trust",
    "Personalised relationship manager",
    "Complete post-sale service",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Hero Section */}
      <section className="relative h-[700px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="NRI Investment"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/70 via-orange-900/70 to-yellow-900/70"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto"
        >
          <Badge className="mb-4 bg-amber-600 text-white px-6 py-2 text-lg">
            Exclusive for NRI's
          </Badge>
          <h1 className="mb-8 text-white">
            {brand.name} Elite
          </h1>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border-2 border-white/20 mb-8">
            <p className="text-lg md:text-xl leading-relaxed italic">
              "Having lived overseas for over a decade, I
              dreamed of building a home in Australia — a place
              filled with love and belonging. But every attempt
              to invest came with confusion — unclear documents,
              unreliable agents, and endless doubts. Calls went
              unanswered, paperwork was a maze, and hope often
              faded. Still, I persisted — learning, asking, and
              rebuilding my trust step by step. The day I
              finally stood before my own home, I knew it
              symbolized more than success — it was faith
              rewarded. That moment inspired {brand.name}
              Developers — born to bring trust, transparency,
              and clarity to real estate."
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="relative"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 border-4 border-white/30 shadow-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">AS</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
              </motion.div>
              <div className="text-left">
                <p>
                  <strong>- A. Sharma</strong>
                  <br />
                  Founder, {brand.name}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xl md:text-2xl">
            Because Distance Shouldn't Mean Doubt.
          </p>
        </motion.div>
      </section>

      {/* About Elite section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="mb-6 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {brand.name} Elite
            </h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              {brand.name} Elite is our dedicated arm for NRIs,
              simplifying property ownership across Australia.
              We combine on-ground expertise, legal assurance,
              and seamless digital access for worry-free
              investments. From identifying premium plots to
              managing and constructing properties, we handle
              every detail transparently. At {brand.name} Elite,
              we don't just help you buy property — we help you
              build a legacy in your homeland, backed by trust,
              clarity, and care.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Exclusive Services */}
      <section className="py-16 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="mb-4">
              Exclusive Services Provided to NRIs
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive solutions for all your property
              needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full hover:shadow-xl transition-all border-2 border-transparent hover:border-amber-200">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mb-4">
                      <service.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl mb-3">
                      {service.title}
                    </h3>
                    <p className="text-gray-600">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Contact Form */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="mb-4">Contact Us</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Fill out the form below to get in touch with our
              dedicated NRI relationship manager.
            </p>
          </motion.div>

          <EliteNRIEnquiryForm />
        </div>
      </section>
      {/* NRI Challenges vs Solutions */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="mb-4">
              NRI Challenges & {brand.name} Elite Solutions
            </h2>
            <p className="text-xl text-gray-600">
              We understand your concerns and have solutions for
              every challenge
            </p>
          </motion.div>

          <div className="space-y-4">
            {challenges.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-red-600">
                            ⚠️
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Challenge
                          </p>
                          <p className="text-gray-700">
                            {item.challenge}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Our Solution
                          </p>
                          <p className="text-gray-700">
                            {item.solution}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Client Testimonials */}
      <section className="py-16 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="mb-4">Client Testimonials</h2>
            <p className="text-xl text-gray-600">
              Hear from NRIs who trusted us with their property
              investments
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className="text-yellow-400 text-xl"
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-600 mb-6 italic">
                      "{testimonial.text}"
                    </p>
                    <div className="border-t pt-4">
                      <p>{testimonial.name}</p>
                      <p className="text-sm text-gray-500">
                        {testimonial.designation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why NRIs Choose Us */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="mb-4">Why NRIs Choose Us</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We understand the unique challenges NRIs face when
              investing from abroad — from Legal Complexities to
              property maintenance. That's why {brand.name}
              Elite provides one-stop Clarity, Comfort, and
              Confidence at every step.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {whyChooseUs.map((reason, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200"
              >
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <p className="text-gray-700">{reason}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-2xl mb-8 italic text-amber-600">
              Because Distance Shouldn't Mean Doubt.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h2 className="mb-6 text-white">
            Ready to Build Your Legacy in Australia?
          </h2>
          <p className="text-xl mb-8">
            Get in touch with our dedicated NRI relationship
            manager today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => navigateTo("seller")}
                className="bg-white text-amber-600 hover:bg-gray-100 shadow-xl"
                size="lg"
              >
                <Phone className="mr-2 h-5 w-5" />
                Contact Us
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => navigateTo("residential")}
                className="bg-white text-amber-600 hover:bg-gray-100 shadow-xl"
                size="lg"
              >
                <Home className="mr-2 h-5 w-5" />
                View Properties
              </Button>
            </motion.div>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6 text-left">
            <div className="flex items-start gap-3">
              <Phone className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="text-sm opacity-80">Call Us</p>
                <p>{brand.contact.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="text-sm opacity-80">Email Us</p>
                <p>{brand.contact.secondaryEmail}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="text-sm opacity-80">Visit Us</p>
                <p>{brand.contact.location}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}