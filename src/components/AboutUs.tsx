import React, { useState, useEffect } from "react";
import { brand } from "../config/brand";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { motion } from "framer-motion";
import {
  Award,
  Users,
  Building2,
  TrendingUp,
  Target,
  Heart,
  Briefcase,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";


export function AboutUs() {
  // Use a static property background image
  const propertyBgImage = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=600&fit=crop";

  const reasons = [
    "Location - Ideal location with only 100-meter access to the main road and 300-meter access to the proposed metro station.",
    "Water - Absolutely no water logging as well as good source of groundwater. Separate connections for Panchayat water as well as bore water provision are available",
    "Architecture / Structural - Architect-designed apartment. Structural engineering is done by a Ph.D. scholar in structural engineering. He is also the HOD of the structural engineering dept at SRM university.",
    "Additional UDS Space - 47% UDS while the competitors offer only from 25% to 42%.",
    "Quality - Top quality materials in the market.",
    "Lift - 6 passengers can be accommodated in the 304 SS lift which has access to even stilt floor",
    "Common Space - Extra space for the tenants on each floor as well as on the top floor",
    "Steps - Double molded granite steps with 304-SS Handrail",
    "Provision for additional floors - Provision has been given for extending the floor to the next 2 floors (25mm Rods, extended pillar, 9\" Wall on the top floor)",
    "Door and Windows - All the doors including bathroom and bedroom doors are handmade rather than using flush doors with mirrors which is usually the case in general",
    "Woodwork - All the bedrooms and kitchen are completed with woodwork and ready to occupy",
    "Basic electric fittings - LED lights and ventilator, etc are already done",
    "Common Bathroom / Toilet - Common bathroom accessibility for the driver / Chauffer",
    "Meter Box - Electric meter box is completely copper rather than using a powder-coated one",
    "Security camera - Available for the entire building as well as for floor",
    "Rainwater harvesting - Completed 100% as it will save water even in the summer season",
    "Black water treatment - is done using 8 manholes with 5 ft width and 6 ft depth to avoid cleaning septic tanks often.",
    "Water Proofing - Special waterproofing treatment done for all bathrooms as well as the terrace",
    "Costly Tiles - All bathrooms are completely fixed with 2 X 4 KAG tiles",
    "Costly flooring Tiles - Flooring tiles are done with 2 X 4 KAG tiles",
    "Kitchen - Kitchen tops are molded with water-resistant threading, So no need to worry about dripping boundaries",
    "Terrace Floor - The terrace floor is fixed with KAG cooling tiles",
    "Paint - Full patty work is done for all the apartments and the painting is done with Asian primer exterior and interior from basic Ace offered by builders",
    "Additional capacity of Sump and Septic Tank - The sump (15.5K ltrs) is of high capacity and septic tank (12.5K)",
    "Post hand over support - Above all, you can be assured that this product is from a reliable and trusted hand."
  ];

  const coreValues = [
    {
      icon: Users,
      title: "Client-Centric Approach",
      description: "Your satisfaction is our priority. We take the time to understand your unique needs and tailor our services to exceed your expectations.",
      color: "green"
    },
    {
      icon: Target,
      title: "Local Expertise",
      description: "Our team has an in-depth knowledge of the local market trends, neighborhoods, and property values. This expertise enables us to provide valuable insights and strategic advice.",
      color: "blue"
    },
    {
      icon: Award,
      title: "Integrity and Transparency",
      description: "Trust is the foundation of any successful real estate transaction. We uphold the highest standards of integrity and transparency, ensuring that you are informed and confident throughout the process.",
      color: "purple"
    },
    {
      icon: Briefcase,
      title: "Innovation",
      description: "The real estate landscape is constantly evolving. We embrace innovation and leverage cutting-edge technology to stay ahead of the curve, ensuring that you have access to the best resources available.",
      color: "orange"
    },
    {
      icon: Heart,
      title: "Community Engagement",
      description: "We believe in giving back to the communities we serve. Through philanthropy and community engagement, we strive to make a positive impact beyond the realm of real estate.",
      color: "pink"
    }
  ];

  const projects = [
    { name: "Pinnacle Heights", subtitle: "Premium Residential Complex" },
    { name: "Pinnacle Commercial Park", subtitle: "Modern Office Spaces" },
    { name: "Pinnacle Greens", subtitle: "Eco-Friendly Villas" },
    { name: "Pinnacle Blossom", subtitle: "Plotted Development" }
  ];

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 }
  };

  const fadeInLeft = {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0 }
  };

  const fadeInRight = {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0 }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  };

  const bounceIn = {
    hidden: { opacity: 0, scale: 0.3 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring" as const,
        damping: 10,
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative h-96 flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <motion.div
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
          >
            <img
              src={propertyBgImage}
              alt={`About ${brand.name}`}
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-green-700/80"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4">
          <motion.h1 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl mb-4"
          >
            About {brand.name}
          </motion.h1>
          <motion.p 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl"
          >
            Where Construction Meets Promotion, and Excellence is Our Standard
          </motion.p>
        </div>
      </motion.section>

      {/* Welcome Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <motion.h2 
            variants={scaleIn}
            transition={{ duration: 0.8 }}
            className="text-4xl mb-6 text-green-600"
          >
            Welcome to {brand.name}
          </motion.h2>
          <div className="max-w-4xl mx-auto space-y-4 text-gray-700">
            {[
              `At ${brand.name}, we believe in the transformative power of finding the perfect home. Whether you're a first-time buyer, seasoned investor, or looking to sell your property, our team of dedicated professionals is here to guide you through every step of the real estate journey.`,
              "We understand the importance of investing your hard-earned money in the house & Land. When it comes to buying a property, always a customer dreams a lifestyle that is unconditional & unrestricted.",
              `We at ${brand.name} are one of Australia's most trusted property developers, bringing you projects across Melbourne, Sydney, Brisbane, Perth and beyond — in the nation's prime and fastest-growing addresses. When you purchase a property from us, we promise to upgrade your next chapter in life. From beachside villas to inner-city apartments and suburban land releases — we do it all at your convenience.`,
              `Welcome to ${brand.name}, where construction meets promotion, and excellence is our standard. With a combined expertise in construction and site development, we are your one-stop solution for turning your vision into reality and promoting it to the world.`
            ].map((text, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="text-lg"
              >
                {text}
              </motion.p>
            ))}
          </div>
        </motion.div>

        {/* Mission Statement */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={scaleIn}
          transition={{ duration: 0.8 }}
          className="mb-16 bg-gradient-to-br from-green-600 to-green-800 text-white rounded-2xl p-12 shadow-2xl"
        >
          <motion.h2 
            variants={bounceIn}
            className="text-3xl text-center mb-6"
          >
            🎯 Our Mission
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-center text-lg leading-relaxed max-w-4xl mx-auto"
          >
            At {brand.name}, our mission is clear: to construct outstanding properties and ensure they receive the recognition they deserve. We believe in building more than structures; we create opportunities, communities, and a brighter future for all. We are dedicated to delivering value that stands the test of time, both in the physical and digital realms. We are committed to creating a seamless and enjoyable experience for our clients, making the process of buying, selling, or investing in real estate a positive and rewarding venture.
          </motion.p>
        </motion.div>

        {/* Core Values */}
        <div className="mb-16">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-3xl text-center mb-12"
          >
            ✨ Our Core Values
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreValues.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={bounceIn}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotate: [0, -1, 1, -1, 0],
                    transition: { duration: 0.3 }
                  }}
                >
                  <Card className="hover:shadow-xl transition-shadow h-full">
                    <CardContent className="p-6">
                      <motion.div 
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className={`w-16 h-16 bg-${value.color}-100 rounded-lg flex items-center justify-center mb-4`}
                      >
                        <Icon className={`h-8 w-8 text-${value.color}-600`} />
                      </motion.div>
                      <h3 className="text-xl mb-3">{value.title}</h3>
                      <p className="text-gray-600">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Our Projects */}
        <div className="mb-16">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            transition={{ duration: 0.6 }}
            className="text-3xl text-center mb-6"
          >
            🏗️ Our Projects
          </motion.h2>
          <motion.h3 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xl text-center text-gray-600 mb-8"
          >
            Constructions and Promotions
          </motion.h3>
          <div className="max-w-3xl mx-auto mb-8">
            {[
              `${brand.name}, is one of the leading concern in Real Estate business creating opportunity of Investment and satisfactory service to our esteemed customers.`,
              "We deliver residential apartments, houses, and land estates across Australia's major cities and growth corridors. Every project carries full council approval, clear title, and transparent legal documentation for complete buyer confidence.",
              `All ${brand.name} apartments are delivered with premium finishes — stone benchtops, engineered timber flooring, quality appliances, and secure parking — move-in ready from day one.`
            ].map((text, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                className="text-gray-700 text-center mb-6"
              >
                {text}
              </motion.p>
            ))}
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardContent className="p-6 text-center">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Building2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="mb-2">{project.name}</h3>
                    <p className="text-sm text-gray-600">{project.subtitle}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Top 25 Reasons */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          transition={{ duration: 0.8 }}
          className="mb-16 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8 md:p-12"
        >
          <motion.h2 
            variants={scaleIn}
            className="text-3xl text-center mb-4"
          >
            🏆 Top 25 Reasons
          </motion.h2>
          <motion.h3 
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
            className="text-xl text-center text-gray-600 mb-8"
          >
            Why You Need to Choose {brand.name}
          </motion.h3>
          <motion.p 
            variants={fadeInUp}
            transition={{ delay: 0.3 }}
            className="text-center text-gray-700 mb-8 max-w-3xl mx-auto"
          >
            Though the rates are aligned with the market rate, you would get the below as a value addition while buying an apartment with {brand.name}
          </motion.p>
          
          <div className="grid md:grid-cols-2 gap-4 max-w-6xl mx-auto">
            {reasons.map((reason, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                whileHover={{ 
                  scale: 1.03,
                  backgroundColor: "#f0fdf4",
                  transition: { duration: 0.2 }
                }}
                className="flex gap-3 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 + 0.2, type: "spring" }}
                >
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                </motion.div>
                <p className="text-gray-700">
                  <span className="text-green-600">{index + 1}. </span>
                  {reason}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={scaleIn}
          transition={{ duration: 0.8 }}
          className="mb-16 bg-green-600 text-white rounded-lg p-8 md:p-12"
        >
          <motion.h2 
            variants={bounceIn}
            className="text-3xl text-center mb-12"
          >
            📊 {brand.name} by the Numbers
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "250+", label: "Projects Delivered" },
              { value: "10,000+", label: "Happy Families" },
              { value: "15+", label: "Years Experience" },
              { value: "5", label: "Cities Covered" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: index * 0.15, 
                  duration: 0.5,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.15,
                  rotate: [0, -5, 5, -5, 0],
                  transition: { duration: 0.5 }
                }}
                className="text-center"
              >
                <div className="text-4xl mb-2">{stat.value}</div>
                <div>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Leadership Team */}
        <div className="mb-16">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-3xl text-center mb-12"
          >
            👥 Our Leadership Team
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "A. Sharma", role: "Managing Director", image: null },
              { name: "R. Patel", role: "Co-Founder", image: null },
              { name: "S. Kumar", role: "Program Director", image: null },
              { name: "P. Nair", role: "Project Lead", image: null },
              { name: "M. Singh", role: "Project Coordinator", image: null },
              { name: "V. Mehta", role: "Digital Marketing Lead", image: null }
            ].map((leader, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={index % 2 === 0 ? fadeInLeft : fadeInRight}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -10 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-6 text-center">
                    {leader.image ? (
                      <motion.div
                        className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden border-4 border-green-500 shadow-lg"
                        whileHover={{ 
                          scale: 1.1,
                          rotate: 5,
                          transition: { duration: 0.3 }
                        }}
                      >
                        <img
                          src={leader.image}
                          alt={leader.name}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        className="w-32 h-32 rounded-full mx-auto mb-4 bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center border-4 border-green-500 shadow-lg"
                        whileHover={{ 
                          scale: 1.1,
                          rotate: 5,
                          transition: { duration: 0.3 }
                        }}
                      >
                        <span className="text-white text-3xl font-bold">
                          {leader.name.charAt(0)}
                        </span>
                      </motion.div>
                    )}
                    <h3 className="text-xl mb-1">{leader.name}</h3>
                    <div className="text-sm text-gray-500">{leader.role}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Final Words */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={scaleIn}
          transition={{ duration: 0.8 }}
          whileHover={{ scale: 1.02 }}
          className="mb-16 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white rounded-2xl p-12 shadow-2xl"
        >
          <motion.h2 
            variants={bounceIn}
            className="text-3xl text-center mb-6"
          >
            💬 Final Words
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-center text-lg leading-relaxed max-w-4xl mx-auto"
          >
            At {brand.name}, our mission is clear: to construct outstanding properties and ensure they receive the recognition they deserve. We believe in building more than structures; we create opportunities, communities, and a brighter future for all. We are dedicated to delivering value that stands the test of time, both in the physical and digital realms. We are committed to creating a seamless and enjoyable experience for our clients, making the process of buying, selling, or investing in real estate a positive and rewarding venture.
          </motion.p>
        </motion.div>

        {/* Contact Information */}
        <div>
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-3xl text-center mb-12"
          >
            📞 Get in Touch
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                title: "Corporate Office",
                content: (
                  <>
                    Level 18, 101 Collins Street,<br />
                    Melbourne VIC 3000<br />
                    Australia
                  </>
                )
              },
              {
                icon: Phone,
                title: "Phone",
                content: (
                  <>
                    {brand.contact.officePhone}<br />
                    Mon-Fri: 9 AM - 6 PM<br />
                    Saturday: 10 AM - 4 PM
                  </>
                )
              },
              {
                icon: Mail,
                title: "Email",
                content: (
                  <>
                    {brand.contact.email}<br />
                    <br />
                    We respond within 24 hours
                  </>
                )
              }
            ].map((contact, index) => {
              const Icon = contact.icon;
              return (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={bounceIn}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  whileHover={{ 
                    y: -10,
                    scale: 1.05,
                    transition: { duration: 0.3 }
                  }}
                >
                  <Card className="hover:shadow-xl transition-shadow h-full">
                    <CardContent className="p-6">
                      <motion.div 
                        whileHover={{ 
                          rotate: [0, -10, 10, -10, 0],
                          scale: 1.2
                        }}
                        transition={{ duration: 0.5 }}
                        className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4"
                      >
                        <Icon className="h-6 w-6 text-green-600" />
                      </motion.div>
                      <h3 className="text-lg mb-2">{contact.title}</h3>
                      <p className="text-gray-600">
                        {contact.content}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}