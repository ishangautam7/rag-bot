import Link from 'next/link';
import { Button } from './components/UI/Button';
import { Card } from './components/UI/Card';
import { Bot, Zap, Shield, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] relative px-4 sm:px-6 lg:px-8 py-20">

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6 relative z-10">
        {/* <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 text-sm mb-4">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>AI-Powered Conversations</span>
        </div> */}

        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight text-neutral-100">
          Your Intelligent <br />
          <span className="text-neutral-400">AI Assistant</span>
        </h1>

        <p className="text-lg text-neutral-500 max-w-xl mx-auto leading-relaxed">
          Experience seamless AI conversations. Ask questions, get insights, and boost your productivity.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
          <Link href="/chat">
            <Button size="lg" variant="primary" icon={<Bot className="w-5 h-5" />}>
              Start Chatting
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="secondary" icon={<ArrowRight className="w-4 h-4" />}>
              Learn More
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="mt-24 w-full max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hoverEffect className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
              <Zap className="w-5 h-5 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-100">Fast Responses</h3>
            <p className="text-neutral-500 text-sm">
              Get instant answers powered by advanced AI technology.
            </p>
          </Card>

          <Card hoverEffect className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
              <Bot className="w-5 h-5 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-100">Smart Context</h3>
            <p className="text-neutral-500 text-sm">
              Upload documents and get contextual, accurate responses.
            </p>
          </Card>

          <Card hoverEffect className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
              <Shield className="w-5 h-5 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-100">Secure & Private</h3>
            <p className="text-neutral-500 text-sm">
              Your data stays private. We never share your conversations.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
