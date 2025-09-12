import React from "react";

const Privacy = () => {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<div className="mx-auto max-w-3xl px-6 py-10">
				<h1 className="mb-4 text-3xl font-bold">Privacy Policy</h1>
				<p className="mb-6 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

				<p className="mb-4">
					Your privacy is important to us. This Privacy Policy explains how we collect, use,
					and safeguard your information when you use our application.
				</p>

				<h2 className="mt-8 mb-2 text-xl font-semibold">Information We Collect</h2>
				<ul className="list-disc pl-6 space-y-2">
					<li>Account information such as name and email address.</li>
					<li>Authentication data to sign you in securely.</li>
					<li>Usage data related to how you interact with the app.</li>
				</ul>

				<h2 className="mt-8 mb-2 text-xl font-semibold">How We Use Information</h2>
				<ul className="list-disc pl-6 space-y-2">
					<li>To provide and maintain the service.</li>
					<li>To improve user experience and app performance.</li>
					<li>To communicate updates, security alerts, and support messages.</li>
				</ul>

				<h2 className="mt-8 mb-2 text-xl font-semibold">Data Sharing</h2>
				<p className="mb-4">
					We do not sell your personal information. We may share data with trusted service providers
					doing work on our behalf, under appropriate confidentiality and security obligations.
				</p>

				<h2 className="mt-8 mb-2 text-xl font-semibold">Data Retention</h2>
				<p className="mb-4">
					We retain your information only for as long as necessary to provide the service
					and comply with legal obligations.
				</p>

				<h2 className="mt-8 mb-2 text-xl font-semibold">Your Rights</h2>
				<ul className="list-disc pl-6 space-y-2">
					<li>Access, update, or delete your account information.</li>
					<li>Withdraw consent where consent is the basis of processing.</li>
					<li>Contact us with questions about your data.</li>
				</ul>

				<h2 className="mt-8 mb-2 text-xl font-semibold">Security</h2>
				<p className="mb-4">
					We implement technical and organizational measures designed to protect your information.
					However, no method of transmission over the Internet is 100% secure.
				</p>

				<h2 className="mt-8 mb-2 text-xl font-semibold">Contact Us</h2>
				<p>
					If you have any questions about this Privacy Policy, please contact us at
					<span className="font-medium"> satyamchaturvedi71@gmail.com</span>.
				</p>
			</div>
		</div>
	);
};

export default Privacy;


