'use client'

export function ProductCardSkeleton() {
  return (
    <div className="glass-card p-6 rounded-lg space-y-4 animate-pulse">
      <div className="h-48 bg-muted/20 rounded-lg" />
      <div className="h-6 bg-muted/20 rounded w-3/4" />
      <div className="h-4 bg-muted/20 rounded w-1/2" />
      <div className="h-6 bg-muted/20 rounded w-1/3" />
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="h-96 bg-muted/20 rounded-lg animate-pulse" />
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-muted/20 rounded w-3/4" />
          <div className="h-6 bg-muted/20 rounded w-1/2" />
          <div className="h-4 bg-muted/20 rounded w-full" />
          <div className="h-4 bg-muted/20 rounded w-5/6" />
          <div className="h-12 bg-muted/20 rounded w-full mt-8" />
        </div>
      </div>
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-muted/20 rounded w-1/2" />
      <div className="h-4 bg-muted/20 rounded w-2/3" />
      <div className="h-4 bg-muted/20 rounded w-1/3" />
    </div>
  )
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-muted/20 rounded w-full" />
      ))}
    </div>
  )
}
