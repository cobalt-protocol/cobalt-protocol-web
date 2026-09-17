import Image from "next/image"

const NavBar = () => {
    return (
        <>
            <nav className="h-17.5 relative w-full px-6 md:px-16 lg:px-24 xl:px-32 flex items-center justify-between z-30 bg-white transition-all">
                {/* Logo */}
                <a href="https://prebuiltui.com">
                    <Image
                        src="/icon.webp"
                        alt="Logo"
                        width={200}
                        height={200}
                    />
                </a>

                {/* Connect Wallet Button */}
                <button
                    type="button"
                    className="bg-[#2563EB] text-white text-sm hover:opacity-90 active:scale-95 transition-all px-6 h-11 rounded-md"
                >
                    Connect Wallet
                </button>
            </nav>
        </>
    )
}

export default NavBar