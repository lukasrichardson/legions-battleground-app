'use client'
import IMenuItem from "@/client/interfaces/IMenuItem";
import { Menu } from "antd";
import { MenuItemType } from "antd/es/menu/interface";
import { FC } from "react";

interface CardMenuProps {
  items: IMenuItem[];
  onMenuItemClick?: (items: IMenuItem[], key: string|number) => void;
  inline?: boolean;
  primaryItemKey?: string | number;
}

// Flip horizontally and shift vertically when a nested menu has no room on
// its preferred side. Zero offsets keep shifting inside the visible viewport.
const submenuPlacements = Object.fromEntries([
  ["rightTop", ["tl", "tr"]], ["rightBottom", ["bl", "br"]],
  ["leftTop", ["tr", "tl"]], ["leftBottom", ["br", "bl"]],
].map(([name, points]) => [name, { points, offset: [0, 0], overflow: { adjustX: true, adjustY: true, shiftX: true, shiftY: true } }]));

const toAntdMenuItems = (items: IMenuItem[], primaryItemKey?: string | number): MenuItemType[] =>
  items.map(({ children, ...item }) => {
    delete item.menuAction;
    return {
      ...item,
      ...(item.key === primaryItemKey ? { className: "game-card-menu__primary" } : {}),
      ...(children ? { children: toAntdMenuItems(children, primaryItemKey), popupClassName: "game-card-submenu", popupOffset: [0, 0] } : {}),
    };
  }) as MenuItemType[];

const CardMenu: FC<CardMenuProps> = ({items, onMenuItemClick, inline = false, primaryItemKey}) => {
  return (
    <Menu
        onClick={(e: { domEvent: { stopPropagation: () => void; }; key: string; }) => {
          e.domEvent.stopPropagation();
          if (!onMenuItemClick) return;
          onMenuItemClick(items, e.key);
        }}
        style={{ width: inline ? "100%" : "fit-content" }}
        mode={inline ? "inline" : "vertical"}
        theme="dark"
        inlineIndent={12}
        builtinPlacements={submenuPlacements}
        items={toAntdMenuItems(items || [], primaryItemKey)}
      />
  );
}

export default CardMenu;
