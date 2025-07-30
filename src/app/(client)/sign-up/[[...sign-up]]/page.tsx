import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

function SignUpPage() {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-white absolute top-0 left-0 z-50">
      <div className="hidden md:block align-middle my-auto">
        <SignUp forceRedirectUrl="/dashboard" />
      </div>
      <div className="block md:hidden px-3 h-[60%] my-auto">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/sts-logo.svg"
            alt="STS Logo"
            width={150}
            height={50}
            className="h-12 w-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-center text-gray-800">
            Welcome to STS
          </h1>
        </div>
        <h1 className="text-md my-3 text-center text-gray-800">
          Mobile version is currently under construction. 🚧
        </h1>
        <p className="text-center text-gray-600 mt-3">
          Please sign in using a PC for the best experience. Sorry for the
          inconvenience.
        </p>
      </div>
    </div>
  );
}
export default SignUpPage;
