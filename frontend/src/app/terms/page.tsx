"use client";

import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
                        <FileText className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-extrabold text-gray-900">Terms of Service</h1>
                    </div>

                    <div className="prose prose-blue text-gray-600 space-y-6">
                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">1. Acceptance of Terms</h2>
                            <p>
                                By accessing and using Mail IT AI, you agree to be bound by these Terms of Service.
                                If you do not agree, please do not use the service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">2. Description of Service</h2>
                            <p>
                                Mail IT AI is an AI-powered tool that assists users in drafting and sending emails via their own Gmail accounts
                                using Google OAuth2 integration and Groq AI models.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">3. User Responsibility</h2>
                            <p>
                                You are responsible for all content sent through the service. You agree not to use Mail IT AI for:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Sending spam or unsolicited bulk emails.</li>
                                <li>Impersonating others or fraudulent activities.</li>
                                <li>Sending malicious software or harmful content.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">4. Intelletual Property</h2>
                            <p>
                                The code for Mail IT AI is provided as-is. The generated email drafts are yours to use,
                                but we do not guarantee the accuracy or correctness of the AI-generated content.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">5. Limitation of Liability</h2>
                            <p>
                                Mail IT AI is provided "as is" without any warranties. We are not liable for any damages
                                arising from the use or inability to use this service, including errors in email delivery
                                or AI-generated content.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">6. Changes to Terms</h2>
                            <p>
                                We reserve the right to modify these terms at any time. Your continued use of the service
                                after changes constitutes acceptance of the new terms.
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
