import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/client/ui/breadcrumb";
import Link from "next/link";
import Image from "next/image";

export default function Breadcrumbs({breadcrumbs, className}: {breadcrumbs: {name: string, path: string}[], className?: string}) {
  const currentIndex = breadcrumbs.length - 1;

  return (
    <div className={`inline-flex max-w-[calc(100vw-5rem)] rounded-xl border border-white/20 bg-slate-950/45 p-1.5 shadow-sm backdrop-blur-sm sm:max-w-[calc(100vw-9rem)] sm:p-2 ${className ?? ""}`}>
      <Breadcrumb>
        <BreadcrumbList className="flex-nowrap gap-1 text-sm sm:gap-1.5 sm:text-base lg:text-lg">
          {breadcrumbs.map((breadcrumb, index) => (
            <div
              key={breadcrumb.path}
              className={`min-w-0 items-center gap-1 sm:flex ${index > 0 && index < currentIndex ? "hidden" : "flex"}`}
            >
              {index > 0 && <BreadcrumbSeparator key={`sep-${index}`} />}
              <BreadcrumbItem key={breadcrumb.name}>
                {index === currentIndex ? (
                  <span aria-current="page" className="block max-w-40 truncate px-1.5 py-1 font-semibold text-white sm:max-w-72 sm:px-2">
                    {breadcrumb.name}
                  </span>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={breadcrumb.path}
                      aria-label={index === 0 ? "Home" : undefined}
                      className="flex items-center gap-1 rounded-md px-1.5 py-1 font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white sm:px-2"
                    >
                      {index === 0 && <Image src="/logo.svg" alt="" width={20} height={20} className="h-4 w-4 object-contain sm:h-5 sm:w-5" />}
                      <span className={index === 0 ? "hidden sm:inline" : "truncate"}>{breadcrumb.name}</span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
