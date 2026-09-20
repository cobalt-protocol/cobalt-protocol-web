"use client"

import Image from "next/image"
import { useSiteActions } from "@/components/layout/site-actions"
import { AccountMenu } from "@/components/layout/account-menu"

const NavBar = () => {
    const {
        openWallet,
        connected,
        isWrongNetwork,
        switchNetwork,
    } = useSiteActions()

    return (
        <>
            <nav className="h-17.5 relative w-full px-6 md:px-16 lg:px-24 xl:px-32 flex items-center justify-between z-30 bg-white transition-all">
                {/* Logo */}
                <a href="/">
                    <Image
                        src="/icon.webp"
                        alt="Logo"
                        width={300}
                        height={75}
                        style={{ height: "auto" }}
                        className="w-[300px] object-contain"
                    />
                </a>

                {/* Connect Wallet / Account Menu */}
                {isWrongNetwork ? (
                    <button
                        type="button"
                        onClick={switchNetwork}
                        className="bg-amber-600 text-white text-sm hover:opacity-90 active:scale-95 transition-all px-6 h-11 rounded-md"
                    >
                        Switch to BotChain Testnet
                    </button>
                ) : connected ? (
                    <AccountMenu />
                ) : (
                    <button
                        type="button"
                        onClick={openWallet}
                        className="bg-[#2563EB] text-white text-sm hover:opacity-90 active:scale-95 transition-all px-6 h-11 rounded-md font-medium"
                    >
                        Connect Wallet
                    </button>
                )}
            </nav>
        </>
    )
}

export default NavBar