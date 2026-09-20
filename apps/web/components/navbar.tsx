"use client"

import Image from "next/image"
import { useSiteActions } from "@/components/layout/site-actions"

const NavBar = () => {
    const {
        openWallet,
        connected,
        address,
        isWrongNetwork,
        switchNetwork,
        disconnectWallet,
    } = useSiteActions()

    const formattedAddress = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : null

    return (
        <>
            <nav className="h-17.5 relative w-full px-6 md:px-16 lg:px-24 xl:px-32 flex items-center justify-between z-30 bg-white transition-all">
                {/* Logo */}
                <a href="/">
                    <Image
                        src="/icon.webp"
                        alt="Logo"
                        width={300}
                        height={300}
                    />
                </a>

                {/* Connect Wallet Button */}
                {isWrongNetwork ? (
                    <button
                        type="button"
                        onClick={switchNetwork}
                        className="bg-amber-600 text-white text-sm hover:opacity-90 active:scale-95 transition-all px-6 h-11 rounded-md"
                    >
                        Switch to BotChain Testnet
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={connected ? disconnectWallet : openWallet}
                        className="bg-[#2563EB] text-white text-sm hover:opacity-90 active:scale-95 transition-all px-6 h-11 rounded-md"
                    >
                        {connected ? (formattedAddress ?? "Disconnect Wallet") : "Connect Wallet"}
                    </button>
                )}
            </nav>
        </>
    )
}

export default NavBar