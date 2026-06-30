"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  Map,
  Brain,
  ChevronRight,
  Bot,
  Mic,
  BarChart3,
} from "lucide-react";

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
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Vision <span className="text-blue-200">AI</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
              AI-powered civic issue detection, reporting, and resolution platform.
              Report issues with a photo, get instant AI analysis, and track resolution in real-time.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/auth">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="border-b bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Powered by AI</h2>
            <p className="mt-2 text-muted-foreground">
              Combining YOLO vision detection with Gemini AI analysis
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <feature.icon className="h-12 w-12 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">How It Works</h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-5">
            {[
              { step: "1", title: "Capture", desc: "Take a photo of the issue" },
              { step: "2", title: "Detect", desc: "YOLO identifies the problem" },
              { step: "3", title: "Analyze", desc: "Gemini AI provides insights" },
              { step: "4", title: "Report", desc: "Auto-route to department" },
              { step: "5", title: "Resolve", desc: "Track until resolution" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {item.step}
                </div>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Google Technologies Used</h2>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {[
              "Gemini API",
              "Firebase Auth",
              "Firestore",
              "Firebase Storage",
              "Cloud Messaging",
              "Cloud Run",
              "YOLO",
              "Next.js",
            ].map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>Built for Hackathon | Vision AI - Making Cities Smarter</p>
        </div>
      </footer>
    </div>
  );
}
