import Image from "next/image";

export default function Footer() {
  return(
    <footer className="w-full bg-[#010433] text-white px-4 py-6">
      <div className="max-w-ful mx-auto px-6 flex justify-between">

        {/* Left side (Logo + Copyright) */}
        <div className="flex flex-col space-y-4 ">
          <Image
            src="/images/VLU-Renting-Logo.svg"
            alt="VLU Renting Logo"
            width={187}
            height={57}
            className="object-contain"
          />

          <p className="text-sm text-gray-300">
            Copyright 2025 © VLU Renting. All Right Reserved
          </p>
        </div>

        {/* Right side (Links) */}
        <div className="flex items-center space-x-12 text-s font-medium">
          <a href='#' className="hover:text-red-400 transistion">Term of Service</a>
          <a href='#' className="hover:text-red-400 transistion">Privacy Policy</a>
          <a href='#' className="hover:text-red-400 transistion">Contact Us</a>
        </div>

      </div>
    </footer>
  );
}