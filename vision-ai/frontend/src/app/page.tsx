"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Camera,
  Map,
  Brain,
  ChevronRight,
  Bot,
  Mic,
  BarChart3,
  Shield,
  Zap,
  Sparkles,
  CheckCircle,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default function Home() {
  const features = [
    {
      icon: Camera,
      title: "Image Detection",
      description: "YOLO-powered real-time detection of potholes, garbage, and other civic issues",
    },
    {
      icon: Brain,
      title: "AI Analysis",
      description: "Gemini AI provides detailed analysis, root cause, and repair suggestions",
    },
    {
      icon: Map,
      title: "Live Mapping",
      description: "Interactive Leaflet map showing all reported issues in your area",
    },
    {
      icon: Bot,
      title: "AI Chatbot",
      description: "Get instant help from our AI assistant for reporting and tracking",
    },
    {
      icon: Mic,
      title: "Voice Reports",
      description: "Report issues using voice commands with Whisper transcription",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "AI-powered insights and predictive analytics for city officials",
    },
  ];

  const stats = [
    { value: "10K+", label: "Issues Reported" },
    { value: "85%", label: "Resolution Rate" },
    { value: "50+", label: "Cities" },
    { value: "2.3 days", label: "Avg Resolution" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm text-white/80 mb-6">
                <Sparkles className="h-3 w-3" /> AI-Powered Civic Platform
              </span>
            </motion.div>
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
              Vision <span className="text-blue-200">AI</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
              AI-powered civic issue detection, reporting, and resolution platform.
              Report issues with a photo, get instant AI analysis, and track resolution in real-time.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-10 flex items-center justify-center gap-4 flex-wrap"
            >
              <Link href="/auth">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  View Demo
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </header>

      {/* Stats */}
      <motion.section {...fadeUp} className="border-b bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section {...fadeUp} className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Powered by AI</h2>
            <p className="mt-2 text-muted-foreground">
              Combining YOLO vision detection with Gemini AI analysis
            </p>
          </div>
          <motion.div
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={{
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
                  <CardContent className="p-6">
                    <feature.icon className="h-12 w-12 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section {...fadeUp} className="bg-muted/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">How It Works</h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-5">
            {[
              { step: "1", title: "Capture", desc: "Take a photo of the issue", icon: Camera },
              { step: "2", title: "Detect", desc: "YOLO identifies the problem", icon: Zap },
              { step: "3", title: "Analyze", desc: "Gemini AI provides insights", icon: Brain },
              { step: "4", title: "Report", desc: "Auto-route to department", icon: Shield },
              { step: "5", title: "Resolve", desc: "Track until resolution", icon: CheckCircle },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="text-center"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {item.step}
                </div>
                <item.icon className="mx-auto mt-3 h-6 w-6 text-primary" />
                <h3 className="mt-2 font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Tech Stack */}
      <motion.section {...fadeUp} className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Google Technologies</h2>
            <p className="mt-2 text-muted-foreground">Built on Google Cloud & AI stack</p>
          </div>
          <motion.div
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            {[
              "Gemini API", "Firebase Auth", "Cloud Firestore", "Firebase Storage",
              "Cloud Messaging", "Cloud Run", "YOLO", "Next.js",
            ].map((tech, i) => (
              <motion.span
                key={tech}
                variants={{
                  initial: { opacity: 0, scale: 0.8 },
                  whileInView: { opacity: 1, scale: 1 },
                }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                {tech}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section {...fadeUp} className="bg-gradient-to-r from-blue-600 to-purple-700 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to Make Your City Smarter?</h2>
          <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
            Join thousands of citizens using AI to report and resolve civic issues faster.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/auth">
              <Button size="lg" className="mt-8 bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
                Get Started Now
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>Vision AI — Making Cities Smarter with AI</p>
        </div>
      </footer>
    </div>
  );
}
