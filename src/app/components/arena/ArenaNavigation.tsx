"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, FolderSearch, LogIn, LogOut, Menu, Pencil, PlayingCardsFan, Swords, WalletCards, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import AliasEditor from "../auth/AliasEditor";
import { useUiVariant, variantHref } from "./uiVariant";

const navItems = [
  { href: "/", label: "Home", icon: Swords },
  { href: "/decks", label: "Decks", icon: WalletCards },
  { href: "/browse", label: "Browse", icon: FolderSearch },
  { href: "/cards", label: "Cards", icon: PlayingCardsFan },
];

const accountButtonClass = [
  "group inline-flex cursor-pointer items-center gap-2 border px-3 py-2",
  "text-sm transition",
  "hover:border-blue-300 bg-blue-400/10 text-white hover:shadow-[0_0_16px_rgba(79,169,255,.55)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
].join(" ");

const mobileIconButtonClass = "cursor-pointer text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300";

const accountAvatarClass = "grid size-6 shrink-0 place-items-center rounded-full border border-sky-200 bg-slate-100 text-xs font-bold text-slate-900";

const accountMenuItemClass = [
  "group flex w-full cursor-pointer items-center gap-3 border border-transparent px-3 py-2.5",
  "text-[15px] text-slate-200 outline-none transition",
  "data-[highlighted]:border-sky-300/45 data-[highlighted]:bg-blue-400/15 data-[highlighted]:text-white",
  "data-[highlighted]:shadow-[inset_3px_0_0_#4fa9ff]",
].join(" ");

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
  if (!session) return <button type="button" onClick={() => signIn()} className={inMobileMenu ? "group flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-sm border border-sky-200/30 bg-blue-400/10 px-3 py-3 text-left text-sm font-medium text-slate-100 transition hover:border-sky-200/60 hover:bg-blue-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300" : accountButtonClass}><LogIn size={16} />Sign in</button>;

  const name = alias || session.user?.name || session.user?.email || "Warlord";
  if (inMobileMenu) return <div className="grid gap-3 text-slate-100"><div className="flex min-h-11 items-center gap-2 border border-white/20 bg-blue-400/10 px-3 py-2 text-sm text-white"><span className={accountAvatarClass}>{name.slice(0, 1).toUpperCase()}</span><span className="min-w-0 truncate">{name}</span></div><div className="grid gap-1"><button type="button" className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-transparent px-3 py-2.5 text-left text-sm text-slate-200 transition hover:border-sky-300/45 hover:bg-blue-400/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300" onClick={() => setAliasEditorOpen(true)}><Pencil className="text-sky-300" size={16} /> Edit username</button><button type="button" className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-transparent px-3 py-2.5 text-left text-sm text-slate-300 transition hover:border-rose-300/35 hover:bg-rose-400/10 hover:text-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300" onClick={() => signOut()}><LogOut className="text-slate-400" size={16} /> Sign out</button></div>{aliasEditorOpen && <AliasEditor onClose={() => setAliasEditorOpen(false)} onSaved={setAlias} />}</div>;

  return <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <button type="button" className={accountButtonClass} aria-label="Open account menu">
        <span className={accountAvatarClass}>{name.slice(0, 1).toUpperCase()}</span>
        <span className="max-w-32 truncate">{name}</span>
        <ChevronDown className="text-sky-200/80 transition group-data-[state=open]:rotate-180" size={14} aria-hidden="true" />
      </button></DropdownMenu.Trigger>
    <DropdownMenu.Portal><DropdownMenu.Content className="z-[70] min-w-[210px] overflow-hidden border border-sky-200/45 bg-[linear-gradient(145deg,rgba(15,31,48,.98),rgba(3,10,18,.98))] p-1.5 text-slate-100 shadow-[0_18px_45px_rgba(0,0,0,.55),0_0_25px_rgba(79,169,255,.2)] backdrop-blur-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95" sideOffset={12} align="end">      <DropdownMenu.Item className={accountMenuItemClass} onSelect={() => setAliasEditorOpen(true)}><Pencil className="text-sky-300 transition group-data-[highlighted]:text-white" size={16} /> Edit username</DropdownMenu.Item>
      <DropdownMenu.Separator className="mx-2 my-1 border-t border-sky-200/15" />
      <DropdownMenu.Item className={`${accountMenuItemClass} text-slate-300 data-[highlighted]:border-red-300/35 data-[highlighted]:bg-red-400/10 data-[highlighted]:shadow-[inset_3px_0_0_#fb7185]`} onSelect={() => signOut()}><LogOut className="text-slate-400 transition group-data-[highlighted]:text-rose-200" size={16} /> Sign out</DropdownMenu.Item>
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
    if (href === "/browse") return pathname === href || pathname.startsWith(`${href}/`);
    if (href === "/decks") return pathname === href || /^\/decks\/[^/]+$/.test(pathname);
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return <header className="arena-navigation sticky top-0 z-20 flex items-center md:items-stretch h-16 shrink-0 border-b border-white/20 bg-slate-950/20 shadow-lg backdrop-blur md:h-[76px]">
    <Link href={variantHref("/", variant)} className="grid w-16 place-items-center md:border-r border-white/20 md:w-[102px]" aria-label="Legions Battleground home">
      <Image className="size-14 object-contain md:h-[42px] md:w-20" src="/logo.svg" alt="Legions Battleground" width={42} height={38} priority />
    </Link>
    <span className="sm:hidden ml-4 font-serif text-[16px] xs:text-[20px] ">Legions Battleground</span>
    <nav className="hidden md:flex" aria-label="Primary navigation">
      {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={variantHref(href, variant)}
        className={`relative grid min-w-[86px] place-items-center content-center gap-1 border-r border-white/20 font-serif text-[15px] text-slate-100 no-underline transition hover:bg-blue-400/10 hover:!text-sky-300 ${isActive(href) ? "bg-blue-400/10 !text-blue-300 shadow-[inset_0_-3px_0_#4fa9ff,0_0_14px_rgba(79,169,255,.45)]" : ""}`}>
        <Icon size={18} /><span>{label}</span></Link>)}
    </nav>
    <div className="ml-auto hidden items-center border-l border-white/20 px-5 md:flex"><AccountMenu /> <a className="mx-6 my-5 block text-sm text-slate-100" href="https://buymeacoffee.com/lukasrichardson" target="_blank" rel="noopener noreferrer">Support Battleground</a></div>
    <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={`ml-auto grid size-16 place-items-center border-l border-white/20 transition hover:bg-blue-400/10 md:hidden ${mobileIconButtonClass}`} aria-label="Open navigation">
          <Menu size={23} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-[radial-gradient(circle_at_top_right,rgba(39,111,178,.28),transparent_36%),rgba(1,5,10,.78)] backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-[81] flex w-[min(90vw,380px)] flex-col overflow-hidden border-l border-sky-200/35 bg-[linear-gradient(155deg,rgba(13,31,47,.99),rgba(3,10,18,.99)_52%,rgba(1,5,10,.99))] p-0 text-slate-100 shadow-[-20px_0_55px_rgba(0,0,0,.55),-1px_0_28px_rgba(79,169,255,.16)]" aria-describedby={undefined}>
          <div className="relative flex min-h-[88px] items-center gap-3 overflow-hidden border-b border-sky-200/20 px-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(91,183,255,.17),transparent_55%)]" />
            <Image className="relative size-22 object-contain" src="/logo.svg" alt="" width={44} height={44} /><Dialog.Close asChild><button type="button" className="ml-auto relative grid size-11 cursor-pointer place-items-center border border-sky-200/25 bg-slate-950/35 text-slate-100 transition hover:border-sky-200/60 hover:bg-blue-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300" aria-label="Close navigation"><X size={19} /></button></Dialog.Close></div>
          <div className="flex min-h-0 flex-1 flex-col px-4 py-5"><div className="min-h-0 overflow-y-auto"><nav className="grid gap-1" aria-label="Mobile navigation">{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={variantHref(href, variant)} onClick={() => setMobileOpen(false)} className={`group flex min-h-11 items-center gap-3 rounded-sm border px-3 py-3 text-[15px] font-medium text-slate-200 no-underline transition ${isActive(href) ? "border-sky-300/55 bg-blue-400/15 text-white shadow-[inset_3px_0_0_#4fa9ff,0_0_16px_rgba(79,169,255,.14)]" : "border-transparent hover:border-sky-200/25 hover:bg-white/5 hover:text-white"}`}><span className={`grid size-8 place-items-center border transition ${isActive(href) ? "border-sky-200/45 bg-sky-300/15 text-sky-100" : "border-slate-500/30 bg-slate-950/30 text-sky-200/70 group-hover:border-sky-200/35 group-hover:text-sky-100"}`}><Icon size={17} /></span>{label}</Link>)}</nav>
            <div className="my-2 border-t border-sky-200/20" />
            <section><AccountMenu inMobileMenu /></section>
            </div><a className="mt-4 flex min-h-11 shrink-0 items-center justify-between border border-sky-200/25 bg-slate-950/25 px-4 py-3 text-sm font-medium text-sky-100 no-underline transition hover:border-sky-200/55 hover:bg-blue-400/10" href="https://buymeacoffee.com/lukasrichardson" target="_blank" rel="noopener noreferrer"><span>Support Battleground</span><span className="text-sky-300">↗</span></a></div>
        </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </header>;
}
