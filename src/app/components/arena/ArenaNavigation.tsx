"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { BookOpen, Boxes, LogIn, LogOut, Menu, Pencil, Shield, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import AliasEditor from "../auth/AliasEditor";
import { useUiVariant, variantHref } from "./uiVariant";

const navItems = [
  { href: "/", label: "Home", icon: Shield },
  { href: "/decks", label: "Decks", icon: Boxes },
  { href: "/decks/browse", label: "Browse", icon: BookOpen },
  { href: "/cards", label: "Cards", icon: BookOpen },
];

const accountButtonClass = [
  "inline-flex cursor-pointer items-center gap-2 border px-3 py-2",
  "font-serif text-sm transition",
  "hover:border-blue-300 bg-blue-400/10 text-white hover:shadow-[0_0_16px_rgba(79,169,255,.55)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
].join(" ");

const mobileIconButtonClass = "cursor-pointer text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300";

function AccountMenu({ inMobileMenu = false }: { inMobileMenu?: boolean }) {
  const { data: session, status } = useSession();
  const [aliasEditorOpen, setAliasEditorOpen] = useState(false);
  const [alias, setAlias] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setAlias(null); return; }
    void fetch("/api/me/alias").then(async (response) => response.ok ? response.json() as Promise<{ alias: string | null }> : { alias: null })
      .then((data) => setAlias(data.alias)).catch(() => setAlias(null));
  }, [session]);

  if (status === "loading") return null;
  if (!session) return <button type="button" onClick={() => signIn()} className={inMobileMenu ? "mt-2 grid cursor-pointer border-t border-white/20 px-3 py-3 text-left text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300" : accountButtonClass}><LogIn size={16} /> Sign in</button>;

  const name = alias || session.user?.name || session.user?.email || "Warlord";
  if (inMobileMenu) return <div className="mt-2 grid gap-1 border-t border-white/20 px-3 py-3 text-slate-100"><span>{name}</span><button type="button" className="flex cursor-pointer items-center gap-2 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300" onClick={() => setAliasEditorOpen(true)}><Pencil size={15} /> Edit username</button><button type="button" className="flex cursor-pointer items-center gap-2 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300" onClick={() => signOut()}><LogOut size={15} /> Sign out</button>{aliasEditorOpen && <AliasEditor onClose={() => setAliasEditorOpen(false)} onSaved={setAlias} />}</div>;

  return <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <button type="button" className={accountButtonClass} aria-label="Open account menu">
        <span className="grid size-6 place-items-center rounded-full border border-sky-200 bg-slate-100 text-xs font-bold text-slate-900">{name.slice(0, 1).toUpperCase()}</span>
        <span>{name}</span>
      </button></DropdownMenu.Trigger>
    <DropdownMenu.Portal><DropdownMenu.Content className="z-[70] min-w-[185px] border border-sky-200/40 bg-slate-950/95 p-1.5 text-slate-100 shadow-2xl" sideOffset={10} align="end">
      <DropdownMenu.Label>{name}</DropdownMenu.Label><DropdownMenu.Separator />
      <DropdownMenu.Item onSelect={() => setAliasEditorOpen(true)}><Pencil size={15} /> Edit username</DropdownMenu.Item>
      <DropdownMenu.Item onSelect={() => signOut()}><LogOut size={15} /> Sign out</DropdownMenu.Item>
    </DropdownMenu.Content></DropdownMenu.Portal>
    {aliasEditorOpen && <AliasEditor onClose={() => setAliasEditorOpen(false)} onSaved={setAlias} />}
  </DropdownMenu.Root>;
}

export default function ArenaNavigation() {
  const pathname = usePathname();
  const variant = useUiVariant();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/decks/browse") return pathname === href || pathname.startsWith(`${href}/`);
    if (href === "/decks") return pathname === href || /^\/decks\/(?!browse(?:\/|$))[^/]+$/.test(pathname);
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return <header className="arena-navigation sticky top-0 z-20 flex h-16 shrink-0 border-b border-white/20 bg-slate-950/20 shadow-lg backdrop-blur md:h-[76px]">
    <Link href={variantHref("/", variant)} className="grid w-16 place-items-center md:border-r border-white/20 md:w-[82px]" aria-label="Legions Battleground home">
      <Image className="size-14 object-contain md:h-[42px] md:w-20" src="/logo.svg" alt="Legions Battleground" width={42} height={38} priority />
    </Link>
    <nav className="hidden md:flex" aria-label="Primary navigation">
      {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={variantHref(href, variant)}
      className={`relative grid min-w-[86px] place-items-center content-center gap-1 border-r border-white/20 font-serif text-[15px] text-slate-100 no-underline transition hover:bg-blue-400/10 hover:!text-sky-300 ${isActive(href) ? "bg-blue-400/10 !text-blue-300 shadow-[inset_0_-3px_0_#4fa9ff,0_0_14px_rgba(79,169,255,.45)]" : ""}`}>
        <Icon size={18} /><span>{label}</span></Link>)}
    </nav>
    <div className="ml-auto hidden items-center border-l border-white/20 px-5 md:flex"><AccountMenu /></div>
    <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
      <Dialog.Trigger asChild><button type="button" className={`ml-auto border-l border-white/20 px-5 md:hidden ${mobileIconButtonClass}`} aria-label="Open navigation"><Menu size={24} /></button></Dialog.Trigger>
      <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" /><Dialog.Content className="fixed inset-y-0 right-0 z-[81] w-[min(86vw,355px)] border-l border-white/25 bg-slate-950 p-0 shadow-2xl" aria-describedby={undefined}>
        <div className="flex h-[70px] items-center justify-between border-b border-white/20 px-5"><Dialog.Title className="font-serif text-xl">Legions Battleground</Dialog.Title><Dialog.Close asChild><button type="button" className={mobileIconButtonClass} aria-label="Close navigation"><X size={22} /></button></Dialog.Close></div>
        <nav className="grid gap-1 p-3" aria-label="Mobile navigation">{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={variantHref(href, variant)} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-3.5 font-serif text-[17px] text-slate-100 no-underline ${isActive(href) ? "border-l-[3px] border-blue-400 bg-blue-400/10 text-blue-300" : ""}`}><Icon size={18} />{label}</Link>)}</nav>
        <AccountMenu inMobileMenu />
        <a className="mx-6 my-5 block text-sm text-slate-100" href="https://buymeacoffee.com/lukasrichardson" target="_blank" rel="noopener noreferrer">Support Battleground</a>
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </header>;
}
