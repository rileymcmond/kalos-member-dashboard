import Image from "next/image"

type AuthSplitLayoutProps = {
  children: React.ReactNode
}

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <div className="relative h-48 shrink-0 sm:h-56 md:h-auto md:min-h-svh md:w-1/2">
        <Image
          src="/auth-split-bg.jpg"
          alt="Bright studio with someone stretching—wellness and movement"
          fill
          className="object-cover object-center"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/25 to-black/40 md:bg-gradient-to-r md:from-black/20 md:via-black/10 md:to-transparent"
          aria-hidden
        />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 border-border/50 bg-background p-6 md:w-1/2 md:max-w-none md:border-l md:px-10 md:py-12">
        <p className="text-lg font-semibold tracking-tight text-foreground">Kalos</p>
        {children}
      </div>
    </div>
  )
}
