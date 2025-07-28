import Link from "next/link";
import React from "react";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import Image from "next/image";

function Navbar() {
  return (
    <div className="fixed inset-x-0 top-0 bg-slate-100  z-[10] h-fit  py-4 ">
      <div className="flex items-center justify-between h-full gap-2 px-8 mx-auto">
        <div className="flex flex-row gap-3 justify-center">
          <Link href={"/dashboard"} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Image
                src="/sts-logo.svg"
                alt="STS Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
              <span className="text-[8px] text-gray-600">Beta</span>
            </div>
          </Link>
          <p className="my-auto text-xl">/</p>
          <div className="my-auto">
            <OrganizationSwitcher
              afterCreateOrganizationUrl="/dashboard"
              hidePersonal={true}
              afterSelectOrganizationUrl="/dashboard"
              afterLeaveOrganizationUrl="/dashboard"
              appearance={{
                variables: {
                  fontSize: "0.9rem",
                },
              }}
            />
          </div>
        </div>
        <div className="flex items-center">
          <UserButton afterSignOutUrl="/sign-in" signInUrl="/sign-in" />
        </div>
      </div>
    </div>
  );
}

export default Navbar;
