import Logo from "./logo"
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { OnboardingForm } from "./onboardingForm";


export default function OnboardingComponent({ name }: { name?: string }) {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <a href="#" className="flex items-center gap-2 font-medium">
                        <Logo />
                    </a>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <h2 className="text-2xl font-bold tracking-tight">
                            Welcome{name ? `, ${name}` : ''}
                        </h2>
                        <p>We'd like to know more about you.</p>
                        <OnboardingForm />
                    </div>
                </div>
            </div>
            <div className="bg-muted relative hidden lg:block">
                <DotLottieReact
                    src="https://lottie.host/0a839e99-2b8d-4157-aa90-e99f53444eb3/GCKLxEIu9G.lottie"
                    loop
                    autoplay
                />
            </div>
        </div>
    )
}
