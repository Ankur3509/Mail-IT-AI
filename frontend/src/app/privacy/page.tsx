"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-primary font-medium hover:underline mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to App
                </Link>

                <div className="glass-card p-8 sm:p-12 rounded-3xl">
                    <div className="flex items-center gap-3 mb-6">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-extrabold text-gray-900">Privacy Policy</h1>
                    </div>

                    <div className="prose prose-blue text-gray-600 space-y-6">
                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">1. Introduction</h2>
                            <p>
                                Welcome to Mailit AI. We are committed to protecting your personal information and your right to privacy.
                                This Privacy Policy explains how we handle your data when you use our service, particularly your Gmail data.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">2. Data We Access</h2>
                            <p>
                                When you connect your Gmail account, we request permission to:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Send emails on your behalf.</li>
                                <li>Create and manage drafts in your Gmail account.</li>
                                <li>View your email address to identify your account.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">3. How We Use Your Data</h2>
                            <p>
                                <b>Mailit AI does not store your emails, contacts, or personal data on our servers.</b>
                                We use the Google OAuth tokens solely to perform the actions you explicitly request (like "Send" or "Save Draft").
                                Your authentication tokens are stored locally in your browser and are sent to our backend only during active requests.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">4. AI Processing</h2>
                            <p>
                                The email content is generated using Groq's Llama 3.1 models. We only send the parameters you provide
                                (Names, Purpose, Tone) to the AI model to generate the draft. No personal identification data from your
                                Gmail account is shared with the AI providers.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">5. Data Retention</h2>
                            <p>
                                We do not maintain a database of your emails. Once an email is sent or a draft is created, the data is
                                handled by Google's servers according to their privacy policy.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">6. Contact Us</h2>
                            <p>
                                If you have questions about this policy, you can contact us through the repository or the developer's
                                provided contact information.
                            </p>
                        </section>

                        <footer className="pt-8 border-t border-gray-100 text-sm italic">
                            Last updated: January 9, 2026
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
}
